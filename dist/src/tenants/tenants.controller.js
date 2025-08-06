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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tenants_service_1 = require("./tenants.service");
const create_tenant_dto_1 = require("./dto/create-tenant.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const auditable_decorator_1 = require("../audit/decorators/auditable.decorator");
const common_2 = require("@nestjs/common");
const audit_interceptor_1 = require("../audit/interceptors/audit.interceptor");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let TenantsController = class TenantsController {
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    async create(createTenantDto) {
        return this.tenantsService.create(createTenantDto);
    }
    async findAll(pagination) {
        return this.tenantsService.findAll(pagination);
    }
    async findOne(id) {
        return this.tenantsService.findOne(id);
    }
    async update(id, updateTenantDto) {
        return this.tenantsService.update(id, updateTenantDto);
    }
    async remove(id) {
        return this.tenantsService.remove(id);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_2.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    (0, auditable_decorator_1.Auditable)('CREATE_TENANT', 'Tenant'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new tenant' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Tenant created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tenant_dto_1.CreateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tenants with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of tenants' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenant details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_2.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    (0, auditable_decorator_1.Auditable)('UPDATE_TENANT', 'Tenant'),
    (0, swagger_1.ApiOperation)({ summary: 'Update tenant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenant updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_tenant_dto_1.UpdateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_2.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    (0, auditable_decorator_1.Auditable)('DELETE_TENANT', 'Tenant'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete tenant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenant deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "remove", null);
exports.TenantsController = TenantsController = __decorate([
    (0, swagger_1.ApiTags)('tenants'),
    (0, common_1.Controller)('tenants'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map