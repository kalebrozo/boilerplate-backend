import { PrismaClient } from '@prisma/client';

// Configuração do banco de dados para testes
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://saas_user:password@localhost:5432/saas_test_db';

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

export async function setupTestDatabase() {
  // Limpar schema existente
  await testPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS public CASCADE;`);
  
  // Recriar schema
  await testPrisma.$executeRawUnsafe(`CREATE SCHEMA public;`);
  
  // Aplicar migrations
  await testPrisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  
  console.log('✅ Schema de teste configurado');
}

export async function seedTestData() {
  // Criar tenant padrão
  const tenant = await testPrisma.tenant.create({
    data: {
      name: 'Test Tenant',
      schema: 'test_schema',
    },
  });

  // Criar roles padrão
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

  // Criar permissões
  const permissions = [
    { action: 'create', subject: 'users' },
    { action: 'read', subject: 'users' },
    { action: 'update', subject: 'users' },
    { action: 'delete', subject: 'users' },
    { action: 'create', subject: 'roles' },
    { action: 'read', subject: 'roles' },
    { action: 'update', subject: 'roles' },
    { action: 'delete', subject: 'roles' },
  ];

  for (const permission of permissions) {
    await testPrisma.permission.create({
      data: permission,
    });
  }

  console.log('✅ Dados de teste inseridos');
}

export async function cleanupTestData() {
  await testPrisma.auditLog.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.role.deleteMany();
  await testPrisma.permission.deleteMany();
  await testPrisma.tenant.deleteMany();
}

export async function disconnectTestDatabase() {
  await testPrisma.$disconnect();
}