import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { Role } from "@prisma/client";
import {
  mockUsers,
  mockCompanies,
  mockDepartments,
  mockSessions,
  mockAuditLogs
} from "../utils/mockDb";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkeychangeinproduction";
const JWT_EXPIRES_IN = "1d";

export class AuthController {
  static async registerCompany(req: Request, res: Response) {
    try {
      const {
        companyName,
        industry,
        country,
        timezone,
        adminEmail,
        adminPassword,
        adminFirstName,
        adminLastName,
      } = req.body;

      if (!companyName || !adminEmail || !adminPassword) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      // Check if user exists (Db or Mock)
      let userExists = false;
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: adminEmail },
        });
        if (existingUser) userExists = true;
      } catch (err) {
        userExists = mockUsers.some((u) => u.email === adminEmail);
      }

      if (userExists) {
        return res.status(400).json({ error: "Email already registered." });
      }

      const passwordHash = await bcrypt.hash(adminPassword, 10);

      try {
        // DB Transaction
        const result = await prisma.$transaction(async (tx) => {
          const company = await tx.company.create({
            data: { name: companyName, industry, country, timezone },
          });

          const defaultDepts = ["Production", "Maintenance", "Safety", "Quality Control", "IT"];
          const deptsCreated = await Promise.all(
            defaultDepts.map((name) =>
              tx.department.create({
                data: { name, companyId: company.id },
              })
            )
          );

          const adminUser = await tx.user.create({
            data: {
              email: adminEmail,
              passwordHash,
              firstName: adminFirstName || "Admin",
              lastName: adminLastName || "User",
              role: Role.ADMIN,
              companyId: company.id,
              departmentId: deptsCreated[4].id,
            },
          });

          return { company, adminUser };
        });

        logger.info(`Company ${companyName} and Admin ${adminEmail} registered in Postgres.`);
        return res.status(201).json({
          message: "Company registered successfully.",
          companyId: result.company.id,
          adminId: result.adminUser.id,
        });
      } catch (dbError) {
        logger.warn("Database connection issue. Creating workspace inside mock cache.");

        // Fallback Mock Ingestion
        const companyId = `comp-${Math.random().toString(36).substr(2, 9)}`;
        const userId = `usr-${Math.random().toString(36).substr(2, 9)}`;

        const companyObj = {
          id: companyId,
          name: companyName,
          industry,
          country,
          timezone,
          subscription: "Standard",
          storageLimitGb: 10,
          userLimit: 50
        };

        const adminObj = {
          id: userId,
          email: adminEmail,
          passwordHash,
          firstName: adminFirstName || "Admin",
          lastName: adminLastName || "User",
          role: "ADMIN" as Role,
          isActive: true,
          companyId,
          departmentId: "dept-it"
        };

        mockCompanies.push(companyObj);
        mockUsers.push(adminObj);

        return res.status(201).json({
          message: "Company registered successfully (Local Mock Cache).",
          companyId,
          adminId: userId,
        });
      }
    } catch (error: any) {
      logger.error(`Company registration failed: ${error.message}`);
      return res.status(500).json({ error: "Registration failed." });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      let user: any = null;
      let isMockFallback = false;

      try {
        user = await prisma.user.findFirst({
          where: { email, isDeleted: false },
          include: { company: true },
        });
      } catch (dbError) {
        logger.warn(`Database connection failed for login ${email}. Falling back to mock parameters.`);
        const localUser = mockUsers.find((u) => u.email === email && !u.isDeleted);
        if (localUser) {
          const localComp = mockCompanies.find((c) => c.id === localUser.companyId) || { name: "Local Sandbox Corp" };
          user = {
            ...localUser,
            company: localComp
          };
          isMockFallback = true;
        }
      }

      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Invalid credentials or inactive account." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      // Generate JWT Token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          departmentId: user.departmentId,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      if (!isMockFallback) {
        await prisma.session.create({
          data: {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "USER_LOGIN",
            details: `User ${user.email} successfully logged in.`,
            ipAddress: req.ip,
          },
        });
      } else {
        mockSessions.push({
          id: `sess-${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        mockAuditLogs.push({
          userId: user.id,
          action: "USER_LOGIN",
          details: `User ${user.email} logged in (Local Mock Cache).`,
        });
      }

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          company: user.company.name,
          companyId: user.companyId,
          departmentId: user.departmentId,
        },
      });
    } catch (error: any) {
      logger.error(`Login failed: ${error.message}`);
      return res.status(500).json({ error: "Login failed." });
    }
  }

  static async me(req: any, res: Response) {
    try {
      let user: any = null;

      try {
        user = await prisma.user.findFirst({
          where: { id: req.user.id, isDeleted: false },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            companyId: true,
            departmentId: true,
            company: { select: { name: true } },
            department: { select: { name: true } },
          },
        });
      } catch (err) {
        const localUser = mockUsers.find((u) => u.id === req.user.id && !u.isDeleted);
        if (localUser) {
          const localComp = mockCompanies.find((c) => c.id === localUser.companyId) || { name: "Local Sandbox Corp" };
          const localDept = mockDepartments.find((d) => d.id === localUser.departmentId) || { name: "General" };
          user = {
            id: localUser.id,
            email: localUser.email,
            firstName: localUser.firstName,
            lastName: localUser.lastName,
            role: localUser.role,
            companyId: localUser.companyId,
            departmentId: localUser.departmentId,
            company: { name: localComp.name },
            department: { name: localDept.name }
          };
        }
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({ user });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch user." });
    }
  }

  static async logout(req: any, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(" ")[1];
        try {
          await prisma.session.deleteMany({ where: { token } });
        } catch (err) {
          const index = mockSessions.findIndex((s) => s.token === token);
          if (index !== -1) mockSessions.splice(index, 1);
        }
      }
      return res.status(200).json({ message: "Logged out successfully." });
    } catch (error: any) {
      return res.status(500).json({ error: "Logout failed." });
    }
  }
}
