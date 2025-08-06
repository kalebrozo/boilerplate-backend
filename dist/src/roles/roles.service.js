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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RolesService = class RolesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createRoleDto) {
        const existingRole = await this.prisma.role.findUnique({
            where: { name: createRoleDto.name },
        });
        if (existingRole) {
            throw new common_1.ConflictException('Role already exists');
        }
        return this.prisma.role.create({
            data: {
                name: createRoleDto.name,
                permissions: createRoleDto.permissionIds ? {
                    connect: createRoleDto.permissionIds.map(id => ({ id })),
                } : undefined,
            },
            include: { permissions: true },
        });
    }
    async findAll(pagination) {
        const { skip, take, orderBy, search } = pagination;
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        } : {};
        const [data, total] = await Promise.all([
            this.prisma.role.findMany({
                where,
                include: { permissions: true },
                skip,
                take,
                orderBy,
            }),
            this.prisma.role.count({ where }),
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
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: { permissions: true },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return role;
    }
    async update(id, updateRoleDto) {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        if (updateRoleDto.name && updateRoleDto.name !== role.name) {
            const existingRole = await this.prisma.role.findUnique({
                where: { name: updateRoleDto.name },
            });
            if (existingRole) {
                throw new common_1.ConflictException('Role name already exists');
            }
        }
        return this.prisma.role.update({
            where: { id },
            data: {
                name: updateRoleDto.name,
                permissions: updateRoleDto.permissionIds ? {
                    set: updateRoleDto.permissionIds.map(id => ({ id })),
                } : undefined,
            },
            include: { permissions: true },
        });
    }
    async remove(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return this.prisma.role.delete({
            where: { id },
        });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map