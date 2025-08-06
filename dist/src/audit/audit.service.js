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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(data) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    tenantId: data.tenantId,
                    action: data.action,
                    subject: data.subject,
                    subjectId: data.subjectId || null,
                    dataBefore: data.dataBefore ? JSON.stringify(data.dataBefore) : null,
                    dataAfter: data.dataAfter ? JSON.stringify(data.dataAfter) : null,
                    clientInfo: data.clientInfo ? JSON.stringify(data.clientInfo) : null,
                },
            });
        }
        catch (error) {
            console.error('Error creating audit log:', error);
        }
    }
    async findAll(pagination) {
        const { skip, take, orderBy, search } = pagination;
        const where = search ? {
            OR: [
                { action: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
                { subjectId: { contains: search, mode: 'insensitive' } },
            ],
        } : {};
        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take,
                orderBy,
            }),
            this.prisma.auditLog.count({ where }),
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
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map