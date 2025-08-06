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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PermissionsService = class PermissionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createPermissionDto) {
        const existingPermission = await this.prisma.permission.findUnique({
            where: {
                action_subject: {
                    action: createPermissionDto.action,
                    subject: createPermissionDto.subject
                }
            },
        });
        if (existingPermission) {
            throw new common_1.ConflictException('Permission already exists');
        }
        return this.prisma.permission.create({
            data: createPermissionDto,
        });
    }
    async findAll(pagination) {
        const { skip, take, orderBy, search } = pagination;
        const where = search ? {
            OR: [
                { action: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
            ],
        } : {};
        const [data, total] = await Promise.all([
            this.prisma.permission.findMany({
                where,
                skip,
                take,
                orderBy,
            }),
            this.prisma.permission.count({ where }),
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
        const permission = await this.prisma.permission.findUnique({
            where: { id },
        });
        if (!permission) {
            throw new common_1.NotFoundException('Permission not found');
        }
        return permission;
    }
    async update(id, updatePermissionDto) {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
        });
        if (!permission) {
            throw new common_1.NotFoundException('Permission not found');
        }
        if (updatePermissionDto.action && updatePermissionDto.subject) {
            const existingPermission = await this.prisma.permission.findUnique({
                where: {
                    action_subject: {
                        action: updatePermissionDto.action,
                        subject: updatePermissionDto.subject
                    }
                },
            });
            if (existingPermission && existingPermission.id !== id) {
                throw new common_1.ConflictException('Permission already exists');
            }
        }
        return this.prisma.permission.update({
            where: { id },
            data: updatePermissionDto,
        });
    }
    async remove(id) {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
        });
        if (!permission) {
            throw new common_1.NotFoundException('Permission not found');
        }
        return this.prisma.permission.delete({
            where: { id },
        });
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map