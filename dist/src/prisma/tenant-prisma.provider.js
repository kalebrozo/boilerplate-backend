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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantPrismaProvider = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const client_1 = require("@prisma/client");
let TenantPrismaProvider = class TenantPrismaProvider extends client_1.PrismaClient {
    constructor(request) {
        super();
        this.request = request;
        this.initializeTenantConnection();
    }
    async initializeTenantConnection() {
        const tenantId = this.request.headers['x-tenant-id'];
        if (!tenantId) {
            throw new Error('Tenant ID is required');
        }
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is not defined');
        }
        const tenantDatabaseUrl = `${databaseUrl}?schema=${tenantId}`;
        const tenantPrisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: tenantDatabaseUrl,
                },
            },
        });
        Object.assign(this, tenantPrisma);
    }
};
exports.TenantPrismaProvider = TenantPrismaProvider;
exports.TenantPrismaProvider = TenantPrismaProvider = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(0, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [Object])
], TenantPrismaProvider);
//# sourceMappingURL=tenant-prisma.provider.js.map