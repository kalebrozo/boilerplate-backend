import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed completo do sistema...');

  // Hash da senha padrão 12345678
  const passwordHash = await bcrypt.hash('12345678', 10);

  // 1. Criar Tenants
  const tenants = await Promise.all([
    prisma.tenant.create({
      data: {
        name: 'TechCorp Enterprise',
        schema: 'techcorp',
      },
    }),
    prisma.tenant.create({
      data: {
        name: 'StartupXYZ',
        schema: 'startupxyz',
      },
    }),
    prisma.tenant.create({
      data: {
        name: 'DevAgency',
        schema: 'devagency',
      },
    }),
  ]);

  console.log('✅ Tenants criados:', tenants.length);

  // 2. Criar Permissions
  const permissions = await Promise.all([
    // Permissões de usuários
    prisma.permission.create({
      data: { action: 'create', subject: 'User' },
    }),
    prisma.permission.create({
      data: { action: 'read', subject: 'User' },
    }),
    prisma.permission.create({
      data: { action: 'update', subject: 'User' },
    }),
    prisma.permission.create({
      data: { action: 'delete', subject: 'User' },
    }),

    // Permissões de roles
    prisma.permission.create({
      data: { action: 'create', subject: 'Role' },
    }),
    prisma.permission.create({
      data: { action: 'read', subject: 'Role' },
    }),
    prisma.permission.create({
      data: { action: 'update', subject: 'Role' },
    }),
    prisma.permission.create({
      data: { action: 'delete', subject: 'Role' },
    }),

    // Permissões de tenants
    prisma.permission.create({
      data: { action: 'create', subject: 'Tenant' },
    }),
    prisma.permission.create({
      data: { action: 'read', subject: 'Tenant' },
    }),
    prisma.permission.create({
      data: { action: 'update', subject: 'Tenant' },
    }),
    prisma.permission.create({
      data: { action: 'delete', subject: 'Tenant' },
    }),

    // Permissões de teste-geral
    prisma.permission.create({
      data: { action: 'create', subject: 'TesteGeral' },
    }),
    prisma.permission.create({
      data: { action: 'read', subject: 'TesteGeral' },
    }),
    prisma.permission.create({
      data: { action: 'update', subject: 'TesteGeral' },
    }),
    prisma.permission.create({
      data: { action: 'delete', subject: 'TesteGeral' },
    }),
  ]);

  console.log('✅ Permissions criadas:', permissions.length);

  // 3. Criar Roles
  const roles = [];
  
  // Super Admin (acesso total)
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
    },
  });
  roles.push(superAdminRole);

  // Admin (acesso administrativo)
  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
    },
  });
  roles.push(adminRole);

  // Manager (gerente)
  const managerRole = await prisma.role.create({
    data: {
      name: 'Manager',
    },
  });
  roles.push(managerRole);

  // User (usuário comum)
  const userRole = await prisma.role.create({
    data: {
      name: 'User',
    },
  });
  roles.push(userRole);

  // Viewer (apenas visualização)
  const viewerRole = await prisma.role.create({
    data: {
      name: 'Viewer',
    },
  });
  roles.push(viewerRole);

  console.log('✅ Roles criadas:', roles.length);

  // 4. Associar permissions às roles usando update com connect
  
  // Super Admin - todas as permissões
  await prisma.role.update({
    where: { id: superAdminRole.id },
    data: {
      permissions: {
        connect: permissions.map(p => ({ id: p.id }))
      }
    }
  });

  // Admin - permissões administrativas
  const adminPermissionIds = permissions.filter(p => 
    ['User', 'Role', 'TesteGeral'].includes(p.subject)
  ).map(p => ({ id: p.id }));
  
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        connect: adminPermissionIds
      }
    }
  });

  // Manager - permissões limitadas (apenas leitura e update de users e teste-geral)
  const managerPermissionIds = permissions.filter(p => 
    (p.subject === 'User' && ['read', 'update'].includes(p.action)) ||
    p.subject === 'TesteGeral'
  ).map(p => ({ id: p.id }));
  
  await prisma.role.update({
    where: { id: managerRole.id },
    data: {
      permissions: {
        connect: managerPermissionIds
      }
    }
  });

  // User - permissões básicas (apenas leitura e create/update/delete de teste-geral)
  const userPermissionIds = permissions.filter(p => 
    p.action === 'read' || p.subject === 'TesteGeral'
  ).map(p => ({ id: p.id }));
  
  await prisma.role.update({
    where: { id: userRole.id },
    data: {
      permissions: {
        connect: userPermissionIds
      }
    }
  });

  // Viewer - apenas leitura
  const viewerPermissionIds = permissions.filter(p => 
    p.action === 'read'
  ).map(p => ({ id: p.id }));
  
  await prisma.role.update({
    where: { id: viewerRole.id },
    data: {
      permissions: {
        connect: viewerPermissionIds
      }
    }
  });

  console.log('✅ Permissions associadas às roles');

  // 5. Criar Usuários
  const users = await Promise.all([
    // Super Admin
    prisma.user.create({
      data: {
        email: 'superadmin@system.com',
        name: 'Super Admin',
        password: passwordHash,
        roleId: superAdminRole.id,
      },
    }),
    // Admin
    prisma.user.create({
      data: {
        email: 'admin@system.com',
        name: 'Admin User',
        password: passwordHash,
        roleId: adminRole.id,
      },
    }),
    // Manager
    prisma.user.create({
      data: {
        email: 'manager@system.com',
        name: 'Manager User',
        password: passwordHash,
        roleId: managerRole.id,
      },
    }),
    // User
    prisma.user.create({
      data: {
        email: 'user@system.com',
        name: 'Regular User',
        password: passwordHash,
        roleId: userRole.id,
      },
    }),
    // Viewer
    prisma.user.create({
      data: {
        email: 'viewer@system.com',
        name: 'Viewer User',
        password: passwordHash,
        roleId: viewerRole.id,
      },
    }),
  ]);

  console.log('✅ Usuários criados:', users.length);

  // 6. Criar dados de exemplo para teste-geral
  const testeGeralData = [];
  
  // Dados para TechCorp
  for (let i = 1; i <= 15; i++) {
    testeGeralData.push({
      nome: `TechCorp Project ${i}`,
      descricao: `Descrição do projeto ${i} da TechCorp`,
      valorDecimal: Math.floor(Math.random() * 10000) / 100,
      valorInteiro: Math.floor(Math.random() * 1000),
      valorFloat: Math.random() * 100,
      ativo: i % 3 !== 0, // 2/3 ativos
      status: i % 4 === 0 ? 'INATIVO' : 'ATIVO',
      categoria: ['TECNOLOGIA', 'FINANCEIRO', 'SAUDE', 'EDUCACAO'][Math.floor(Math.random() * 4)],
      dataVencimento: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      duracao: Math.floor(Math.random() * 480) + 60, // 60-540 minutos
      tags: [`tag${i}`, `project${i}`, 'techcorp'],
      metadados: { priority: i % 3 + 1, complexity: ['low', 'medium', 'high'][i % 3] },
      email: `project${i}@techcorp.com`,
      tenantId: tenants[0].id,
      criadoPorId: users[Math.floor(Math.random() * users.length)].id,
    });
  }

  // Dados para StartupXYZ
  for (let i = 1; i <= 8; i++) {
    testeGeralData.push({
      nome: `StartupXYZ Feature ${i}`,
      descricao: `Feature ${i} da StartupXYZ`,
      valorDecimal: Math.floor(Math.random() * 5000) / 100,
      valorInteiro: Math.floor(Math.random() * 500),
      valorFloat: Math.random() * 50,
      ativo: i % 2 === 0, // 50% ativos
      status: i % 3 === 0 ? 'PENDENTE' : 'ATIVO',
      categoria: 'TECNOLOGIA',
      dataVencimento: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000),
      duracao: Math.floor(Math.random() * 240) + 30,
      tags: [`feature${i}`, 'startup', 'mvp'],
      metadados: { sprint: Math.ceil(i / 2), storyPoints: i % 5 + 1 },
      email: `feature${i}@startupxyz.io`,
      tenantId: tenants[1].id,
      criadoPorId: users[Math.floor(Math.random() * users.length)].id,
    });
  }

  // Dados para DevAgency
  for (let i = 1; i <= 12; i++) {
    testeGeralData.push({
      nome: `DevAgency Service ${i}`,
      descricao: `Serviço ${i} da DevAgency`,
      valorDecimal: Math.floor(Math.random() * 8000) / 100,
      valorInteiro: Math.floor(Math.random() * 800),
      valorFloat: Math.random() * 80,
      ativo: true, // Todos ativos
      status: 'ATIVO',
      categoria: 'TECNOLOGIA',
      dataVencimento: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
      duracao: Math.floor(Math.random() * 720) + 120,
      tags: [`service${i}`, 'development', 'consulting'],
      metadados: { client: `Client ${i}`, contract: `DEV-2024-${i}` },
      email: `service${i}@devagency.dev`,
      tenantId: tenants[2].id,
      criadoPorId: users[Math.floor(Math.random() * users.length)].id,
    });
  }

  await Promise.all(
    testeGeralData.map(data =>
      prisma.testeGeral.create({ data })
    )
  );

  console.log('✅ Dados de teste-geral criados:', testeGeralData.length);

  // 7. Criar logs de auditoria de exemplo
  const auditLogs = [];
  
  for (const user of users.slice(0, 3)) { // Apenas para os primeiros 3 usuários
    auditLogs.push(
      prisma.auditLog.create({
        data: {
          action: 'CREATE',
          subject: 'User',
          subjectId: user.id,
          userId: user.id,
          tenantId: tenants[0].id,
          dataBefore: {},
          dataAfter: { email: user.email, name: user.name },
          clientInfo: { ip: '127.0.0.1', userAgent: 'Seed Script' },
        },
      })
    );
  }

  await Promise.all(auditLogs);
  console.log('✅ Logs de auditoria criados:', auditLogs.length);

  console.log('🎉 Seed completo finalizado com sucesso!');
  console.log('📊 Resumo:');
  console.log(`   - Tenants: ${tenants.length}`);
  console.log(`   - Permissions: ${permissions.length}`);
  console.log(`   - Roles: ${roles.length}`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - TesteGeral records: ${testeGeralData.length}`);
  console.log(`   - Audit logs: ${auditLogs.length}`);
  console.log('\n🔑 Credenciais de acesso:');
  console.log('   superadmin@system.com / 12345678 - Super Admin (acesso total)');
  console.log('   admin@system.com / 12345678 - Admin');
  console.log('   manager@system.com / 12345678 - Manager');
  console.log('   user@system.com / 12345678 - User');
  console.log('   viewer@system.com / 12345678 - Viewer');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });