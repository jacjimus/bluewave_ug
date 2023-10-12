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
exports.buyForSelf = void 0;
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const payment_1 = require("../../services/payment");
const uuid_1 = require("uuid");
const getAirtelUser_1 = __importDefault(require("../../services/getAirtelUser"));
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
    menu.state('buyForSelf', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            console.log("* BUY FOR SELF", args.phoneNumber);
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            const policy = yield findPaidPolicyByUser(user);
            // if (policy) {
            //     menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
            //     return;
            // }
            menu.con('Buy for self ' +
                '\n1. Mini – UGX 10,000' +
                '\n2. Midi - UGX 14,000' +
                '\n3. Biggie – UGX 18,000' +
                '\n0.Back' +
                '\n00.Main Menu');
        }),
        next: {
            '*\\d+': 'buyForSelf.coverType',
            '0': ""
        }
    });
    menu.state('buyForSelf.coverType', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let coverType = menu.val;
            const { user_id, phone_number, first_name, last_name, partner_id } = yield findUserByPhoneNumber(args.phoneNumber);
            const date = new Date();
            const day = date.getDate() - 1;
            let sum_insured, premium, yearly_premium;
            if (coverType == 1) {
                coverType = 'MINI';
                sum_insured = "1.5M";
                premium = "10,000";
                yearly_premium = "120,000";
            }
            else if (coverType == 2) {
                coverType = 'MIDI';
                sum_insured = "3M";
                premium = "14,000";
                yearly_premium = "167,000";
            }
            else if (coverType == 3) {
                coverType = 'BIGGIE';
                sum_insured = "5M";
                premium = "18,000";
                yearly_premium = "208,000";
            }
            yield Policy.create({
                user_id: user_id,
                policy_id: (0, uuid_1.v4)(),
                policy_type: coverType,
                beneficiary: 'SELF',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                partner_id: partner_id,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            });
            menu.con(`Inpatient cover for ${phone_number},${first_name.toUpperCase()} ${last_name.toUpperCase()} UGX ${sum_insured} a year 
                    PAY
                    1-UGX ${premium} monthly
                    2-UGX ${yearly_premium} yearly
                    
                    0. Back 00. Main Menu`);
        }),
        next: {
            '*\\d+': 'buyForSelf.paymentOption',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.paymentOption', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const paymentOption = menu.val;
            const { user_id } = yield findUserByPhoneNumber(args.phoneNumber);
            const { policy_type } = yield findPolicyByUser(user_id);
            let sum_insured, premium = 0, period, installment_type;
            if (policy_type == 'MINI') {
                period = 'yearly';
                installment_type = 1;
                sum_insured = 1500000;
                premium = 120000;
                if (paymentOption == 1) {
                    period = 'monthly';
                    premium = 10000;
                    installment_type = 2;
                }
            }
            else if (policy_type == 'MIDI') {
                period = 'yearly';
                installment_type = 1;
                sum_insured = 3000000;
                premium = 167000;
                if (paymentOption == 1) {
                    period = 'monthly';
                    premium = 14000;
                    installment_type = 2;
                }
            }
            else if (policy_type == 'BIGGIE') {
                period = 'yearly';
                installment_type = 1;
                sum_insured = 5000000;
                premium = 208000;
                if (paymentOption == 1) {
                    period = 'monthly';
                    premium = 18000;
                    installment_type = 2;
                }
            }
            menu.con(`Pay UGX ${premium} payable ${period}.
            Terms&Conditions - www.airtel.com
            Enter PIN to Agree and Pay 
            \n0 .Back
             00 .Main Menu`);
        }),
        next: {
            '*\\d+': 'buyForSelf.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.confirm', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            try {
                const userKyc = yield (0, getAirtelUser_1.default)(args.phoneNumber, "UG", "UGX", 2);
                const userPin = Number(menu.val);
                const selected = args.text;
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
                    menu.end('Sorry, you have no policy to buy for self');
                }
                let sum_insured, premium = 0, installment_type = 0, period = 'monthly', last_expense_insured = 0, si, lei, frequency;
                if (policy_type == 'MINI') {
                    period = 'yearly';
                    installment_type = 1;
                    sum_insured = 1500000;
                    si = '1.5M';
                    premium = 120000;
                    last_expense_insured = 1000000;
                    lei = '1M';
                    if (paymentOption == 1) {
                        period = 'monthly';
                        premium = 10000;
                        installment_type = 2;
                    }
                }
                else if (policy_type == 'MIDI') {
                    period = 'yearly';
                    installment_type = 1;
                    sum_insured = 3000000;
                    si = '3M';
                    premium = 167000;
                    last_expense_insured = 1500000;
                    lei = '1.5M';
                    if (paymentOption == 1) {
                        period = 'monthly';
                        premium = 14000;
                        installment_type = 2;
                    }
                }
                else if (policy_type == 'BIGGIE') {
                    period = 'yearly';
                    installment_type = 1;
                    sum_insured = 5000000;
                    si = '5M';
                    premium = 208000;
                    last_expense_insured = 2000000;
                    lei = '2M';
                    if (paymentOption == 1) {
                        period = 'monthly';
                        premium = 18000;
                        installment_type = 2;
                    }
                }
                if (paymentOption == 1) {
                    frequency = 'month';
                }
                else {
                    frequency = 'year';
                }
                const policy_end_date = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
                yield Policy.update({
                    policy_deduction_amount: premium,
                    policy_pending_premium: premium,
                    sum_insured: sum_insured,
                    premium: premium,
                    installment_type: installment_type,
                    installment_order: 1,
                    last_expense_insured: last_expense_insured,
                    policy_end_date: policy_end_date,
                    policy_start_date: new Date(),
                }, { where: { user_id: user_id } });
                let paymentStatus = yield (0, payment_1.airtelMoney)(user_id, partner_id, policy_id, phone_number, premium, membership_id, "UG", "UGX");
                console.log("PAYMENT STATUS", paymentStatus);
                if (paymentStatus.code === 200) {
                    let congratText = `Congratulations! You bought Mini cover for Inpatient (UGX ${si}) and Funeral (UGX ${lei}) for a year. 
                        Pay UGX ${premium} every ${frequency} to stay covered`;
                    yield (0, sendSMS_1.default)(phone_number, congratText);
                    menu.end(`Congratulations! You are now covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                           Cover valid till ${policy_end_date.toDateString()}`);
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
exports.buyForSelf = buyForSelf;
