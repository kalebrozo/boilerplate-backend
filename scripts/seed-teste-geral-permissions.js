const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTesteGeralPermissions() {
  console.log('🌱 Seeding TesteGeral permissions...');

  try {
    // Buscar roles disponíveis
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Administrador' },
    });

    const userRole = await prisma.role.findUnique({
      where: { name: 'Usuário' },
    });

    if (!adminRole || !userRole) {
      console.error('❌ Roles Administrador ou Usuário não encontradas');
      return;
    }

    // Definir as permissões para TesteGeral
    const permissions = [
      // Admin permissions - full access
      {
        action: 'create',
        subject: 'TesteGeral',
        roleId: adminRole.id,
        fields: [],
      },
      {
        action: 'read',
        subject: 'TesteGeral',
        roleId: adminRole.id,
        fields: [],
      },
      {
        action: 'update',
        subject: 'TesteGeral',
        roleId: adminRole.id,
        fields: [],
      },
      {
        action: 'delete',
        subject: 'TesteGeral',
        roleId: adminRole.id,
        fields: [],
      },
      // User role permissions - read only
      {
        action: 'read',
        subject: 'TesteGeral',
        roleId: userRole.id,
        fields: [],
      },
    ];

    // Criar as permissões
    for (const permission of permissions) {
      // Primeiro, criar ou buscar a permissão
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

      // Depois, associar a role à permissão
      await prisma.permission.update({
        where: { id: permissionRecord.id },
        data: {
          roles: {
            connect: { id: permission.roleId },
          },
        },
      });
    }

    console.log('✅ TesteGeral permissions seeded successfully');
    console.log(`📊 Created ${permissions.length} permissions`);

  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedTesteGeralPermissions();
}

module.exports = { seedTesteGeralPermissions };