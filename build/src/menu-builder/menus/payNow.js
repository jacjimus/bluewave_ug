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
exports.payNowPremium = void 0;
const payment_1 = require("../../services/payment");
function payNowPremium(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    const findUserByPhoneNumber = (phoneNumber) => __awaiter(this, void 0, void 0, function* () {
        return yield User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    });
    const findPendingPolicyByUser = (user) => __awaiter(this, void 0, void 0, function* () {
        return yield Policy.findOne({
            where: {
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                policy_status: 'pending',
            },
        });
    });
    menu.state('payNow', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            console.log("* PAY NOW", args.phoneNumber);
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            if (!user) {
                menu.end('User not found');
                return;
            }
            const policy = yield findPendingPolicyByUser(user);
            if (!policy) {
                menu.end('You have no pending policies');
                return;
            }
            const outstandingPremiumMessage = `Your outstanding premium is UGX ${policy.policy_pending_premium}`;
            const enterPinMessage = 'Enter PIN to Pay Now\n0. Back\n00. Main Menu';
            menu.con(`${outstandingPremiumMessage}\n${enterPinMessage}`);
        }),
        next: {
            '*\\d+': 'payNowPremiumPin',
            '0': 'account',
            '00': 'insurance',
        },
    });
    menu.state('payNowPremiumPin', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const pin = parseInt(menu.val);
            if (isNaN(pin)) {
                menu.end('Invalid PIN');
                return;
            }
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            const selectedPolicy = yield findPendingPolicyByUser(user);
            if (!selectedPolicy) {
                menu.end('You have no pending policies');
                return;
            }
            const { user_id, phone_number, partner_id, policy_id, policy_deduction_amount, membership_id } = user;
            let paymentStatus = yield (0, payment_1.airtelMoney)(user_id, partner_id, selectedPolicy.policy_id, phone_number, selectedPolicy.premium, membership_id, "UG", "UGX");
            if (paymentStatus.code === 200) {
                const message = `Paid UGX ${selectedPolicy.policy_deduction_amount} for ${selectedPolicy.policy_type.toUpperCase()} cover. Your next payment will be due on ${selectedPolicy.policy_end_date.toDateString()}`;
                menu.end(message);
            }
            else {
                menu.end('Payment failed. Please try again');
            }
        }),
    });
    menu.state('renewPolicy', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const bronzeLastExpenseBenefit = "UGX 1,000,000";
            const silverLastExpenseBenefit = "UGX 1,500,000";
            const goldLastExpenseBenefit = "UGX 2,000,000";
            try {
                const user = yield findUserByPhoneNumber(args.phoneNumber);
                if (!user) {
                    throw new Error('User not found');
                }
                const policies = yield Policy.findAll({
                    where: {
                        user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    },
                });
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
                    switch (policy.policy_type) {
                        case 'bronze':
                            benefit = bronzeLastExpenseBenefit;
                            break;
                        case 'silver':
                            benefit = silverLastExpenseBenefit;
                            break;
                        case 'gold':
                            benefit = goldLastExpenseBenefit;
                            break;
                        default:
                            break;
                    }
                    policyInfo += `${i + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n`;
                    // `   Inpatient limit: UGX ${policy.sum_insured}\n` +
                    // `   Remaining: UGX ${policy.sum_insured}\n` +
                    // `   Last Expense Per Person Benefit: ${benefit}\n\n`;
                }
                menu.con(`Choose policy to pay for
          ${policyInfo}
          00.Main Menu`);
            }
            catch (error) {
                console.error('Error:', error);
                menu.end('An error occurred while fetching policies');
            }
        }),
        next: {
            '*\\d+': 'choosePolicy',
            '0': 'account',
            '00': 'insurance',
        },
    });
    menu.state('choosePolicy', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const policyIndex = Number(menu.val) - 1;
            try {
                const user = yield User.findOne({
                    where: {
                        phone_number: args.phoneNumber,
                    },
                });
                const policies = yield Policy.findAll({
                    where: {
                        user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    },
                });
                const selectedPolicy = policies[policyIndex];
                if (!selectedPolicy) {
                    throw new Error('Invalid policy selection');
                }
                if (selectedPolicy.policy_status === 'paid') {
                    console.log('Policy already paid for');
                    console.log('Policy', selectedPolicy, selectedPolicy.policy_paid_amount, selectedPolicy.premium, selectedPolicy.policy_paid_amount == selectedPolicy.premium);
                    if (selectedPolicy.policy_paid_amount == selectedPolicy.sum_insured) {
                        menu.end(`Your ${selectedPolicy.policy_type.toUpperCase()} cover is already paid for`);
                    }
                }
                selectedPolicy.policy_pending_premium = selectedPolicy.premium - selectedPolicy.policy_paid_amount;
                const updatedPolicy = yield selectedPolicy.save();
                if (!updatedPolicy) {
                    menu.end('Failed to update policy');
                }
                const userId = user === null || user === void 0 ? void 0 : user.user_id;
                const phoneNumber = user.phone_number;
                const partner_id = user.partner_id;
                const policy_id = selectedPolicy.policy_id;
                const amount = selectedPolicy.policy_deduction_amount;
                const reference = user.membership_id;
                const payment = yield (0, payment_1.airtelMoney)(userId, partner_id, policy_id, phoneNumber, amount, reference, "UG", "UGX");
                if (payment.code === 200) {
                    const message = `Your request for ${selectedPolicy.policy_type.toUpperCase()} ${selectedPolicy.beneficiary.toUpperCase()}, UGX ${selectedPolicy.premium} has been received and will be processed shortly. Please enter your Airtel Money PIN when asked.`;
                    menu.end(message);
                }
                else {
                    menu.end('Payment failed. Please try again');
                }
            }
            catch (error) {
                console.error('Error:', error);
                menu.end('An error occurred while processing the payment');
            }
        }),
    });
}
exports.payNowPremium = payNowPremium;
