import { testPrisma } from './test-setup';

export default async function globalTeardown() {
  console.log('🧹 Finalizando ambiente de teste...');
  
  // Limpar todos os dados
  await testPrisma.auditLog.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.role.deleteMany();
  await testPrisma.permission.deleteMany();
  await testPrisma.tenant.deleteMany();
  
  // Desconectar do banco
  await testPrisma.$disconnect();
  
  console.log('✅ Ambiente de teste finalizado');
}