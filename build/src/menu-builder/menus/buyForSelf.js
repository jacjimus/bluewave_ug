"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyForSelf = void 0;
function buyForSelf(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
    }
    const findUserByPhoneNumber = (phoneNumber) => __awaiter(this, void 0, void 0, function* () {
        return yield User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    });
    const findPaidPolicyByUser = (user) => __awaiter(this, void 0, void 0, function* () {
        let policies = yield Policy.findAll({
            where: {
                user_id: user.user_id,
                policy_status: 'paid'
            },
        });
        return policies[policies.length - 1];
    });
    const findPolicyByUser = (user_id) => __awaiter(this, void 0, void 0, function* () {
        let policies = yield Policy.findAll({
            where: {
                user_id: user_id,
            },
        });
        return policies[policies.length - 1];
    });
}
exports.buyForSelf = buyForSelf;
