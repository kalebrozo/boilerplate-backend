"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting seed...');
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.tenant.deleteMany();
    const defaultTenant = await prisma.tenant.create({
        data: {
            name: 'Default Tenant',
            schema: 'public',
        },
    });
    const permissions = await Promise.all([
        prisma.permission.create({
            data: {
                action: 'MANAGE',
                subject: 'all',
            },
        }),
        prisma.permission.create({
            data: {
                action: 'READ',
                subject: 'User',
            },
        }),
        prisma.permission.create({
            data: {
                action: 'CREATE',
                subject: 'User',
            },
        }),
        prisma.permission.create({
            data: {
                action: 'UPDATE',
                subject: 'User',
            },
        }),
        prisma.permission.create({
            data: {
                action: 'DELETE',
                subject: 'User',
            },
        }),
        prisma.permission.create({
            data: {
                action: 'READ',
                subject: 'Role',
            },
        }),
        prisma.permission.create({
            data: {
                action: 'MANAGE',
                subject: 'Role',
            },
        }),
    ]);
    const adminRole = await prisma.role.create({
        data: {
            name: 'admin',
            permissions: {
                connect: [{ id: permissions[0].id }],
            },
        },
    });
    const userRole = await prisma.role.create({
        data: {
            name: 'user',
            permissions: {
                connect: [{ id: permissions[1].id }],
            },
        },
    });
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@example.com',
            name: 'Admin',
            password: hashedPassword,
            roleId: adminRole.id,
        },
    });
    console.log('Seed completed successfully!');
    console.log('Admin user created: admin@example.com / admin123');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map