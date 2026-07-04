import { Response } from "express";
import { prisma } from "../config/db";
import { mockNotifications } from "../utils/mockDb";
import { logger } from "../config/logger";

export class NotificationController {
  static async getNotifications(req: any, res: Response) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return res.status(200).json({ notifications });
    } catch (error: any) {
      logger.warn("Returning mock notifications.");
      const filtered = mockNotifications.filter((n) => n.userId === req.user.id);
      return res.status(200).json({ notifications: filtered });
    }
  }

  static async markAsRead(req: any, res: Response) {
    try {
      const { id } = req.params;
      try {
        await prisma.notification.updateMany({
          where: { id, userId: req.user.id },
          data: { isRead: true },
        });
      } catch (err) {
        const idx = mockNotifications.findIndex((n) => n.id === id && n.userId === req.user.id);
        if (idx !== -1) mockNotifications[idx].isRead = true;
      }
      return res.status(200).json({ message: "Notification read." });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to mark notification." });
    }
  }

  static async markAllAsRead(req: any, res: Response) {
    try {
      try {
        await prisma.notification.updateMany({
          where: { userId: req.user.id, isRead: false },
          data: { isRead: true },
        });
      } catch (err) {
        mockNotifications.forEach((n) => {
          if (n.userId === req.user.id) n.isRead = true;
        });
      }
      return res.status(200).json({ message: "All notifications read." });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to mark all notifications." });
    }
  }
}
export default NotificationController;
