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
const payment_1 = require("../../services/payment");
const uuid_1 = require("uuid");
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const getAirtelUser_1 = require("../../services/getAirtelUser");
function buyForSelf(menu, args, db) {
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
    menu.state("buyforself", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con("Buy for self " +
                "\n1. Mini – UGX 10,000" +
                "\n2. Midi - UGX 14,000" +
                "\n3. Biggie – UGX 18,000" +
                "\n0. Back" +
                "\n00. Main Menu");
        }),
        next: {
            "1": "buyforself.covertype",
            "2": "buyforself.covertype",
            "3": "buyforself.covertype",
            "0": "account",
            "00": "account",
        },
    });
    menu.state("buyforself.covertype", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let coverType = menu.val;
            const date = new Date();
            const day = date.getDate() - 1;
            let sum_insured, premium, yearly_premium;
            if (coverType === "1") {
                coverType = "MINI";
                sum_insured = "1.5M";
                premium = "10,000";
                yearly_premium = "120,000";
            }
            else if (coverType === "2") {
                coverType = "MIDI";
                sum_insured = "3M";
                premium = "14,000";
                yearly_premium = "167,000";
            }
            else if (coverType === "3") {
                coverType = "BIGGIE";
                sum_insured = "5M";
                premium = "18,000";
                yearly_premium = "208,000";
            }
            else {
                menu.end("Invalid option");
                return;
            }
            menu.session.set('coverType', coverType);
            menu.session.set('sum_insured', sum_insured);
            menu.session.set('premium', premium);
            menu.session.set('yearly_premium', yearly_premium);
            menu.con(`Inpatient cover for ${args.phoneNumber}, UGX ${sum_insured} a year 
            PAY
            1-UGX ${premium} monthly
            2-UGX ${yearly_premium} yearly
                      
            0. Back 00. Main Menu`);
        }),
        next: {
            "1": "buyForSelf.paymentOption",
            "2": "buyForSelf.paymentOption",
            "0": "buyForSelf",
            "00": "account",
        },
    });
    function calculatePaymentOptions(policyType, paymentOption) {
        let period, installmentType, sumInsured, premium;
        console.log("POLICY TYPE", policyType);
        if (policyType === "MINI") {
            period = "yearly";
            installmentType = 1;
            sumInsured = 1500000;
            premium = 120000;
            if (paymentOption === 1) {
                period = "monthly";
                premium = 10000;
                installmentType = 2;
            }
        }
        else if (policyType === "MIDI") {
            period = "yearly";
            installmentType = 1;
            sumInsured = 3000000;
            premium = 167000;
            if (paymentOption === 1) {
                period = "monthly";
                premium = 14000;
                installmentType = 2;
            }
        }
        else if (policyType === "BIGGIE") {
            period = "yearly";
            installmentType = 1;
            sumInsured = 5000000;
            premium = 208000;
            if (paymentOption === 1) {
                period = "monthly";
                premium = 18000;
                installmentType = 2;
            }
        }
        else {
            return {};
        }
        return { period, installmentType, sumInsured, premium };
    }
    menu.state("buyForSelf.paymentOption", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const paymentOption = parseInt(menu.val);
            let policy_type = yield menu.session.get('coverType');
            console.log("POLICY TYPE", policy_type);
            let options = calculatePaymentOptions(policy_type, paymentOption);
            console.log(options);
            if (options.premium) {
                menu.con(`Pay UGX ${options.premium} payable ${options.period}.
            Terms&Conditions - www.airtel.com
            Enter PIN to Agree and Pay 
            \n0 .Back
             00 .Main Menu`);
            }
            else {
                menu.end("Invalid option");
            }
        }),
        next: {
            "*\\d+": "buyForSelf.confirm",
            "0": "buyForSelf.paymentOption",
            "00": "account",
        },
    });
    menu.state("buyForSelf.confirm", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            try {
                const userPin = Number(menu.val);
                let paymentOption = menu.session.get('paymentOption');
                console.log("PAYMENT OPTION", paymentOption);
                let existingUser = yield (0, getAirtelUser_1.getAirtelUser)(args.phoneNumber, "UGA", "UGX", 2);
                console.log("EXISTING USER", existingUser);
                // create user
                if (existingUser) {
                    existingUser = yield User.create({
                        user_id: (0, uuid_1.v4)(),
                        phone_number: args.phoneNumber,
                        membership_id: Math.floor(100000 + Math.random() * 900000),
                        pin: Math.floor(1000 + Math.random() * 9000),
                        first_name: existingUser.first_name,
                        last_name: existingUser.last_name,
                        name: `${existingUser.first_name} ${existingUser.last_name}`,
                        total_member_number: "M",
                        partner_id: 2,
                        role: "user",
                    });
                    //   // WELCOME SMS
                    const message = `Dear ${existingUser.first_name}, welcome to Ddwaliro Care. Membership ID: ${existingUser.membership_id} and Ddwaliro PIN: ${existingUser.pin}. Dial *185*4*4# to access your account.`;
                    yield (0, sendSMS_1.default)(existingUser.phone_number, message);
                    console.log(" === USER ====", existingUser);
                }
                let policy_type = yield menu.session.get('coverType');
                console.log("POLICY TYPE", policy_type);
                let sum_insured, premium = 0, installment_type = 0, period = "monthly", last_expense_insured = 0, si, lei, frequency;
                if (policy_type == "MINI") {
                    period = "yearly";
                    installment_type = 1;
                    sum_insured = 1500000;
                    si = "1.5M";
                    premium = 120000;
                    last_expense_insured = 1000000;
                    lei = "1M";
                    if (paymentOption == 1) {
                        period = "monthly";
                        premium = 10000;
                        installment_type = 2;
                    }
                }
                else if (policy_type == "MIDI") {
                    period = "yearly";
                    installment_type = 1;
                    sum_insured = 3000000;
                    si = "3M";
                    premium = 167000;
                    last_expense_insured = 1500000;
                    lei = "1.5M";
                    if (paymentOption == 1) {
                        period = "monthly";
                        premium = 14000;
                        installment_type = 2;
                    }
                }
                else if (policy_type == "BIGGIE") {
                    period = "yearly";
                    installment_type = 1;
                    sum_insured = 5000000;
                    si = "5M";
                    premium = 208000;
                    last_expense_insured = 2000000;
                    lei = "2M";
                    if (paymentOption == 1) {
                        period = "monthly";
                        premium = 18000;
                        installment_type = 2;
                    }
                }
                if (paymentOption == 1) {
                    frequency = "month";
                }
                else {
                    frequency = "year";
                }
                const policy_end_date = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
                let day = policy_end_date.getDate() - 1;
                let policy = yield Policy.create({
                    user_id: existingUser.user_id,
                    first_name: existingUser.first_name,
                    last_name: existingUser.last_name,
                    phone_number: args.phoneNumber,
                    policy_id: (0, uuid_1.v4)(),
                    policy_type: policy_type,
                    policy_deduction_amount: premium,
                    policy_pending_premium: premium,
                    sum_insured: sum_insured,
                    premium: premium,
                    installment_type: installment_type,
                    installment_order: 1,
                    last_expense_insured: last_expense_insured,
                    policy_end_date: policy_end_date,
                    policy_start_date: new Date(),
                    membership_id: Math.floor(100000 + Math.random() * 900000),
                    beneficiary: "SELF",
                    policy_status: "pending",
                    policy_deduction_day: day * 1,
                    partner_id: 2,
                    country_code: "UGA",
                    currency_code: "UGX",
                    product_id: "d18424d6-5316-4e12-9826-302b866a380c",
                }, { where: { phone_number: args.phoneNumber } });
                let paymentStatus = yield (0, payment_1.airtelMoney)(existingUser.user_id, 2, policy.policy_id, args.phoneNumber, premium, existingUser.membership_id, "UG", "UGX");
                console.log("PAYMENT STATUS", paymentStatus);
                if (paymentStatus.code === 200) {
                    let congratText = `Congratulations! You bought Mini cover for Inpatient (UGX ${si}) and Funeral (UGX ${lei}) for a year. 
                        Pay UGX ${premium} every ${frequency} to stay covered`;
                    yield (0, sendSMS_1.default)(args.phoneNumber, congratText);
                    menu.end(`Congratulations! You are now covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                           Cover valid till ${policy_end_date.toDateString()}`);
                }
                else {
                    menu.end(`Sorry, your payment was not successful. 
                        \n0. Back \n00. Main Menu`);
                }
            }
            catch (error) {
                console.error("Confirmation Error:", error);
                menu.end("An error occurred. Please try again later.");
            }
        }),
    });
}
exports.buyForSelf = buyForSelf;
