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
exports.PaginationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class PaginationDto {
    constructor() {
        this.page = 1;
        this.limit = 10;
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
    }
    get skip() {
        return (this.page - 1) * this.limit;
    }
    get take() {
        return this.limit;
    }
    get orderBy() {
        return {
            [this.sortBy]: this.sortOrder,
        };
    }
}
exports.PaginationDto = PaginationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Número da página', default: 1, minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PaginationDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Itens por página', default: 10, minimum: 1, maximum: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PaginationDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Campo para ordenação', default: 'createdAt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaginationDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Direção da ordenação', enum: ['asc', 'desc'], default: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], PaginationDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Termo de busca para filtro' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaginationDto.prototype, "search", void 0);
//# sourceMappingURL=pagination.dto.js.map