import { Response } from "express";
import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { mockFeedbacks, mockNotifications, mockDocuments } from "../utils/mockDb";

export class FeedbackController {
  static async submitFeedback(req: any, res: Response) {
    try {
      const { rating, isHelpful, comment, documentId } = req.body;
      const userId = req.user.id;

      if (rating === undefined || isHelpful === undefined || !documentId) {
        return res.status(400).json({ error: "Rating, isHelpful, and Document ID are required." });
      }

      try {
        const feedback = await prisma.feedback.create({
          data: {
            rating: Number(rating),
            isHelpful: Boolean(isHelpful),
            comment,
            documentId,
            userId,
          },
          include: { document: true },
        });

        if (rating <= 2 || !isHelpful) {
          logger.warn(`Poor feedback received for document ${documentId}. Notifying Managers.`);
          const managers = await prisma.user.findMany({
            where: { companyId: req.user.companyId, role: "MANAGER", isActive: true },
          });

          for (const m of managers) {
            await prisma.notification.create({
              data: {
                userId: m.id,
                title: "Low Article Rating Alert",
                message: `The knowledge entry '${feedback.document.title}' was marked as unhelpful. Rating: ${rating}/5. Feedback: "${comment || "No comment"}"`,
              },
            });
          }
        }

        return res.status(201).json({ message: "Feedback submitted successfully.", feedback });
      } catch (dbErr) {
        logger.warn("Database connection issue. Appending review feedback inside mock registry.");

        const matchedDoc = mockDocuments.find((d) => d.id === documentId) || { title: "Mock Document Entry" };

        const newFeedback = {
          id: `feed-${Math.random().toString(36).substr(2, 9)}`,
          rating: Number(rating),
          isHelpful: Boolean(isHelpful),
          comment,
          documentId,
          userId,
          createdAt: new Date()
        };

        mockFeedbacks.push(newFeedback);

        if (rating <= 2 || !isHelpful) {
          mockNotifications.push({
            id: `notif-${Math.random().toString(36).substr(2, 9)}`,
            userId: "usr-manager", // Alert default manager Bob
            title: "Low Article Rating Alert (Mock)",
            message: `The mock entry '${matchedDoc.title}' was marked as unhelpful. Rating: ${rating}/5.`,
            isRead: false,
            createdAt: new Date()
          });
        }

        return res.status(201).json({ message: "Feedback submitted successfully (Local Mock Cache).", feedback: newFeedback });
      }
    } catch (error: any) {
      logger.error(`Feedback submission failed: ${error.message}`);
      return res.status(500).json({ error: "Failed to submit feedback." });
    }
  }

  static async getFeedbackForDocument(req: any, res: Response) {
    try {
      const { documentId } = req.params;
      try {
        const feedbacks = await prisma.feedback.findMany({
          where: { documentId, document: { department: { companyId: req.user.companyId } } },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({ feedbacks });
      } catch (err) {
        logger.warn("Returning mock feedbacks list.");
        const filtered = mockFeedbacks
          .filter((f) => f.documentId === documentId)
          .map((f) => ({
            ...f,
            user: { firstName: "Dave", lastName: "Miller", email: "employee@knowforge.com" }
          }));
        return res.status(200).json({ feedbacks: filtered });
      }
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch document feedbacks." });
    }
  }
}
export default FeedbackController;
