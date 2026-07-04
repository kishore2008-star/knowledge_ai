const bcrypt = require("bcrypt");
const { PrismaClient, Role } = require("@prisma/client");

const prisma = new PrismaClient();

async function getOrCreateDepartment(name, companyId) {
  const existing = await prisma.department.findFirst({
    where: { name, companyId, isDeleted: false },
  });

  if (existing) return existing;

  return prisma.department.create({
    data: { name, companyId },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const company =
    (await prisma.company.findFirst({
      where: { name: "Acme Industrial Corp", isDeleted: false },
    })) ||
    (await prisma.company.create({
      data: {
        name: "Acme Industrial Corp",
        industry: "Manufacturing",
        country: "US",
        timezone: "UTC",
        subscription: "Standard",
        storageLimitGb: 10,
        userLimit: 50,
      },
    }));

  const departments = {};
  for (const name of ["Production", "Maintenance", "Safety", "Quality Control", "IT"]) {
    departments[name] = await getOrCreateDepartment(name, company.id);
  }

  const users = [
    ["admin@knowforge.com", "Alice", "Smith", Role.ADMIN, departments.IT.id],
    ["manager@knowforge.com", "Bob", "Jones", Role.MANAGER, departments.Production.id],
    ["expert@knowforge.com", "Charlie", "Brown", Role.EXPERT, departments.Safety.id],
    ["employee@knowforge.com", "Dave", "Miller", Role.EMPLOYEE, departments.Maintenance.id],
  ];

  for (const [email, firstName, lastName, role, departmentId] of users) {
    await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        firstName,
        lastName,
        role,
        companyId: company.id,
        departmentId,
        isActive: true,
        isDeleted: false,
      },
      create: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        companyId: company.id,
        departmentId,
      },
    });
  }

  await prisma.machine.upsert({
    where: { machineId: "M101" },
    update: {
      name: "High Pressure Compressor",
      location: "Zone A",
      manufacturer: "Atlas Copco",
      status: "ACTIVE",
      departmentId: departments.Maintenance.id,
      isDeleted: false,
    },
    create: {
      machineId: "M101",
      name: "High Pressure Compressor",
      location: "Zone A",
      manufacturer: "Atlas Copco",
      status: "ACTIVE",
      departmentId: departments.Maintenance.id,
    },
  });

  await prisma.machine.upsert({
    where: { machineId: "M202" },
    update: {
      name: "Pneumatic Valve Calibrator",
      location: "Zone B",
      manufacturer: "Emerson",
      status: "ACTIVE",
      departmentId: departments.Production.id,
      isDeleted: false,
    },
    create: {
      machineId: "M202",
      name: "Pneumatic Valve Calibrator",
      location: "Zone B",
      manufacturer: "Emerson",
      status: "ACTIVE",
      departmentId: departments.Production.id,
    },
  });

  console.log("Seeded demo company, departments, users, and machines.");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
