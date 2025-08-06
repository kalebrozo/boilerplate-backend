import { testPrisma, seedTestData, cleanupTestData } from './test-setup';

export default async function globalSetup() {
  console.log('🧪 Configurando ambiente de teste...');
  
  // Limpar dados existentes
  await cleanupTestData();
  console.log('🧹 Dados de teste limpos');
  
  // Alimentar com dados base
  await seedTestData();
  console.log('🌱 Dados de teste inseridos');
  
  console.log('✅ Ambiente de teste pronto!');
}