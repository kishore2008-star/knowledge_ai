import { Response } from "express";
import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { AIService } from "../services/aiService";
import { mockChatSessions, mockChatMessages } from "../utils/mockDb";

export class ChatController {
  /**
   * Start or fetch chat sessions for the current user.
   */
  static async getSessions(req: any, res: Response) {
    try {
      const sessions = await prisma.chatSession.findMany({
        where: { userId: req.user.id, isDeleted: false },
        orderBy: { updatedAt: "desc" },
      });
      return res.status(200).json({ sessions });
    } catch (error: any) {
      logger.warn("Returning mock chat sessions list.");
      const filtered = mockChatSessions.filter((s) => s.userId === req.user.id && !s.isDeleted);
      return res.status(200).json({ sessions: filtered });
    }
  }

  static async getMessages(req: any, res: Response) {
    try {
      const { sessionId } = req.params;
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId, session: { userId: req.user.id } },
        orderBy: { createdAt: "asc" },
      });
      return res.status(200).json({ messages });
    } catch (error: any) {
      logger.warn("Returning mock messages list.");
      const filtered = mockChatMessages.filter((m) => m.sessionId === req.params.sessionId);
      return res.status(200).json({ messages: filtered });
    }
  }

  /**
   * Submit query to RAG pipeline.
   */
  static async askAI(req: any, res: Response) {
    try {
      const { query, sessionId } = req.body;
      const userId = req.user.id;
      const companyId = req.user.companyId;

      if (!query) {
        return res.status(400).json({ error: "Query is required." });
      }

      // 1. Resolve or Create Chat Session
      let activeSessionId = sessionId;
      let isMock = false;

      try {
        if (!activeSessionId) {
          const title = query.length > 30 ? query.substring(0, 30) + "..." : query;
          const newSession = await prisma.chatSession.create({
            data: { userId, title },
          });
          activeSessionId = newSession.id;
        }

        await prisma.chatMessage.create({
          data: {
            sessionId: activeSessionId,
            sender: "USER",
            message: query,
          },
        });
      } catch (dbErr) {
        logger.warn("Database connection issue. Appending chat logs to local mock cache.");
        isMock = true;

        if (!activeSessionId) {
          activeSessionId = `sess-${Math.random().toString(36).substr(2, 9)}`;
          mockChatSessions.push({
            id: activeSessionId,
            userId,
            title: query.length > 30 ? query.substring(0, 30) + "..." : query,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        mockChatMessages.push({
          id: `msg-${Math.random().toString(36).substr(2, 9)}`,
          sessionId: activeSessionId,
          sender: "USER",
          message: query,
          createdAt: new Date()
        });
      }

      // 2. Perform vector search (pgvector fallback queries mock)
      const matchingChunks = await AIService.vectorSearch(query, companyId, 5);

      // 3. Generate Structured RAG output
      const aiResponse = await AIService.generateStructuredRAG(query, matchingChunks);

      const sourceDocs = matchingChunks.map((chunk) => ({
        documentId: chunk.documentId,
        title: chunk.title,
        fileName: chunk.fileName,
        fileUrl: chunk.fileUrl,
        author: chunk.authorName,
        similarity: chunk.similarity,
      }));

      const uniqueSources = sourceDocs.filter(
        (doc, index, self) => self.findIndex((d) => d.title === doc.title) === index
      );

      const metadataPayload = {
        ...aiResponse,
        sources: uniqueSources,
      };

      const responseMessageText = `**Problem:** ${aiResponse.problem}\n\n**Cause:** ${aiResponse.cause}\n\n**Estimated Time:** ${aiResponse.estimatedTime}\n**Confidence Score:** ${Math.round(aiResponse.confidenceScore * 100)}%`;

      let savedAiMsg: any = null;

      if (!isMock) {
        try {
          savedAiMsg = await prisma.chatMessage.create({
            data: {
              sessionId: activeSessionId,
              sender: "AI",
              message: responseMessageText,
              metadata: metadataPayload,
            },
          });

          await prisma.chatSession.update({
            where: { id: activeSessionId },
            data: { updatedAt: new Date() },
          });
        } catch (saveErr) {
          isMock = true;
        }
      }

      if (isMock) {
        savedAiMsg = {
          id: `msg-${Math.random().toString(36).substr(2, 9)}`,
          sessionId: activeSessionId,
          sender: "AI",
          message: responseMessageText,
          metadata: metadataPayload,
          createdAt: new Date()
        };
        mockChatMessages.push(savedAiMsg);

        const sessIdx = mockChatSessions.findIndex(s => s.id === activeSessionId);
        if (sessIdx !== -1) {
          mockChatSessions[sessIdx].updatedAt = new Date();
        }
      }

      return res.status(200).json({
        sessionId: activeSessionId,
        message: savedAiMsg,
      });
    } catch (error: any) {
      logger.error(`RAG inquiry failed: ${error.message}`);
      return res.status(500).json({ error: "AI reasoning failed." });
    }
  }

  static async deleteSession(req: any, res: Response) {
    try {
      const { id } = req.params;
      try {
        await prisma.chatSession.updateMany({
          where: { id, userId: req.user.id },
          data: { isDeleted: true },
        });
      } catch (err) {
        const idx = mockChatSessions.findIndex(s => s.id === id && s.userId === req.user.id);
        if (idx !== -1) mockChatSessions[idx].isDeleted = true;
      }
      return res.status(200).json({ message: "Chat deleted." });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to delete chat." });
    }
  }
}
export default ChatController;
