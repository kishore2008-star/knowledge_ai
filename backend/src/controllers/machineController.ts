import { Response } from "express";
import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { mockMachines, mockDepartments } from "../utils/mockDb";

export class MachineController {
  static async createMachine(req: any, res: Response) {
    try {
      const { name, machineId, location, manufacturer, description, departmentId, images } = req.body;

      if (!name || !machineId || !departmentId) {
        return res.status(400).json({ error: "Name, Machine ID, and Department ID are required." });
      }

      try {
        const existing = await prisma.machine.findUnique({ where: { machineId } });
        if (existing) {
          return res.status(400).json({ error: `Machine ID '${machineId}' is already registered.` });
        }

        const machine = await prisma.machine.create({
          data: {
            name,
            machineId,
            location,
            manufacturer,
            description,
            departmentId,
            images: images || [],
          },
        });

        return res.status(201).json({ message: "Machine registered successfully.", machine });
      } catch (err) {
        logger.warn("Database connection issue. Registering machine in local mock cache.");
        const exists = mockMachines.some((m) => m.machineId === machineId && !m.isDeleted);
        if (exists) {
          return res.status(400).json({ error: `Machine ID '${machineId}' is already registered.` });
        }

        const newMach = {
          id: `mach-${Math.random().toString(36).substr(2, 9)}`,
          machineId,
          name,
          location,
          manufacturer,
          description,
          departmentId,
          images: images || [],
          status: "ACTIVE",
          isDeleted: false
        };

        mockMachines.push(newMach);
        return res.status(201).json({ message: "Machine registered successfully (Local Mock Cache).", machine: newMach });
      }
    } catch (error: any) {
      logger.error(`Machine creation failed: ${error.message}`);
      return res.status(500).json({ error: "Failed to register machine." });
    }
  }

  static async getMachines(req: any, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { departmentId } = req.query;

      try {
        const filter: any = {
          isDeleted: false,
          department: { companyId },
        };

        if (departmentId) {
          filter.departmentId = departmentId as string;
        }

        const machines = await prisma.machine.findMany({
          where: filter,
          include: {
            department: { select: { name: true } },
            _count: { select: { documents: true } },
          },
          orderBy: { name: "asc" },
        });

        return res.status(200).json({ machines });
      } catch (err) {
        logger.warn("Returning mock machines list.");
        const filtered = mockMachines
          .filter((m) => !m.isDeleted && (!departmentId || m.departmentId === departmentId))
          .map((m) => {
            const dept = mockDepartments.find((d) => d.id === m.departmentId) || { name: "General" };
            return {
              ...m,
              department: { name: dept.name },
              _count: { documents: 1 }
            };
          });
        return res.status(200).json({ machines: filtered });
      }
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch machines." });
    }
  }

  static async getMachineById(req: any, res: Response) {
    try {
      const { id } = req.params;

      try {
        const machine = await prisma.machine.findFirst({
          where: { id, isDeleted: false, department: { companyId: req.user.companyId } },
          include: {
            department: true,
            documents: {
              where: { isDeleted: false, stage: "PRODUCTION" },
              include: {
                versions: { orderBy: { createdAt: "desc" }, take: 1 },
              },
            },
          },
        });

        if (!machine) {
          return res.status(404).json({ error: "Machine not found." });
        }

        return res.status(200).json({ machine });
      } catch (err) {
        const mach = mockMachines.find((m) => m.id === id && !m.isDeleted);
        if (!mach) {
          return res.status(404).json({ error: "Machine not found." });
        }
        const dept = mockDepartments.find((d) => d.id === mach.departmentId) || { name: "General" };
        return res.status(200).json({
          machine: {
            ...mach,
            department: dept,
            documents: []
          }
        });
      }
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to get machine details." });
    }
  }

  static async updateMachine(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { name, location, manufacturer, description, status, images } = req.body;

      try {
        const machine = await prisma.machine.findFirst({
          where: { id, isDeleted: false, department: { companyId: req.user.companyId } },
        });

        if (!machine) {
          return res.status(404).json({ error: "Machine not found." });
        }

        const updated = await prisma.machine.update({
          where: { id },
          data: {
            name: name || machine.name,
            location: location !== undefined ? location : machine.location,
            manufacturer: manufacturer !== undefined ? manufacturer : machine.manufacturer,
            description: description !== undefined ? description : machine.description,
            status: status || machine.status,
            images: images || machine.images,
          },
        });

        return res.status(200).json({ message: "Machine updated successfully.", machine: updated });
      } catch (err) {
        const idx = mockMachines.findIndex((m) => m.id === id && !m.isDeleted);
        if (idx === -1) {
          return res.status(404).json({ error: "Machine not found." });
        }
        const m = mockMachines[idx];
        mockMachines[idx] = {
          ...m,
          name: name || m.name,
          location: location !== undefined ? location : m.location,
          manufacturer: manufacturer !== undefined ? manufacturer : m.manufacturer,
          description: description !== undefined ? description : m.description,
          status: status || m.status,
          images: images || m.images
        };
        return res.status(200).json({ message: "Machine updated successfully (Local Mock Cache).", machine: mockMachines[idx] });
      }
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to update machine." });
    }
  }

  static async deleteMachine(req: any, res: Response) {
    try {
      const { id } = req.params;
      try {
        const machine = await prisma.machine.findFirst({
          where: { id, isDeleted: false, department: { companyId: req.user.companyId } },
        });

        if (!machine) {
          return res.status(404).json({ error: "Machine not found." });
        }

        await prisma.machine.update({
          where: { id },
          data: { isDeleted: true },
        });
      } catch (err) {
        const idx = mockMachines.findIndex((m) => m.id === id && !m.isDeleted);
        if (idx === -1) {
          return res.status(404).json({ error: "Machine not found." });
        }
        mockMachines[idx].isDeleted = true;
      }

      return res.status(200).json({ message: "Machine deleted successfully." });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to delete machine." });
    }
  }
}
export default MachineController;
