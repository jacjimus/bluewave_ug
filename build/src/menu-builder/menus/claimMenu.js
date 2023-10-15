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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../services/utils");
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const claimMenu = (args, db) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let { response, currentStep, userText, allSteps } = args;
    if (currentStep === 1) {
        response = "CON Make Claim " +
            "\n1. Inpatient Claim" +
            "\n2. Death Claim" +
            "\n0. Back" +
            "\n00. Main Menu";
    }
    else if (currentStep === 2) {
        switch (userText) {
            case "1":
                // CREATE CLAIM
                let claim_type = "Inpatient Claim";
                let user = yield db.users.findOne({
                    where: {
                        phone_number: args.phoneNumber,
                    },
                });
                const policy = yield db.policies.findOne({
                    where: {
                        user_id: user.user_id,
                        policy_status: "paid",
                    },
                });
                if (!policy) {
                    response = "END No policy found";
                    return response;
                }
                const claimId = (0, utils_1.generateClaimId)();
                const newClaim = yield db.claims.create({
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
                response = "END Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service";
                break;
            case "2":
                response = "CON Enter phone of next of Kin e.g 0759608107";
                break;
        }
    }
    else if (currentStep === 3) {
        response = "CON Enter your Relationship to the deceased";
    }
    else if (currentStep === 4) {
        response = "CON Enter Name of deceased";
    }
    else if (currentStep === 5) {
        response = "CON Enter Date of death in the format DDMMYYYY e.g 01011990";
    }
    else if (currentStep === 6) {
        const deathData = {
            nextOfKinPhoneNumber: allSteps[2].startsWith('0') ? allSteps[2].substring(1) : allSteps[2],
            relationship: allSteps[3],
            deceasedName: allSteps[4],
            dateOfDeath: allSteps[5],
        };
        // fomat date of death as YYYY-MM-DD
        deathData.dateOfDeath = `${deathData.dateOfDeath.substring(4)}-${deathData.dateOfDeath.substring(2, 4)}-${deathData.dateOfDeath.substring(0, 2)}`;
        // CREATE CLAIM
        let claim_type = "Death Claim";
        let user = yield db.users.findOne({
            where: {
                phone_number: deathData.nextOfKinPhoneNumber,
            },
        });
        const policy = yield db.policies.findOne({
            where: {
                user_id: user.user_id,
                policy_status: "paid",
            },
        });
        if (!policy) {
            response = "END No policy found";
            return response;
        }
        const claimId = (0, utils_1.generateClaimId)();
        const newClaim = yield db.claims.create({
            claim_number: claimId,
            policy_id: policy.policy_id,
            user_id: user.user_id,
            claim_date: new Date(),
            claim_status: "pending",
            partner_id: user.partner_id,
            claim_description: `${claim_type} ID: ${claimId} for Member ID: ${user.membership_id}  ${policy.policy_type.toUpperCase()} ${policy.beneficiary.toUpperCase()} policy`,
            claim_type: claim_type,
            claim_amount: policy.sum_insured,
            claim_death_date: deathData.dateOfDeath,
        });
        // update beneficiary
        const beneficiary = yield db.beneficiaries.findOne({
            where: {
                user_id: user.user_id,
                beneficiary_type: "NEXTOFKIN",
            },
        });
        if (!beneficiary) {
            response = "END No beneficiary found";
            return response;
        }
        const beneficiaryPhone = ((_a = beneficiary.phone_number) === null || _a === void 0 ? void 0 : _a.startsWith('+')) ? beneficiary.phone_number : `+${beneficiary.phone_number}`;
        const userPhone = ((_b = user.phone_number) === null || _b === void 0 ? void 0 : _b.startsWith('+')) ? user.phone_number : `+${user.phone_number}`;
        const sms = 'Your claim documents have been received. Your claim is being processed.';
        yield (0, sendSMS_1.default)(beneficiaryPhone || userPhone, sms);
        response = `END Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107`;
    }
    return response;
});
exports.default = claimMenu;
