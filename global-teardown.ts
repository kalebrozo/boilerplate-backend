import { testPrisma, disconnectTestDatabase } from './test/test-database';

export default async function globalTeardown() {
  console.log('🧹 Limpando ambiente de teste global...');
  
  try {
    // Limpar dados do banco de teste
    await testPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS public CASCADE;`);
    await testPrisma.$executeRawUnsafe(`CREATE SCHEMA public;`);
    
    console.log('✅ Schema de teste limpo');
  } catch (error) {
    console.error('❌ Erro ao limpar schema:', error);
  }
  
  // Desconectar do banco
  await disconnectTestDatabase();
  console.log('✅ Conexão com banco de teste encerrada');
}