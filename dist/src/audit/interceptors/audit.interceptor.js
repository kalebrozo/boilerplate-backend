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
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const operators_1 = require("rxjs/operators");
const audit_service_1 = require("../audit.service");
const auditable_decorator_1 = require("../decorators/auditable.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuditInterceptor = class AuditInterceptor {
    constructor(reflector, auditService, prisma) {
        this.reflector = reflector;
        this.auditService = auditService;
        this.prisma = prisma;
    }
    async intercept(context, next) {
        const auditableMetadata = this.reflector.get(auditable_decorator_1.AUDITABLE_KEY, context.getHandler());
        if (!auditableMetadata) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const tenantId = request.headers['x-tenant-id'];
        const { action, subject } = auditableMetadata;
        let dataBefore = null;
        let subjectId = null;
        if (['UPDATE', 'DELETE'].includes(action) && request.params.id) {
            subjectId = request.params.id;
            try {
                const model = this.getModelBySubject(subject);
                if (model) {
                    const entity = await model.findUnique({
                        where: { id: subjectId },
                    });
                    dataBefore = entity;
                }
            }
            catch (error) {
                console.error('Error fetching dataBefore:', error);
            }
        }
        return next.handle().pipe((0, operators_1.tap)(async (dataAfter) => {
            if (action === 'CREATE' && dataAfter?.id) {
                subjectId = dataAfter.id;
            }
            const clientInfo = {
                ip: request.ip,
                userAgent: request.headers['user-agent'],
            };
            await this.auditService.log({
                userId: user?.id || 'system',
                tenantId: tenantId || 'public',
                action,
                subject,
                subjectId,
                dataBefore,
                dataAfter,
                clientInfo,
            });
        }));
    }
    getModelBySubject(subject) {
        switch (subject.toLowerCase()) {
            case 'user':
                return this.prisma.user;
            case 'role':
                return this.prisma.role;
            case 'tenant':
                return this.prisma.tenant;
            default:
                return null;
        }
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        audit_service_1.AuditService,
        prisma_service_1.PrismaService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map