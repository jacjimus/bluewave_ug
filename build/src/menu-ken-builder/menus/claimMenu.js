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
const utils_1 = require("../../services/utils");
const claimMenu = (args, db) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let { response, currentStep, userText, allSteps } = args;
    let user = null;
    if (currentStep === 1) {
        response = "CON Make Claim " +
            "\n1. Inpatient Claim" +
            "\n2. Hospital Cash" +
            "\n0. Back" +
            "\n00. Main Menu";
    }
    else if (currentStep === 2) {
        const claimId = (0, utils_1.generateClaimId)();
        switch (userText) {
            case "1":
                let claim_type = "Inpatient Claim";
                user = yield db.users.findOne({
                    where: {
                        phone_number: (_a = args.phoneNumber.replace('+', "")) === null || _a === void 0 ? void 0 : _a.substring(3),
                    },
                    limit: 1,
                });
                console.log("USER ID", user.user_id);
                response = "END Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service";
                const policy = yield db.policies.findAll({
                    where: {
                        user_id: user.user_id,
                        policy_status: "paid",
                    },
                });
                console.log("POLICY", policy);
                if (!policy) {
                    response = "CON No policy found" + "\n0. Back \n00. Main Menu";
                    return response;
                }
                yield db.claims.create({
                    claim_number: claimId,
                    policy_id: policy.policy_id,
                    user_id: user.user_id,
                    claim_date: new Date(),
                    claim_status: "pending",
                    partner_id: user.partner_id,
                    claim_description: `${claim_type} ID: ${claimId} for Member ID: ${user.membership_id}  ${policy.policy_type.toUpperCase()} ${policy.beneficiary.toUpperCase()} policy`,
                    claim_type: claim_type,
                    claim_amount: policy.sum_insured,
                });
                break;
            case "2":
                response = `END Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and your clim sorted`;
                yield db.claims.create({
                    claim_number: claimId,
                    policy_id: policy.policy_id,
                    user_id: user.user_id,
                    claim_date: new Date(),
                    claim_status: "pending",
                    partner_id: user.partner_id,
                    claim_description: `${claim_type} ID: ${claimId} for Member ID: ${user.membership_id}  ${policy.policy_type.toUpperCase()} ${policy.beneficiary.toUpperCase()} policy`,
                    claim_type: claim_type,
                    claim_amount: policy.sum_insured,
                });
                break;
        }
    }
    return response;
});
exports.default = claimMenu;
