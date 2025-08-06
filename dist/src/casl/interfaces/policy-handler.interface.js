"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyHandlerImpl = void 0;
class PolicyHandlerImpl {
    constructor(callback) {
        this.callback = callback;
    }
    handle(ability) {
        return this.callback(ability);
    }
}
exports.PolicyHandlerImpl = PolicyHandlerImpl;
//# sourceMappingURL=policy-handler.interface.js.map