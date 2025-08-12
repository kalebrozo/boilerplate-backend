const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMetricsPermissions() {
  try {
    console.log('🌱 Iniciando seed das permissões de Metrics...');

    // Criar permissões para Metrics
    const metricsPermissions = [
      { action: 'read', subject: 'Metrics' },
      { action: 'manage', subject: 'Metrics' },
    ];

    const createdPermissions = [];
    
    for (const permission of metricsPermissions) {
      const permissionRecord = await prisma.permission.upsert({
        where: {
          action_subject: {
            action: permission.action,
            subject: permission.subject,
          },
        },
        update: {},
        create: {
          action: permission.action,
          subject: permission.subject,
        },
      });
      
      createdPermissions.push(permissionRecord);
      console.log(`✅ Permissão criada: ${permission.action} ${permission.subject}`);
    }

    // Buscar role de admin para associar as permissões
    const adminRole = await prisma.role.findFirst({
      where: {
        OR: [
          { name: 'admin' },
          { name: 'Admin' },
          { name: 'Administrador' },
        ],
      },
    });

    if (adminRole) {
      // Associar permissões à role de admin
      for (const permission of createdPermissions) {
        await prisma.role.update({
          where: { id: adminRole.id },
          data: {
            permissions: {
              connect: { id: permission.id },
            },
          },
        });
      }
      console.log(`✅ Permissões associadas à role ${adminRole.name}`);
    } else {
      console.log('⚠️ Role de admin não encontrada. Permissões criadas mas não associadas.');
    }

    console.log('🎉 Metrics permissions seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding metrics permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedMetricsPermissions();
}

module.exports = { seedMetricsPermissions };