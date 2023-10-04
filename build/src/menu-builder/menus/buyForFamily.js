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
exports.buyForFamily = void 0;
const payment_1 = require("../../services/payment");
const uuid_1 = require("uuid");
function buyForFamily(menu, args, db) {
    const Policy = db.policies;
    const Beneficiary = db.beneficiaries;
    const User = db.users;
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
        return yield Policy.findOne({
            where: {
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                policy_status: 'paid',
            },
        });
    });
    const findPolicyByUser = (user_id) => __awaiter(this, void 0, void 0, function* () {
        return yield Policy.findOne({
            where: {
                user_id: user_id,
            },
        });
    });
    //============  BUY FOR FAMILY ===================
    menu.state('buyForFamily', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            const policy = yield findPaidPolicyByUser(user);
            if (policy) {
                menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
                return;
            }
            menu.con('Buy for family ' +
                '\n1. M+1' +
                '\n2. M+2' +
                '\n3. M+3' +
                '\n4. M+4' +
                '\n5. M+5' +
                '\n6. M+6' +
                '\n0.Back' +
                '\n00.Main Menu');
        }),
        next: {
            '*\\d+': 'buyForFamily.selfSpouseCover',
        }
    });
    menu.state('buyForFamily.selfSpouseCover', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const member_number = menu.val;
            console.log("MEMBER NUMBER", member_number);
            yield User.update({ total_member_number: member_number }, { where: { phone_number: args.phoneNumber } });
            menu.con(`
                    1. Mini – UGX 20,000
                    2. Midi – UGX 28,000
                    3. Biggie – UGX 35,000
                    0. Back
                    00. Main Menu`);
        }),
        next: {
            '*\\d+': 'buyForFamily.selfSpouseCoverType',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForFamily.selfSpouseCoverType', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let coverType = menu.val;
            console.log("COVER TYPE", coverType);
            let { user_id, partner_id } = yield findUserByPhoneNumber(args.phoneNumber);
            let date = new Date();
            let day = date.getDate();
            if (coverType == 1) {
                coverType = 'MINI';
            }
            else if (coverType == 2) {
                coverType = 'MIDI';
            }
            else if (coverType == 3) {
                coverType = 'BIGGIE';
            }
            yield Policy.create({
                user_id: user_id,
                policy_id: (0, uuid_1.v4)(),
                policy_type: coverType,
                beneficiary: 'FAMILY',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                partner_id: partner_id,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            });
            yield User.update({ cover_type: coverType }, { where: { phone_number: args.phoneNumber } });
            menu.con('\nEnter Name of Spouse ' +
                '\n0.Back' +
                '\n00.Main Menu');
        }),
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouseName',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });
    menu.state('buyForFamily.selfSpouseName', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let spouse = menu.val;
            console.log("SPOUSE NAME", spouse);
            let { user_id, } = yield findUserByPhoneNumber(args.phoneNumber);
            let beneficiary = {
                beneficiary_id: (0, uuid_1.v4)(),
                full_name: spouse,
                first_name: spouse.split(" ")[0],
                middle_name: spouse.split(" ")[1],
                last_name: spouse.split(" ")[2] || spouse.split(" ")[1],
                relationship: 'SPOUSE',
                member_number: "M+1",
                user_id: user_id
            };
            let newBeneficiary = yield Beneficiary.create(beneficiary);
            console.log("new beneficiary selfSpouse", newBeneficiary);
            menu.con('\nEnter ID of Spouse ' +
                '\n0.Back' +
                '\n00.Main Menu');
        }),
        next: {
            '*\\d+': 'buyForFamily.selfSpouseId',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });
    //buyForFamily.selfSpouse.spouse
    menu.state('buyForFamily.selfSpouseId', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const spouseId = menu.val;
            console.log("SPOUSE ID", spouseId);
            const { user_id, partner_id, phone_number, first_name, last_name } = yield findUserByPhoneNumber(args.phoneNumber);
            yield Beneficiary.update({ national_id: spouseId }, { where: { user_id: user_id, member_number: "M+1" } });
            const { policy_type } = yield findPolicyByUser(user_id);
            let sum_insured, premium = 0, yearly_premium = 0;
            if (policy_type == 'MINI') {
                sum_insured = "1.5M";
                premium = 20000;
                yearly_premium = 240000;
            }
            else if (policy_type == 'MIDI') {
                sum_insured = "3M";
                premium = 28000;
                yearly_premium = 336000;
            }
            else if (policy_type == 'BIGGIE') {
                sum_insured = "5M";
                premium = 35000;
                yearly_premium = 420000;
            }
            menu.con(`Inpatient Family cover for ${phone_number} ${first_name} ${last_name} UGX ${sum_insured} each a year
                  PAY
                  1-UGX ${premium} payable monthly
                  2-UGX ${yearly_premium} yearly
                  0.Back
                  00.Main Menu`);
        }),
        next: {
            '*\\d+': 'buyForFamilyPin',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });
    menu.state('buyForFamilyPin', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const paymentOption = Number(menu.val);
            console.log("PAYMENT OPTION", paymentOption);
            const { user_id } = yield findUserByPhoneNumber(args.phoneNumber);
            const { policy_type, policy_id } = yield findPolicyByUser(user_id);
            console.log("POLICY TYPE", policy_type);
            if (policy_id == null) {
                menu.end('Sorry, you have no policy to buy for family');
            }
            let sum_insured, premium = 0, installment_type = 0, period = 'monthly';
            if (policy_type == 'MINI') {
                period = 'yearly';
                installment_type = 1;
                sum_insured = 1500000;
                premium = 240000;
                if (paymentOption == 1) {
                    period = 'monthly';
                    premium = 20000;
                    installment_type = 2;
                }
            }
            else if (policy_type == 'MIDI') {
                period = 'yearly';
                installment_type = 1;
                sum_insured = 3000000;
                premium = 336000;
                if (paymentOption == 1) {
                    period = 'monthly';
                    premium = 28000;
                    installment_type = 2;
                }
            }
            else if (policy_type == 'BIGGIE') {
                period = 'yearly';
                installment_type = 1;
                sum_insured = 5000000;
                premium = 420000;
                if (paymentOption == 1) {
                    period = 'monthly';
                    premium = 35000;
                    installment_type = 2;
                }
            }
            menu.con(`Pay UGX ${premium} payable ${period}.
                    Terms&Conditions - www.airtel.com
                    Enter PIN to Agree and Pay 
                    n0.Back
                    00.Main Menu`);
        }),
        next: {
            '*\\d+': 'family.confirmation',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });
    //buyForFamily.selfSpouse.pay.yearly
    menu.state('family.confirmation', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            try {
                const userPin = Number(menu.val);
                console.log("USER PIN", userPin);
                const selected = args.text;
                console.log("SELECTED TEXT", selected);
                const input = selected.trim();
                const digits = input.split("*").map((digit) => parseInt(digit, 10));
                let paymentOption = Number(digits[digits.length - 2]);
                console.log("PAYMENT OPTION", paymentOption);
                const { user_id, phone_number, partner_id, membership_id, pin } = yield findUserByPhoneNumber(args.phoneNumber);
                if (userPin != pin && userPin != membership_id) {
                    menu.end('Invalid PIN');
                }
                const { policy_type, policy_id } = yield findPolicyByUser(user_id);
                if (policy_id == null) {
                    menu.end('Sorry, you have no policy to buy for family');
                }
                let sum_insured, premium = 0, installment_type = 0, period = 'monthly';
                if (policy_type == 'MINI') {
                    period = 'yearly';
                    installment_type = 1;
                    sum_insured = 1500000;
                    premium = 240000;
                    if (paymentOption == 1) {
                        period = 'monthly';
                        premium = 20000;
                        installment_type = 2;
                    }
                }
                else if (policy_type == 'MIDI') {
                    period = 'yearly';
                    installment_type = 1;
                    sum_insured = 3000000;
                    premium = 336000;
                    if (paymentOption == 1) {
                        period = 'monthly';
                        premium = 28000;
                        installment_type = 2;
                    }
                }
                else if (policy_type == 'BIGGIE') {
                    period = 'yearly';
                    installment_type = 1;
                    sum_insured = 5000000;
                    premium = 420000;
                    if (paymentOption == 1) {
                        period = 'monthly';
                        premium = 35000;
                        installment_type = 2;
                    }
                }
                yield Policy.update({
                    policy_deduction_amount: premium,
                    policy_pending_premium: premium,
                    sum_insured: sum_insured,
                    premium: premium,
                    installment_type: installment_type,
                    installment_order: 1,
                }, { where: { user_id: user_id } });
                let paymentStatus = yield (0, payment_1.airtelMoney)(user_id, partner_id, policy_id, phone_number, premium, membership_id, "UG", "UGX");
                //let paymentStatus =  await initiateConsent(newPolicy.policy_type,newPolicy.policy_start_date, newPolicy.policy_end_date, phone_number, newPolicy.policy_deduction_amount , newPolicy.premium)
                console.log("PAYMENT STATUS", paymentStatus);
                if (paymentStatus.code === 200) {
                    menu.end(`Congratulations! You are now covered. 
                        To stay covered, UGX ${premium} will be payable every ${period}`);
                }
                else {
                    menu.end(`Sorry, your payment was not successful. 
                        \n0. Back \n00. Main Menu`);
                }
            }
            catch (error) {
                console.error('Confirmation Error:', error);
                menu.end('An error occurred. Please try again later.');
            }
        })
    });
}
exports.buyForFamily = buyForFamily;
