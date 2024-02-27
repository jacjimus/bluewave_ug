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
exports.sendPolicyRenewalReminder = void 0;
const moment_1 = __importDefault(require("moment"));
const sendSMS_1 = __importDefault(require("./sendSMS"));
const db_1 = require("../models/db");
/*
function to send payment reminder to users on policy renewal date.
Workflow 1:
1. There sre two types of policies (coded in numbers (1,2))):
    a. monthly - 2
    b. yearly - 1
2. The cron job will run every 24 hours
3. The cron job will check for policies with renewal date of 3 days before the current date
NOTE: The renewal date is gotten by taking plicy start date and getting the date 3 days before the policy start date the next month. e.g. if policy start date is 5th of January, the renewal date will be 2nd of February. This is because the policy is monthly and the renewal date is 3 days before the policy start date the next month.
4. The cron job will send a reminder to the user on the policy renewal date


Workflow 2:
1. The cron job will run every 24 hours
2. The cron job will check for policies with renewal date of today
3. The cron job will send a reminder to the user on the policy renewal date


Workflow 3:
1. The cron job will run every 24 hours
2. The cron job will check for policies with renewal date of 3 days after the current date
3. The cron job will send a reminder to the user on the policy renewal date

*/
const sendPolicyRenewalReminder = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = (0, moment_1.default)().format('DD'); //11
        const threeDaysBefore = (0, moment_1.default)().subtract(3, 'days').format('DD'); //8
        const threeDaysAfter = (0, moment_1.default)().add(3, 'days').format('DD'); //14
        const policies = yield db_1.db.policies.findAll({
            where: {
                policy_status: 'paid',
                installment_type: 2,
                partner_id: 2,
                // policy_start_date: {
                //     [Op.gt]: moment().add(4, 'days').toDate()
                // }
            }
        });
        console.log(policies.length);
        console.log(threeDaysBefore);
        console.log(today);
        console.log(threeDaysAfter);
        if (policies.length > 0) {
            const threeDaysBeforePolicies = policies.filter((policy) => {
                const policyStartDate = (0, moment_1.default)(policy.policy_start_date).format('DD');
                return policyStartDate === threeDaysBefore;
            });
            const todayPolicies = policies.filter((policy) => {
                const policyStartDate = (0, moment_1.default)(policy.policy_start_date).format('DD');
                return policyStartDate === today;
            });
            const threeDaysAfterPolicies = policies.filter((policy) => {
                const policyStartDate = (0, moment_1.default)(policy.policy_start_date).format('DD');
                return policyStartDate === threeDaysAfter;
            });
            let fullName = 'Customer';
            if (threeDaysBeforePolicies.length > 0) {
                threeDaysBeforePolicies.forEach((policy) => {
                    if (policy.first_name && policy.last_name) {
                        fullName = `${policy.first_name} ${policy.last_name}`;
                    }
                    const message = `Dear ${fullName}, your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE 3-days. Dial *185*7*6*3# to renew.`;
                    sendSMS_1.default.sendSMS(2, policy.phone_number, message);
                });
            }
            if (todayPolicies.length > 0) {
                todayPolicies.forEach((policy) => {
                    if (policy.first_name && policy.last_name) {
                        fullName = `${policy.first_name} ${policy.last_name}`;
                    }
                    const message = `Dear ${fullName}, your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE today. Dial *185*7*6*3# to renew.`;
                    sendSMS_1.default.sendSMS(2, policy.phone_number, message);
                });
            }
            if (threeDaysAfterPolicies.length > 0) {
                threeDaysAfterPolicies.forEach((policy) => {
                    if (policy.first_name && policy.last_name) {
                        fullName = `${policy.first_name} ${policy.last_name}`;
                    }
                    const message = `Dear ${fullName}, your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE past 3-days. Dial *185*7*6*3# to renew.`;
                    sendSMS_1.default.sendSMS(2, policy.phone_number, message);
                });
            }
        }
    }
    catch (error) {
        console.log(error);
    }
});
exports.sendPolicyRenewalReminder = sendPolicyRenewalReminder;
