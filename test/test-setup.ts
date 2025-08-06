import { PrismaClient } from '@prisma/client';

export const testPrisma = new PrismaClient();

export async function seedTestData() {
  // Criar dados base para testes
  const tenant = await testPrisma.tenant.create({
    data: {
      name: 'Test Tenant',
      schema: 'test_schema',
    },
  });

  const adminRole = await testPrisma.role.create({
    data: {
      name: 'Admin',
    },
  });

  const userRole = await testPrisma.role.create({
    data: {
      name: 'User',
    },
  });

  const permissions = await testPrisma.permission.createMany({
    data: [
      { action: 'read', subject: 'users' },
      { action: 'write', subject: 'users' },
      { action: 'read', subject: 'roles' },
      { action: 'write', subject: 'roles' },
      { action: 'read', subject: 'permissions' },
      { action: 'write', subject: 'permissions' },
      { action: 'read', subject: 'tenants' },
      { action: 'write', subject: 'tenants' },
    ],
  });

  // Associar permissões ao role admin
  const allPermissions = await testPrisma.permission.findMany();
  for (const permission of allPermissions) {
    await testPrisma.role.update({
      where: { id: adminRole.id },
      data: {
        permissions: {
          connect: { id: permission.id },
        },
      },
    });
  }

  return { tenant, adminRole, userRole };
}

export async function cleanupTestData() {
  // Limpar dados em ordem reversa para evitar problemas de FK
  await testPrisma.auditLog.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.role.deleteMany();
  await testPrisma.permission.deleteMany();
  await testPrisma.tenant.deleteMany();
}