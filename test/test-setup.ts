import { PrismaClient } from '@prisma/client';

export const testPrisma = new PrismaClient();

export async function seedTestData() {
  // Agora cada teste cria seu próprio banco limpo via setupFreshDatabase()
  // Esta função é mantida para compatibilidade mas não faz nada
  console.log('✅ seedTestData: Usando setupFreshDatabase() para cada teste');
  return null;
}

export async function cleanupTestData() {
  try {
    // Desabilitar restrições de chave estrangeira temporariamente
    await testPrisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);
    
    // Limpar todas as tabelas usando TRUNCATE CASCADE
    const tablenames = await testPrisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations'
    `;

    for (const { tablename } of tablenames as any[]) {
      try {
        await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Erro ao truncar ${tablename}:`, error);
      }
    }
    
    // Reabilitar restrições
    await testPrisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);
    
    console.log('✅ Todos os dados de teste foram removidos com TRUNCATE');
  } catch (error) {
    console.error('❌ Erro ao limpar dados de teste:', error);
    throw error;
  }
}

export async function setupFreshDatabase() {
  await cleanupTestData();
  
  // Criar estrutura base necessária com nomes únicos
  const tenant = await testPrisma.tenant.create({
    data: { 
      name: `Test Tenant ${Date.now()}`, 
      schema: `test_schema_${Date.now()}` 
    }
  });
  
  const adminRole = await testPrisma.role.create({
    data: { name: `admin-${Date.now()}` }
  });
  
  const userRole = await testPrisma.role.create({
    data: { name: `user-${Date.now()}` }
  });

  // Criar permissões para TesteGeral
  const permissions = await testPrisma.permission.createMany({
    data: [
      { action: 'create', subject: 'TesteGeral' },
      { action: 'read', subject: 'TesteGeral' },
      { action: 'update', subject: 'TesteGeral' },
      { action: 'delete', subject: 'TesteGeral' },
    ]
  });

  // Conectar permissões ao adminRole
  const createdPermissions = await testPrisma.permission.findMany();
  await testPrisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        connect: createdPermissions.map(p => ({ id: p.id }))
      }
    }
  });
  
  return { tenant, adminRole, userRole };
}