import { testPrisma } from './test-setup';

export default async function globalTeardown() {
  await testPrisma.$disconnect();
}