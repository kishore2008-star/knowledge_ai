import { Response } from "express";
import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { AIService } from "../services/aiService";
import { DocumentStage, IngestionStatus } from "@prisma/client";
import {
  mockDocuments,
  mockDocumentVersions,
  mockDocumentChunks,
  mockNotifications,
  mockDepartments,
  mockMachines,
  mockAuditLogs
} from "../utils/mockDb";

export class DocumentController {
  /**
   * Upload Document and trigger AI Ingestion pipeline in background.
   */
  static async uploadDocument(req: any, res: Response) {
    try {
      const { title, description, tags, version, departmentId, machineId, rawText } = req.body;
      const file = req.file;
      const authorId = req.user.id;

      if (!title || !departmentId) {
        return res.status(400).json({ error: "Title and Department ID are required." });
      }

      let fileName = file ? file.originalname : "manual_input.txt";
      let fileSize = file ? file.size : Buffer.byteLength(rawText || "");
      let fileType = file ? file.mimetype : "text/plain";
      let fileUrl = file ? `/uploads/${file.filename}` : "raw-input";

      let extractedText = rawText || "";
      if (file) {
        extractedText = file.buffer ? file.buffer.toString("utf-8") : `Raw content parsed from file: ${fileName}`;
      }

      try {
        const document = await prisma.document.create({
          data: {
            title,
            description,
            stage: DocumentStage.STAGING,
            status: IngestionStatus.PROCESSING,
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
            departmentId,
            machineId: machineId || null,
          },
        });

        const docVersion = await prisma.documentVersion.create({
          data: {
            documentId: document.id,
            version: version || "1.0.0",
            fileName,
            fileSize,
            fileType,
            fileUrl,
            authorId,
          },
        });

        // Background AI pipeline
        (async () => {
          try {
            let textToProcess = extractedText;
            if (fileType.startsWith("audio/")) {
              textToProcess = await AIService.transcribeAudio(fileUrl);
            }

            const result = await AIService.ingestDocumentText(textToProcess);

            await prisma.documentVersion.update({
              where: { id: docVersion.id },
              data: { summary: result.summary, keywords: result.keywords },
            });

            for (let i = 0; i < result.chunks.length; i++) {
              const chunkText = result.chunks[i];
              const embeddingVector = result.embeddings[i];

              const chunk = await prisma.documentChunk.create({
                data: { versionId: docVersion.id, content: chunkText, sequence: i },
              });

              const vectorStr = `[${embeddingVector.join(",")}]`;
              await prisma.$executeRawUnsafe(`
                INSERT INTO "Embedding" ("id", "chunkId", "embedding", "createdAt")
                VALUES (gen_random_uuid(), '${chunk.id}'::uuid, '${vectorStr}'::vector, NOW())
              `);
            }

            await prisma.document.update({
              where: { id: document.id },
              data: { status: IngestionStatus.COMPLETED },
            });

            const dept = await prisma.department.findUnique({ where: { id: departmentId } });
            const managers = await prisma.user.findMany({
              where: { companyId: req.user.companyId, role: "MANAGER", isActive: true },
            });

            for (const m of managers) {
              await prisma.notification.create({
                data: {
                  userId: m.id,
                  title: "New Staging Knowledge",
                  message: `New knowledge '${title}' under department '${dept?.name || ""}' requires approval.`,
                },
              });
            }
          } catch (pipelineErr) {
            await prisma.document.update({
              where: { id: document.id },
              data: { status: IngestionStatus.FAILED },
            });
          }
        })();

        return res.status(202).json({
          message: "Document uploaded. Ingestion processing in background.",
          documentId: document.id,
          versionId: docVersion.id,
        });
      } catch (dbError) {
        logger.warn("Database connection issue. Routing upload to mock local store.");

        const docId = `doc-${Math.random().toString(36).substr(2, 9)}`;
        const versionId = `ver-${Math.random().toString(36).substr(2, 9)}`;

        const newDoc = {
          id: docId,
          title,
          description,
          stage: "STAGING" as DocumentStage,
          status: "COMPLETED" as IngestionStatus, // auto mark complete in mock to save wait times
          tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
          departmentId,
          machineId: machineId || null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const newVersion = {
          id: versionId,
          documentId: docId,
          version: version || "1.0.0",
          fileName,
          fileSize,
          fileType,
          fileUrl,
          authorId,
          summary: `This is a mock AI summary for operational document '${title}'. It covers quick checks and troubleshooting guides.`,
          keywords: ["calibration", "check", "error"],
          createdAt: new Date()
        };

        mockDocuments.push(newDoc);
        mockDocumentVersions.push(newVersion);

        // Generate mock chunks
        const dummyChunks = AIService.chunkDocument(extractedText || `Manual steps for calibrating ${title}. Check pressure limit. Done.`);
        dummyChunks.forEach((chunkText, idx) => {
          mockDocumentChunks.push({
            id: `chunk-${docId}-${idx}`,
            versionId,
            content: chunkText,
            sequence: idx,
            createdAt: new Date()
          });
        });

        // Trigger staging alerts for Managers
        const dept = mockDepartments.find((d) => d.id === departmentId) || { name: "General" };
        mockNotifications.push({
          id: `notif-${Math.random().toString(36).substr(2, 9)}`,
          userId: "usr-manager", // Alert default manager Bob
          title: "New Staging Knowledge (Mock)",
          message: `New mock knowledge '${title}' under department '${dept.name}' requires review.`,
          isRead: false,
          createdAt: new Date()
        });

        return res.status(202).json({
          message: "Document uploaded (Local Mock Cache). Processed immediately.",
          documentId: docId,
          versionId,
        });
      }
    } catch (error: any) {
      logger.error(`Document upload error: ${error.message}`);
      return res.status(500).json({ error: "Failed to upload document." });
    }
  }

  /**
   * Get documents list based on stage and search constraints.
   */
  static async getDocuments(req: any, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { stage, departmentId, machineId } = req.query;

      try {
        const filter: any = {
          isDeleted: false,
          department: { companyId },
        };

        if (stage) filter.stage = stage as DocumentStage;
        if (departmentId) filter.departmentId = departmentId as string;
        if (machineId) filter.machineId = machineId as string;

        const documents = await prisma.document.findMany({
          where: filter,
          include: {
            department: { select: { name: true } },
            machine: { select: { name: true } },
            versions: {
              orderBy: { createdAt: "desc" },
              include: { chunks: { select: { content: true } } }
            },
            feedbacks: { select: { rating: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({ documents });
      } catch (err) {
        logger.warn("Returning mock documents list.");
        const filteredDocs = mockDocuments
          .filter((d) => !d.isDeleted && (!stage || d.stage === stage) && (!departmentId || d.departmentId === departmentId) && (!machineId || d.machineId === machineId))
          .map((d) => {
            const dept = mockDepartments.find((dep) => dep.id === d.departmentId) || { name: "General" };
            const mach = mockMachines.find((m) => m.id === d.machineId) || null;
            const versions = mockDocumentVersions
              .filter((v) => v.documentId === d.id)
              .map((v) => {
                const chunks = mockDocumentChunks.filter((c) => c.versionId === v.id);
                return { ...v, chunks };
              });

            return {
              ...d,
              department: { name: dept.name },
              machine: mach ? { name: mach.name } : null,
              versions,
              feedbacks: []
            };
          });

        return res.status(200).json({ documents: filteredDocs });
      }
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch documents." });
    }
  }

  static async getDocumentById(req: any, res: Response) {
    try {
      const { id } = req.params;

      try {
        const doc = await prisma.document.findFirst({
          where: { id, isDeleted: false, department: { companyId: req.user.companyId } },
          include: {
            department: true,
            machine: true,
            versions: {
              orderBy: { createdAt: "desc" },
              include: { chunks: { orderBy: { sequence: "asc" } } },
            },
          },
        });

        if (!doc) return res.status(404).json({ error: "Document not found." });
        return res.status(200).json({ document: doc });
      } catch (err) {
        const d = mockDocuments.find((doc) => doc.id === id && !doc.isDeleted);
        if (!d) return res.status(404).json({ error: "Document not found." });

        const dept = mockDepartments.find((dep) => dep.id === d.departmentId) || { name: "General" };
        const mach = mockMachines.find((m) => m.id === d.machineId) || null;
        const versions = mockDocumentVersions
          .filter((v) => v.documentId === d.id)
          .map((v) => {
            const chunks = mockDocumentChunks.filter((c) => c.versionId === v.id).sort((a, b) => a.sequence - b.sequence);
            return { ...v, chunks };
          });

        return res.status(200).json({
          document: {
            ...d,
            department: dept,
            machine: mach,
            versions
          }
        });
      }
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to load document." });
    }
  }

  /**
   * Approve a staging document and publish it.
   */
  static async approveDocument(req: any, res: Response) {
    try {
      const { id } = req.params;

      try {
        const doc = await prisma.document.findFirst({
          where: { id, isDeleted: false, department: { companyId: req.user.companyId } },
        });

        if (!doc) return res.status(404).json({ error: "Document not found." });

        await prisma.document.update({
          where: { id },
          data: { stage: DocumentStage.PRODUCTION },
        });

        const latestVersion = await prisma.documentVersion.findFirst({
          where: { documentId: id },
          orderBy: { createdAt: "desc" },
        });

        if (latestVersion) {
          await prisma.documentVersion.update({
            where: { id: latestVersion.id },
            data: { approvedById: req.user.id },
          });
        }

        return res.status(200).json({ message: "Document approved and published." });
      } catch (err) {
        const docIdx = mockDocuments.findIndex((d) => d.id === id && !d.isDeleted);
        if (docIdx === -1) return res.status(404).json({ error: "Document not found." });

        mockDocuments[docIdx].stage = "PRODUCTION";

        const latestVersionIdx = mockDocumentVersions.findIndex((v) => v.documentId === id);
        if (latestVersionIdx !== -1) {
          mockDocumentVersions[latestVersionIdx].approvedById = req.user.id;
        }

        mockNotifications.push({
          id: `notif-${Math.random().toString(36).substr(2, 9)}`,
          userId: "usr-expert", // Alert Bob/Charlie
          title: "Knowledge Published (Mock)",
          message: `Your document '${mockDocuments[docIdx].title}' was approved (Local Mock Cache).`,
          isRead: false,
          createdAt: new Date()
        });

        return res.status(200).json({ message: "Document approved locally in mock cache." });
      }
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to approve document." });
    }
  }

  /**
   * Reject staging document or request changes.
   */
  static async rejectDocument(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      try {
        const doc = await prisma.document.findFirst({
          where: { id, isDeleted: false, department: { companyId: req.user.companyId } },
        });

        if (!doc) return res.status(404).json({ error: "Document not found." });

        await prisma.document.update({
          where: { id },
          data: { status: IngestionStatus.FAILED },
        });

        return res.status(200).json({ message: "Document rejected." });
      } catch (err) {
        const docIdx = mockDocuments.findIndex((d) => d.id === id && !d.isDeleted);
        if (docIdx === -1) return res.status(404).json({ error: "Document not found." });

        mockDocuments[docIdx].status = "FAILED";

        mockNotifications.push({
          id: `notif-${Math.random().toString(36).substr(2, 9)}`,
          userId: "usr-expert",
          title: "Knowledge Rejected (Mock)",
          message: `Your document '${mockDocuments[docIdx].title}' was rejected. Reason: ${reason || "None"}.`,
          isRead: false,
          createdAt: new Date()
        });

        return res.status(200).json({ message: "Document rejected locally." });
      }
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to reject document." });
    }
  }
}
export default DocumentController;
