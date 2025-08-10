import { setupTestDatabase } from './test/test-database';

export default async function globalSetup() {
  console.log('🚀 Configurando ambiente de teste global...');
  
  // Configurar variáveis de ambiente para testes
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://saas_user:saas_password@localhost:5432/saas_test_db?schema=public';
  process.env.JWT_SECRET = 'test-secret-key';
  
  console.log('✅ Ambiente de teste configurado');
  console.log('📊 Database URL:', process.env.DATABASE_URL);
}