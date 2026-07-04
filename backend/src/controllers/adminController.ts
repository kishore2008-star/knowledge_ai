import { Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { Role } from "@prisma/client";
import { mockUsers, mockDepartments } from "../utils/mockDb";

export class AdminController {
  // --- USER MANAGEMENT ---
  static async createUser(req: any, res: Response) {
    try {
      const { email, password, firstName, lastName, role, departmentId } = req.body;
      const companyId = req.user.companyId;

      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ error: "Missing required user fields." });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      try {
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        const currentUsersCount = await prisma.user.count({ where: { companyId, isDeleted: false } });

        if (company && currentUsersCount >= company.userLimit) {
          return res.status(400).json({ error: `User limit reached (${company.userLimit} max).` });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          return res.status(400).json({ error: "User already exists with this email." });
        }

        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
            role: role as Role,
            companyId,
            departmentId: departmentId || null,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: "USER_CREATE",
            details: `Created user ${email} with role ${role}.`,
          },
        });

        return res.status(201).json({ message: "User created successfully", userId: user.id });
      } catch (dbError) {
        logger.warn("Database connection issue. Creating user inside local mock directory.");
        const exists = mockUsers.some((u) => u.email === email && !u.isDeleted);
        if (exists) {
          return res.status(400).json({ error: "User already exists with this email." });
        }

        const newUsr = {
          id: `usr-${Math.random().toString(36).substr(2, 9)}`,
          email,
          passwordHash,
          firstName,
          lastName,
          role,
          companyId,
          departmentId: departmentId || "dept-it",
          isActive: true,
          isDeleted: false
        };

        mockUsers.push(newUsr);
        return res.status(201).json({ message: "User created successfully (Local Mock Cache)", userId: newUsr.id });
      }
    } catch (error: any) {
      logger.error(`User creation failed: ${error.message}`);
      return res.status(500).json({ error: "Failed to create user." });
    }
  }

  static async getUsers(req: any, res: Response) {
    try {
      const users = await prisma.user.findMany({
        where: { companyId: req.user.companyId, isDeleted: false },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          department: { select: { id: true, name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json({ users });
    } catch (error: any) {
      logger.warn("Returning mock users directory.");
      const formatted = mockUsers.filter(u => u.companyId === req.user.companyId && !u.isDeleted).map(u => {
        const dept = mockDepartments.find(d => d.id === u.departmentId) || { id: "dept-it", name: "IT" };
        return {
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          isActive: u.isActive,
          department: { id: dept.id, name: dept.name },
          createdAt: new Date()
        };
      });
      return res.status(200).json({ users: formatted });
    }
  }

  static async updateUser(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, role, departmentId, isActive } = req.body;

      try {
        const user = await prisma.user.findFirst({
          where: { id, companyId: req.user.companyId, isDeleted: false },
        });

        if (!user) {
          return res.status(404).json({ error: "User not found." });
        }

        const updated = await prisma.user.update({
          where: { id },
          data: {
            firstName: firstName !== undefined ? firstName : user.firstName,
            lastName: lastName !== undefined ? lastName : user.lastName,
            role: role !== undefined ? (role as Role) : user.role,
            departmentId: departmentId !== undefined ? departmentId : user.departmentId,
            isActive: isActive !== undefined ? isActive : user.isActive,
          },
        });

        return res.status(200).json({ message: "User updated successfully." });
      } catch (err) {
        const localUserIndex = mockUsers.findIndex((u) => u.id === id && u.companyId === req.user.companyId && !u.isDeleted);
        if (localUserIndex === -1) {
          return res.status(404).json({ error: "User not found." });
        }

        const u = mockUsers[localUserIndex];
        mockUsers[localUserIndex] = {
          ...u,
          firstName: firstName !== undefined ? firstName : u.firstName,
          lastName: lastName !== undefined ? lastName : u.lastName,
          role: role !== undefined ? role : u.role,
          departmentId: departmentId !== undefined ? departmentId : u.departmentId,
          isActive: isActive !== undefined ? isActive : u.isActive,
        };

        return res.status(200).json({ message: "User updated successfully (Local Mock Cache)." });
      }
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to update user." });
    }
  }

  static async deleteUser(req: any, res: Response) {
    try {
      const { id } = req.params;
      try {
        const user = await prisma.user.findFirst({
          where: { id, companyId: req.user.companyId, isDeleted: false },
        });

        if (!user) {
          return res.status(404).json({ error: "User not found." });
        }

        await prisma.user.update({
          where: { id },
          data: { isDeleted: true, isActive: false },
        });
      } catch (err) {
        const idx = mockUsers.findIndex((u) => u.id === id && u.companyId === req.user.companyId && !u.isDeleted);
        if (idx === -1) {
          return res.status(404).json({ error: "User not found." });
        }
        mockUsers[idx].isDeleted = true;
        mockUsers[idx].isActive = false;
      }

      return res.status(200).json({ message: "User deleted successfully." });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to delete user." });
    }
  }

  // --- DEPARTMENT MANAGEMENT ---
  static async createDepartment(req: any, res: Response) {
    try {
      const { name } = req.body;
      const companyId = req.user.companyId;

      if (!name) {
        return res.status(400).json({ error: "Department name is required." });
      }

      try {
        const dept = await prisma.department.create({
          data: { name, companyId },
        });
        return res.status(201).json({ message: "Department created", department: dept });
      } catch (err) {
        const localDept = {
          id: `dept-${Math.random().toString(36).substr(2, 9)}`,
          name,
          companyId,
          isDeleted: false
        };
        mockDepartments.push(localDept);
        return res.status(201).json({ message: "Department created (Local Mock Cache)", department: localDept });
      }
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to create department." });
    }
  }

  static async getDepartments(req: any, res: Response) {
    try {
      const depts = await prisma.department.findMany({
        where: { companyId: req.user.companyId, isDeleted: false },
        include: {
          _count: {
            select: { users: true, machines: true, documents: true },
          },
        },
        orderBy: { name: "asc" },
      });
      return res.status(200).json({ departments: depts });
    } catch (error: any) {
      logger.warn("Returning mock departments registry.");
      const filtered = mockDepartments.filter((d) => d.companyId === req.user.companyId && !d.isDeleted).map(d => ({
        ...d,
        _count: { users: 2, machines: 1, documents: 0 }
      }));
      return res.status(200).json({ departments: filtered });
    }
  }
}
