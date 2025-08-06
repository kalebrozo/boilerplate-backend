const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar tenants
  const tenant1 = await prisma.tenant.upsert({
    where: { id: 'tenant-1' },
    update: {},
    create: {
      id: 'tenant-1',
      name: 'Tenant Principal',
      schema: 'principal_schema',
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { id: 'tenant-2' },
    update: {},
    create: {
      id: 'tenant-2',
      name: 'Tenant Secundário',
      schema: 'secundario_schema',
    },
  });

  console.log('✅ Tenants criados');

  // Criar permissions
  const permissions = [
    { action: 'create', subject: 'User' },
    { action: 'read', subject: 'User' },
    { action: 'update', subject: 'User' },
    { action: 'delete', subject: 'User' },
    { action: 'create', subject: 'Role' },
    { action: 'read', subject: 'Role' },
    { action: 'update', subject: 'Role' },
    { action: 'delete', subject: 'Role' },
    { action: 'create', subject: 'Permission' },
    { action: 'read', subject: 'Permission' },
    { action: 'update', subject: 'Permission' },
    { action: 'delete', subject: 'Permission' },
    { action: 'create', subject: 'Tenant' },
    { action: 'read', subject: 'Tenant' },
    { action: 'update', subject: 'Tenant' },
    { action: 'delete', subject: 'Tenant' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { action_subject: { action: perm.action, subject: perm.subject } },
      update: {},
      create: perm,
    });
    createdPermissions.push(permission);
  }

  console.log('✅ Permissions criadas');

  // Criar roles
  const adminRole = await prisma.role.upsert({
    where: { id: 'role-admin' },
    update: {},
    create: {
      id: 'role-admin',
      name: 'Administrador',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { id: 'role-user' },
    update: {},
    create: {
      id: 'role-user',
      name: 'Usuário',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { id: 'role-manager' },
    update: {},
    create: {
      id: 'role-manager',
      name: 'Gerente',
    },
  });

  console.log('✅ Roles criadas');

  // Associar permissions às roles
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        connect: createdPermissions.map(p => ({ id: p.id })),
      },
    },
  });

  await prisma.role.update({
    where: { id: managerRole.id },
    data: {
      permissions: {
        connect: createdPermissions
          .filter(p => ['User', 'Role'].includes(p.subject))
          .map(p => ({ id: p.id })),
      },
    },
  });

  await prisma.role.update({
    where: { id: userRole.id },
    data: {
      permissions: {
        connect: createdPermissions
          .filter(p => p.action === 'read')
          .map(p => ({ id: p.id })),
      },
    },
  });

  console.log('✅ Permissions associadas às roles');

  // Hash da senha padrão
  const hashedPassword = await bcrypt.hash('12345678', 10);

  // Criar usuários
  const users = [
    {
      email: 'admin@example.com',
      name: 'Administrador Principal',
      roleId: adminRole.id,
    },
    {
      email: 'manager@example.com',
      name: 'Gerente Principal',
      roleId: managerRole.id,
    },
    {
      email: 'user@example.com',
      name: 'Usuário Comum',
      roleId: userRole.id,
    },
    {
      email: 'admin2@example.com',
      name: 'Administrador 2',
      roleId: adminRole.id,
    },
    {
      email: 'test1@example.com',
      name: 'Test User 1',
      roleId: userRole.id,
    },
    {
      email: 'test2@example.com',
      name: 'Test User 2',
      roleId: userRole.id,
    },
    {
      email: 'test3@example.com',
      name: 'Test User 3',
      roleId: managerRole.id,
    },
    {
      email: 'test4@example.com',
      name: 'Test User 4',
      roleId: adminRole.id,
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: hashedPassword,
        name: userData.name,
        roleId: userData.roleId,
        tenantId: userData.tenantId,
      },
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        roleId: userData.roleId,
        tenantId: userData.tenantId,
      },
    });
    createdUsers.push(user);
  }

  console.log('✅ Usuários criados com senha 12345678');

  // Criar registros de auditoria
  for (const user of createdUsers) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        tenantId: tenant1.id,
        action: 'CREATE',
        subject: 'User',
        subjectId: user.id,
        dataAfter: { name: user.name, email: user.email },
      },
    });
  }

  console.log('✅ Dados de auditoria criados');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('📊 Dados criados:');
  console.log(`  - ${createdUsers.length} usuários`);
  console.log(`  - 3 roles (Administrador, Gerente, Usuário)`);
  console.log(`  - ${createdPermissions.length} permissions`);
  console.log(`  - 2 tenants`);
  console.log('\n🔑 Credenciais padrão:');
  console.log('  - admin@example.com / 12345678');
  console.log('  - manager@example.com / 12345678');
  console.log('  - user@example.com / 12345678');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });