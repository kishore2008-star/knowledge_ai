import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRoles } from "../middleware/auth";
import { AuthController } from "../controllers/authController";
import { AdminController } from "../controllers/adminController";
import { MachineController } from "../controllers/machineController";
import { DocumentController } from "../controllers/documentController";
import { ChatController } from "../controllers/chatController";
import { FeedbackController } from "../controllers/feedbackController";
import { AnalyticsController } from "../controllers/analyticsController";
import { NotificationController } from "../controllers/notificationController";
import { Role } from "@prisma/client";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.post("/auth/register", AuthController.registerCompany);
router.post("/auth/login", AuthController.login);

// ==========================================
// PROTECTED ROUTES (Requires Auth)
// ==========================================
router.use(requireAuth as any);

router.get("/auth/me", AuthController.me as any);
router.post("/auth/logout", AuthController.logout as any);

// --- Admin-only management endpoints ---
router.post("/admin/users", requireRoles([Role.ADMIN]) as any, AdminController.createUser as any);
router.get("/admin/users", requireRoles([Role.ADMIN]) as any, AdminController.getUsers as any);
router.patch("/admin/users/:id", requireRoles([Role.ADMIN]) as any, AdminController.updateUser as any);
router.delete("/admin/users/:id", requireRoles([Role.ADMIN]) as any, AdminController.deleteUser as any);

router.post("/admin/departments", requireRoles([Role.ADMIN]) as any, AdminController.createDepartment as any);
router.get("/admin/departments", AdminController.getDepartments as any); // experts & managers need departments list too

// --- Machines management endpoints ---
router.post("/machines", requireRoles([Role.ADMIN, Role.MANAGER]) as any, MachineController.createMachine as any);
router.get("/machines", MachineController.getMachines as any);
router.get("/machines/:id", MachineController.getMachineById as any);
router.patch("/machines/:id", requireRoles([Role.ADMIN, Role.MANAGER]) as any, MachineController.updateMachine as any);
router.delete("/machines/:id", requireRoles([Role.ADMIN]) as any, MachineController.deleteMachine as any);

// --- Documents (Knowledge base) endpoints ---
router.post(
  "/documents/upload",
  requireRoles([Role.ADMIN, Role.MANAGER, Role.EXPERT]) as any,
  upload.single("file"),
  DocumentController.uploadDocument as any
);
router.get("/documents", DocumentController.getDocuments as any);
router.get("/documents/:id", DocumentController.getDocumentById as any);

// Manager specific approvals
router.post(
  "/documents/:id/approve",
  requireRoles([Role.ADMIN, Role.MANAGER]) as any,
  DocumentController.approveDocument as any
);
router.post(
  "/documents/:id/reject",
  requireRoles([Role.ADMIN, Role.MANAGER]) as any,
  DocumentController.rejectDocument as any
);

// --- Chat (RAG AI) endpoints ---
router.get("/chat/sessions", ChatController.getSessions as any);
router.get("/chat/sessions/:sessionId/messages", ChatController.getMessages as any);
router.post("/chat/ask", ChatController.askAI as any);
router.delete("/chat/sessions/:id", ChatController.deleteSession as any);

// --- Feedback endpoints ---
router.post("/feedback", FeedbackController.submitFeedback as any);
router.get("/feedback/document/:documentId", FeedbackController.getFeedbackForDocument as any);

// --- Analytics endpoints ---
router.get("/analytics/admin", requireRoles([Role.ADMIN]) as any, AnalyticsController.getAdminStats as any);
router.get("/analytics/manager", requireRoles([Role.ADMIN, Role.MANAGER]) as any, AnalyticsController.getManagerStats as any);
router.get("/analytics/expert", requireRoles([Role.ADMIN, Role.MANAGER, Role.EXPERT]) as any, AnalyticsController.getExpertStats as any);

// --- Notifications endpoints ---
router.get("/notifications", NotificationController.getNotifications as any);
router.patch("/notifications/:id/read", NotificationController.markAsRead as any);
router.post("/notifications/read-all", NotificationController.markAllAsRead as any);

export default router;
