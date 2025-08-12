const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRoles() {
  try {
    const roles = await prisma.role.findMany();
    console.log('Roles encontradas:');
    roles.forEach(role => {
      console.log(`- ID: ${role.id}, Nome: ${role.name}`);
    });
  } catch (error) {
    console.error('Erro ao buscar roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();