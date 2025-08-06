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
exports.PermissionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissions_service_1 = require("./permissions.service");
const create_permission_dto_1 = require("./dto/create-permission.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const auditable_decorator_1 = require("../audit/decorators/auditable.decorator");
const audit_interceptor_1 = require("../audit/interceptors/audit.interceptor");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let PermissionsController = class PermissionsController {
    constructor(permissionsService) {
        this.permissionsService = permissionsService;
    }
    async create(createPermissionDto) {
        return this.permissionsService.create(createPermissionDto);
    }
    async findAll(pagination) {
        return this.permissionsService.findAll(pagination);
    }
    async findOne(id) {
        return this.permissionsService.findOne(id);
    }
    async update(id, updatePermissionDto) {
        return this.permissionsService.update(id, updatePermissionDto);
    }
    async remove(id) {
        return this.permissionsService.remove(id);
    }
};
exports.PermissionsController = PermissionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    (0, auditable_decorator_1.Auditable)('CREATE_PERMISSION', 'Permission'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new permission' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Permission created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_permission_dto_1.CreatePermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all permissions with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of permissions' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get permission by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Permission details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    (0, auditable_decorator_1.Auditable)('UPDATE_PERMISSION', 'Permission'),
    (0, swagger_1.ApiOperation)({ summary: 'Update permission' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Permission updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_permission_dto_1.UpdatePermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    (0, auditable_decorator_1.Auditable)('DELETE_PERMISSION', 'Permission'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete permission' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Permission deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "remove", null);
exports.PermissionsController = PermissionsController = __decorate([
    (0, swagger_1.ApiTags)('permissions'),
    (0, common_1.Controller)('permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [permissions_service_1.PermissionsService])
], PermissionsController);
//# sourceMappingURL=permissions.controller.js.map