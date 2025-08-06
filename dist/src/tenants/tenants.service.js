"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TenantsService = class TenantsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createTenantDto) {
        const existing = await this.prisma.tenant.findFirst({
            where: {
                OR: [
                    { name: createTenantDto.name },
                    { schema: createTenantDto.schema },
                ],
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Tenant name or schema already exists');
        }
        const tenant = await this.prisma.tenant.create({
            data: createTenantDto,
        });
        await this.createTenantSchema(createTenantDto.schema);
        await this.runMigrationsForSchema(createTenantDto.schema);
        return tenant;
    }
    async findAll(pagination) {
        const { skip, take, orderBy, search } = pagination;
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { schema: { contains: search, mode: 'insensitive' } },
            ],
        } : {};
        const [data, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                skip,
                take,
                orderBy,
            }),
            this.prisma.tenant.count({ where }),
        ]);
        return {
            data,
            meta: {
                total,
                page: pagination.page,
                limit: pagination.limit,
                totalPages: Math.ceil(total / pagination.limit),
                hasNext: skip + take < total,
                hasPrev: skip > 0,
            },
        };
    }
    async findOne(id) {
        return this.prisma.tenant.findUnique({
            where: { id },
        });
    }
    async update(id, updateTenantDto) {
        return this.prisma.tenant.update({
            where: { id },
            data: updateTenantDto,
        });
    }
    async remove(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
        });
        if (!tenant) {
            throw new common_1.BadRequestException('Tenant not found');
        }
        await this.dropTenantSchema(tenant.schema);
        return this.prisma.tenant.delete({
            where: { id },
        });
    }
    async createTenantSchema(schemaName) {
        await this.prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    }
    async runMigrationsForSchema(schemaName) {
        const createUserTable = `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."User" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT NOT NULL,
        roleId TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
        const createRoleTable = `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."Role" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
        const createPermissionTable = `
      CREATE TABLE IF NOT EXISTS "${schemaName}"."Permission" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        action TEXT NOT NULL,
        subject TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(action, subject)
      );
    `;
        await this.prisma.$executeRawUnsafe(createUserTable);
        await this.prisma.$executeRawUnsafe(createRoleTable);
        await this.prisma.$executeRawUnsafe(createPermissionTable);
        await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "${schemaName}"."User" 
      ADD CONSTRAINT fk_role 
      FOREIGN KEY (roleId) REFERENCES "${schemaName}"."Role"(id);
    `);
        await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."_PermissionToRole" (
        "A" TEXT NOT NULL REFERENCES "${schemaName}"."Permission"(id),
        "B" TEXT NOT NULL REFERENCES "${schemaName}"."Role"(id),
        PRIMARY KEY ("A", "B")
      );
    `);
        await this.prisma.$executeRawUnsafe(`
      INSERT INTO "${schemaName}"."Role" (id, name) 
      VALUES (gen_random_uuid(), 'admin') 
      ON CONFLICT (name) DO NOTHING;
    `);
        await this.prisma.$executeRawUnsafe(`
      INSERT INTO "${schemaName}"."Role" (id, name) 
      VALUES (gen_random_uuid(), 'user') 
      ON CONFLICT (name) DO NOTHING;
    `);
    }
    async dropTenantSchema(schemaName) {
        await this.prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map