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
exports.UpdatePermissionDto = exports.CreatePermissionDto = exports.Action = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var Action;
(function (Action) {
    Action["MANAGE"] = "manage";
    Action["CREATE"] = "create";
    Action["READ"] = "read";
    Action["UPDATE"] = "update";
    Action["DELETE"] = "delete";
})(Action || (exports.Action = Action = {}));
class CreatePermissionDto {
}
exports.CreatePermissionDto = CreatePermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Action type',
        enum: Action,
        example: Action.READ,
    }),
    (0, class_validator_1.IsEnum)(Action),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Subject/resource',
        example: 'User',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "subject", void 0);
class UpdatePermissionDto {
}
exports.UpdatePermissionDto = UpdatePermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Action type',
        enum: Action,
        example: Action.READ,
        required: false,
    }),
    (0, class_validator_1.IsEnum)(Action),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Subject/resource',
        example: 'User',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "subject", void 0);
//# sourceMappingURL=create-permission.dto.js.map