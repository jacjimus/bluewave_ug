import moment from 'moment';
import { Op } from 'sequelize';
import SMSMessenger from './sendSMS';
import { db } from '../models/db';


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

export const sendPolicyRenewalReminder = async () => {
    try {
        const today = moment().format('DD'); //11
        const threeDaysBefore = moment().subtract(3, 'days').format('DD'); //8
        const threeDaysAfter = moment().add(3, 'days').format('DD');//14


        const policies = await db.policies.findAll({
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
                const policyStartDate = moment(policy.policy_start_date).format('DD');

                return policyStartDate === threeDaysBefore;
            });

            const todayPolicies = policies.filter((policy) => {
                const policyStartDate = moment(policy.policy_start_date).format('DD');

                return policyStartDate === today;
            });

            const threeDaysAfterPolicies = policies.filter((policy) => {
                const policyStartDate = moment(policy.policy_start_date).format('DD');

                return policyStartDate === threeDaysAfter;
            });

            if (threeDaysBeforePolicies.length > 0) {
                threeDaysBeforePolicies.forEach((policy) => {
                    const message = `Your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE in 3-days`
                    console.log(message);
                    SMSMessenger.sendSMS(policy.phone_number, message );
                });
            }

            if (todayPolicies.length > 0) {
                todayPolicies.forEach((policy) => {
                    const message = `Your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE today`
                    console.log(message);

                    SMSMessenger.sendSMS(policy.phone_number, message );
                });
            }

            if (threeDaysAfterPolicies.length > 0) {
                threeDaysAfterPolicies.forEach((policy) => {
                    const message = `Your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE past 3-days`
                    console.log(message);

                    SMSMessenger.sendSMS(policy.phone_number, message );
                });
            }
        }
    } catch (error) {
        console.log(error);
    }
}




