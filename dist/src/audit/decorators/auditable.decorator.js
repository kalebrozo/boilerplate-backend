"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auditable = exports.AUDITABLE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.AUDITABLE_KEY = 'auditable';
const Auditable = (action, subject) => (0, common_1.SetMetadata)(exports.AUDITABLE_KEY, { action, subject });
exports.Auditable = Auditable;
//# sourceMappingURL=auditable.decorator.js.map