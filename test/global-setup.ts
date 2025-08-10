import { setupFreshDatabase } from './test-setup';

export default async function globalSetup() {
  console.log('🧪 Configurando ambiente de teste...');
  
  // Configurar banco de dados limpo para testes
  await setupFreshDatabase();
  
  console.log('🧪 Ambiente de teste configurado');
}