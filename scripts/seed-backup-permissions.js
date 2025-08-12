const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedBackupPermissions() {
  console.log('🌱 Seeding Backup permissions...');

  try {
    // Buscar roles disponíveis
    const adminRole = await prisma.role.findFirst({
      where: { 
        OR: [
          { name: 'admin' },
          { name: 'Admin' },
          { name: 'Administrador' },
          { name: 'Super Admin' }
        ]
      },
    });

    if (!adminRole) {
      console.error('❌ Role de administrador não encontrada');
      console.log('Roles disponíveis:');
      const roles = await prisma.role.findMany();
      roles.forEach(role => console.log(`- ${role.name}`));
      return;
    }

    console.log(`✅ Role encontrada: ${adminRole.name}`);

    // Definir as permissões para Backup (System)
    const backupPermissions = [
      {
        action: 'create',
        subject: 'System',
      },
      {
        action: 'read',
        subject: 'System',
      },
    ];

    // Criar as permissões
    for (const permissionData of backupPermissions) {
      // Primeiro, criar ou buscar a permissão
      const permission = await prisma.permission.upsert({
        where: {
          action_subject: {
            action: permissionData.action,
            subject: permissionData.subject,
          },
        },
        update: {},
        create: {
          action: permissionData.action,
          subject: permissionData.subject,
        },
      });

      // Conectar a permissão ao role de admin
      await prisma.role.update({
        where: { id: adminRole.id },
        data: {
          permissions: {
            connect: { id: permission.id },
          },
        },
      });

      console.log(`✅ Permissão criada: ${permission.action} ${permission.subject}`);
    }

    console.log('🎉 Backup permissions seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding backup permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBackupPermissions();