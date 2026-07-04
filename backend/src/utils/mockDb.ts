import bcrypt from "bcrypt";

export const mockCompanies: any[] = [];
export const mockDepartments: any[] = [
  { id: "dept-production", name: "Production", companyId: "comp-default" },
  { id: "dept-maintenance", name: "Maintenance", companyId: "comp-default" },
  { id: "dept-safety", name: "Safety", companyId: "comp-default" },
  { id: "dept-quality", name: "Quality Control", companyId: "comp-default" },
  { id: "dept-it", name: "IT", companyId: "comp-default" }
];
export const mockUsers: any[] = [];
export const mockSessions: any[] = [];
export const mockMachines: any[] = [
  { id: "mach-1", machineId: "M101", name: "High Pressure Compressor", location: "Zone A", manufacturer: "Atlas Copco", status: "ACTIVE", departmentId: "dept-maintenance" },
  { id: "mach-2", machineId: "M202", name: "Pneumatic Valve Calibrator", location: "Zone B", manufacturer: "Emerson", status: "ACTIVE", departmentId: "dept-production" }
];
export const mockDocuments: any[] = [];
export const mockDocumentVersions: any[] = [];
export const mockDocumentChunks: any[] = [];
export const mockFeedbacks: any[] = [];
export const mockNotifications: any[] = [];
export const mockAuditLogs: any[] = [];
export const mockChatSessions: any[] = [];
export const mockChatMessages: any[] = [];

// Seed default company and users
const initMock = async () => {
  const passwordHash = await bcrypt.hash("password123", 10);
  
  // Default Company
  mockCompanies.push({
    id: "comp-default",
    name: "Acme Industrial Corp",
    logoUrl: null,
    industry: "Manufacturing",
    country: "US",
    timezone: "UTC",
    subscription: "Standard",
    storageLimitGb: 10,
    userLimit: 50
  });

  // Admin User
  mockUsers.push({
    id: "usr-admin",
    email: "admin@knowforge.com",
    passwordHash,
    firstName: "Alice",
    lastName: "Smith",
    role: "ADMIN",
    isActive: true,
    companyId: "comp-default",
    departmentId: "dept-it"
  });

  // Manager User
  mockUsers.push({
    id: "usr-manager",
    email: "manager@knowforge.com",
    passwordHash,
    firstName: "Bob",
    lastName: "Jones",
    role: "MANAGER",
    isActive: true,
    companyId: "comp-default",
    departmentId: "dept-production"
  });

  // Expert User
  mockUsers.push({
    id: "usr-expert",
    email: "expert@knowforge.com",
    passwordHash,
    firstName: "Charlie",
    lastName: "Brown",
    role: "EXPERT",
    isActive: true,
    companyId: "comp-default",
    departmentId: "dept-safety"
  });

  // Employee User
  mockUsers.push({
    id: "usr-employee",
    email: "employee@knowforge.com",
    passwordHash,
    firstName: "Dave",
    lastName: "Miller",
    role: "EMPLOYEE",
    isActive: true,
    companyId: "comp-default",
    departmentId: "dept-maintenance"
  });
};

initMock();
