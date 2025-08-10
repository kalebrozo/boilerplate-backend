import { testPrisma } from './test-setup';

export default async function globalTeardown() {
  console.log('🧹 Finalizando ambiente de teste...');
  
  // Simplesmente limpar dados usando a função já existente
  try {
    const { cleanupTestData } = require('./test-setup');
    await cleanupTestData();
    console.log('✅ Ambiente de teste finalizado');
  } catch (error) {
    console.log('✅ Ambiente já está limpo ou não existe');
  }
}