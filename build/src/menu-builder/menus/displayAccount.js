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
exports.displayAccount = void 0;
function displayAccount(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    const Claim = db.claims;
    menu.state('account', {
        run: () => {
            menu.con('Medical cover ' +
                '\n1. Buy for self' +
                '\n2. Buy (family)' +
                '\n3. Buy (others)' +
                '\n4. Admission Claim' +
                '\n5. My Account' +
                '\n6. Choose Hopital' +
                '\n7. Terms & Conditions' +
                '\n8. FAQs' +
                '\n0.Back' +
                '\n00.Main Menu');
        },
        next: {
            '1': 'buyForSelf',
            '2': 'buyForFamily',
            '3': 'buyForOthers',
            '4': 'makeClaim',
            '5': 'myAccount',
            '6': 'chooseHospital',
            '7': 'termsAndConditions',
            '8': 'faqs',
        }
    });
    //buyForOthers
    //ask for phone number and name of person to buy for
    menu.state('buyForOthers', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con('Enter full name or phone number of person to buy for');
        }),
        next: {
            '*[a-zA-Z]+': 'buyForOthersOptions',
        }
    });
    menu.state('buyForOthersOptions', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let name = menu.val;
            console.log("NAME: ", name);
            let user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            });
            console.log("USER: ", user);
            //update user name
            user.name = name;
            user.save().then((user) => {
                console.log("USER: ", user);
            }).catch((err) => {
                console.log("ERR: ", err);
            });
            console.log("USER: ", user);
            menu.con('Buy for others ' +
                '\n1. Bronze  – UGX 10,000' +
                '\n2. Silver – UGX 14,000' +
                '\n3. Gold – UGX 18,000' +
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
                if (policy.policy_type == 'bronze') {
                    benefit = bronzeLastExpenseBenefit;
                }
                else if (policy.policy_type == 'silver') {
                    benefit = silverLastExpenseBenefit;
                }
                else if (policy.policy_type == 'gold') {
                    benefit = goldLastExpenseBenefit;
                }
                policyInfo += `${i + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
                    `   Inpatient limit: UGX ${policy.sum_insured}\n` +
                    `   Remaining: UGX ${policy.sum_insured}\n` +
                    `   Last Expense Per Person Benefit: ${benefit}\n\n`;
            }
            // menu.end(`My Insurance Policies:\n\n${policyInfo}`);
            menu.con(`Choose policy to make a claim for
        ${policyInfo}
       
        00.Main Menu`);
        }),
        next: {
            '*\\d+': 'choosePolicyTomakeClaim',
            '0': 'account',
            '00': 'insurance',
        }
    });
    menu.state('choosePolicyTomakeClaim', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let policy = Number(menu.val);
            let user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            });
            let policies = yield Policy.findAll({
                where: {
                    user_id: user.user_id,
                },
            });
            policies = policies[policy - 1];
            console.log("POLICIES: ", policies);
            let { id, premium, policy_type, beneficiary, sum_insured } = policies;
            const claim = yield Claim.create({
                policy_id: id,
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                claim_date: new Date(),
                claim_status: "pending",
                partner_id: user.partner_id,
                claim_description: "Admission of Claim",
                claim_type: "medical claim",
                claim_amount: sum_insured,
            });
            console.log("CLAIM", claim);
            if (claim) {
                //Paid Kes 5,000 for Medical cover. Your next payment will be due on day # of [NEXT MONTH]
                //     menu.end(`Paid Kes ${amount} for Medical cover. 
                // Your next payment will be due on day ${policy_deduction_day} of ${nextMonth}`)
                menu.end(`Admission Claim - CLAIM ID: ${claim.claim_id},  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} - Premium: UGX ${premium}, SUM INSURED: UGX ${sum_insured} \nProceed to the reception to verify your details\n0. Back\n00. Main Menu"`);
            }
            else {
                menu.end('Claim failed. Please try again');
            }
        })
    });
}
exports.displayAccount = displayAccount;
