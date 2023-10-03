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
exports.displayAccount = void 0;
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const utils_1 = require("../../services/utils");
function displayAccount(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    const Claim = db.claims;
    menu.state('account', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const user = yield db.users.findOne({
                where: {
                    phone_number: args.phoneNumber,
                    gender: {
                        [db.Sequelize.Op.ne]: null,
                    },
                },
            });
            console.log(" ============== USER ================ ", user);
            if (user) {
                menu.con('Medical cover ' +
                    '\n1. Buy for self' +
                    '\n2. Buy (family)' +
                    '\n3. Buy (others)' +
                    '\n4. Admission Claim' +
                    '\n5. My Account' +
                    '\n6. Choose Hopital' +
                    '\n7. Terms & Conditions' +
                    '\n8. FAQs' +
                    '\n0. UPDATE PROFILE' +
                    '\n00.Main Menu');
            }
            else {
                menu.con('Medical cover ' +
                    '\n0. Update profile(KYC)');
            }
        }),
        next: {
            '1': 'buyForSelf',
            '2': 'buyForFamily',
            '3': 'buyForOthers',
            '4': 'makeClaim',
            '5': 'myAccount',
            '6': 'chooseHospital',
            '7': 'termsAndConditions',
            '8': 'faqs',
            '0': 'updateProfile',
            '00': 'insurance',
        }
    });
    //buyForOthers
    //ask for phone number and name of person to buy for
    menu.state('buyForOthers', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con('Enter full name of person to buy for');
        }),
        next: {
            '*[a-zA-Z]+': 'buyForOthersPhoneNumber',
        }
    });
    menu.state('buyForOthersPhoneNumber', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let name = menu.val;
            let user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            });
            // save beneficiary name
            user === null || user === void 0 ? void 0 : user.update({
                beneficiary_name: name
            });
            //divide the name into first name and last name and save them separately
            let names = name.split(" ");
            let first_name = names[0];
            let last_name = names[1];
            const newBeneficiary = yield db.beneficiaries.create({
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                full_name: name,
                first_name: first_name,
                last_name: last_name,
            });
            menu.con('Enter phone Number of person to buy for');
        }),
        next: {
            '*[a-zA-Z]+': 'buyForOthersOptions',
        }
    });
    menu.state('buyForOthersOptions', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let beneficiary_phone_number = menu.val;
            console.log("NAME: ", name);
            let user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            });
            //update beneficiary phone number
            user === null || user === void 0 ? void 0 : user.update({
                beneficiary_phone_number: name
            });
            const newBeneficiary = yield db.beneficiaries.update({
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                phone_number: beneficiary_phone_number,
            });
            menu.con('Buy for others ' +
                '\n1. AIRTEL_MINI – UGX 10,000' +
                '\n2. AIRTEL_MIDI – UGX 14,000' +
                '\n3. AIRTEL_MAXI– UGX 18,000' +
                '\n0.Back' +
                '\n00.Main Menu');
        }),
        next: {
            '1': 'buyForSelf.bronze',
            '2': 'buyForSelf.silver',
            '3': 'buyForSelf.gold',
            '0': 'account',
            '00': 'insurance',
        }
    });
    //==================MAKE CLAIM===================
    menu.state('makeClaim', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const bronzeLastExpenseBenefit = "UGX 1,000,000";
            const silverLastExpenseBenefit = "UGX 1,500,000";
            const goldLastExpenseBenefit = "UGX 2,000,000";
            let user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            });
            let policies = yield Policy.findAll({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    policy_status: 'paid'
                },
            });
            console.log("POLICIES: ", policies);
            if (policies.length === 0) {
                menu.con('You have no policies\n' +
                    '1. Buy cover\n' +
                    '0. Back\n' +
                    '00. Main Menu');
                return;
            }
            let policyInfo = '';
            for (let i = 0; i < policies.length; i++) {
                let policy = policies[i];
                let benefit;
                if (policy.policy_type == 'AIRTEL_MINI') {
                    benefit = bronzeLastExpenseBenefit;
                }
                else if (policy.policy_type == 'AIRTEL_MIDI') {
                    benefit = silverLastExpenseBenefit;
                }
                else if (policy.policy_type == 'AIRTEL_MAXI') {
                    benefit = goldLastExpenseBenefit;
                }
                policyInfo += `${i + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
                    `   Inpatient limit: UGX ${policy.sum_insured}\n` +
                    `   Remaining: UGX ${policy.sum_insured}\n` +
                    `   Last Expense Per Person Benefit: ${benefit}\n\n`;
            }
            // menu.end(`My Insurance Policies:\n\n${policyInfo}`);
            menu.con(`Please, Choose policy to make a claim for
        ${policyInfo}
       
        00.Main Menu`);
        }),
        next: {
            '*\\d+': 'choosePolicyToMakeClaim',
            '0': 'account',
            '00': 'insurance',
        }
    });
    menu.state('choosePolicyToMakeClaim', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const policyIndex = Number(menu.val) - 1; // Adjust the policy index
            const phoneNumber = args.phoneNumber;
            try {
                const user = yield User.findOne({
                    where: {
                        phone_number: phoneNumber,
                    },
                });
                if (!user) {
                    throw new Error('Sorry. recgiister first');
                }
                const policies = yield Policy.findAll({
                    where: {
                        policy_status: 'paid',
                        user_id: user.user_id,
                    },
                });
                if (!policies || policies.length === 0) {
                    throw new Error('Sorry, No paid policies found, please buy a policy first or contact customer care');
                }
                const selectedPolicy = policies[policyIndex];
                if (!selectedPolicy) {
                    throw new Error('Sorry, Invalid policy selection');
                }
                const { policy_id, premium, policy_type, beneficiary, sum_insured, } = selectedPolicy;
                // check if claim has been made for this policy
                const existingClaim = yield Claim.findOne({
                    where: {
                        policy_id: policy_id,
                    },
                });
                if (existingClaim) {
                    menu.end('Claim already made for this policy');
                }
                // Example usage:
                const claimId = (0, utils_1.generateClaimId)();
                console.log(claimId);
                const claim = yield Claim.create({
                    claim_number: claimId,
                    policy_id: policy_id,
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    claim_date: new Date(),
                    claim_status: 'pending',
                    partner_id: user.partner_id,
                    claim_description: `Admission of Claim: ${claimId} for Member ID: ${user.membership_id}  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} policy`,
                    claim_type: 'Dwalingo medical cover claim',
                    claim_amount: sum_insured,
                });
                if (claim) {
                    const goldAndSilverMessage = `Your medical details have been confirmed. You are covered for Inpatient benefit of UGX 10,000,000`;
                    const bronzeMessage = `Your medical details have been confirmed. You are covered for Inpatient cash of UGX 4,500 per night payable from the second night`;
                    const message = policy_type.toLowerCase() === 'AIRTEL_MINI' ? bronzeMessage : goldAndSilverMessage;
                    yield (0, sendSMS_1.default)(phoneNumber, message);
                    menu.end(`Admission Claim - CLAIM ID: ${claim.claim_number},  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} - Premium: UGX ${premium}, SUM INSURED: UGX ${sum_insured} \nProceed to the reception to verify your details\n0. Back\n00. Main Menu"`);
                }
                else {
                    menu.end('Claim failed. Please try again');
                }
            }
            catch (error) {
                console.error('Error:', error);
                menu.end('An error occurred while processing the claim');
            }
        }),
    });
}
exports.displayAccount = displayAccount;
