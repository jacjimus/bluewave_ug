import moment from 'moment';
import { Op } from 'sequelize';
import SMSMessenger from './sendSMS';
import { db } from '../models/db';
import { getMemberNumberData, registerPrincipal } from './aarServices';
const cron = require('node-cron');
const { exec } = require('child_process');
import dotenv from 'dotenv';  
import { getAirtelUserKenya } from './getAirtelUserKyc';
dotenv.config();






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
        console.log(" =======  SEND POLICY RENEWAL REMINDER =========")
        const today = moment().format('DD'); //11
        const threeDaysBefore = moment().subtract(3, 'days').format('DD'); //8
        const threeDaysAfter = moment().add(3, 'days').format('DD');//14


        // dont send reminder for policies that are paid this month, check policy_paid_date


        const policies = await db.policies.findAll({
          where: {
              policy_status: 'paid',
              installment_type: 2,
              partner_id: 2,
              policy_paid_date: {
                  // Exclude policies paid within the current month
                  [Op.lt]: moment().startOf('month').toDate(),  // Use startOf('month') for clarity
              },
              // Optional: Include policies with start date after a specific threshold (if needed)
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
                const policyStartDate = moment(policy.policy_paid_date).format('DD');

                return policyStartDate === threeDaysBefore;
            });

            const todayPolicies = policies.filter((policy) => {
                const policyStartDate = moment(policy.policy_paid_date).format('DD');

                return policyStartDate === today;
            });

            const threeDaysAfterPolicies = policies.filter((policy) => {
                const policyStartDate = moment(policy.policy_paid_date).format('DD');

                return policyStartDate === threeDaysAfter;
            });

          //  let fullName = 'Customer'
    
            if (threeDaysBeforePolicies.length > 0) {
                threeDaysBeforePolicies.forEach((policy) => {
                    // if(policy.first_name && policy.last_name){
                    //     fullName = `${policy.first_name} ${policy.last_name}`
                    // }
                    const message =   `Dear Customer, your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE 3-days. Dial *185*7*6*3# to renew.`
                    SMSMessenger.sendSMS(2,policy.phone_number, message );
                });
            }

            if (todayPolicies.length > 0) {
                todayPolicies.forEach((policy) => {
                    // if(policy.first_name && policy.last_name){
                    //     fullName = `${policy.first_name} ${policy.last_name}`
                    // }
                    const message =`Dear Customer, your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE today. Dial *185*7*6*3# to renew.`
                    SMSMessenger.sendSMS(2,policy.phone_number, message );
                });
            }

            if (threeDaysAfterPolicies.length > 0) {
                threeDaysAfterPolicies.forEach((policy) => {
                    // if(policy.first_name && policy.last_name){
                    //     fullName = `${policy.first_name} ${policy.last_name}`
                    // }
                    const message =  `Dear Customer, your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE past 3-days. Dial *185*7*6*3# to renew.`
                    SMSMessenger.sendSMS(2,policy.phone_number, message );
                });
            }
        }
    } catch (error) {
        console.log(error);
    }
}




export const  getArrMemberNumberData = async () => {
    try {

        console.log(" =======  GET ARR MEMBER NUMBER DATA =========")
      const policies = await db.policies.findAll({
        // Policy type is 'S MINI'
        where: {
          policy_status: 'paid',
          //policy_type: { [db.Sequelize.Op.eq]: 'S MINI' },
          partner_id: 2,
          // policy_start_date: {
          //   [Op.between]: ['2023-10-01', '2024-03-31']
          // },
  
        },
        include: [{
          model: db.users,
          where: {
           arr_member_number: null,
            partner_id: 2
          }
        }]
  
      });

       // const memberStatus = await fetchMemberStatusData({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
        // await processPolicy(user, policy, memberStatus);
  
      for (let i = 0; i < policies.length; i++) {
        const policy = policies[i];
        const customer = policy.user
        console.log(customer.name, policy.phone_number);
     
        let result = await registerPrincipal(customer, policy);
        console.log(result);
        if (result.code == 608) {
          await getMemberNumberData(customer.phone_number);
        }
        // Introduce a delay of 1 second between each iteration
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
  
    } catch (error) {
      console.log(error);
    }
  }


// Define the command to ping the endpoint
const pingCommand = process.env.AIRTEL_PING_COMMAND || 'traceroute -m 10 41.223.58.252';

// Define the cron schedule (every 5 minutes)
const cronSchedule = '*/5 * * * *';

// Define the cron job
export const job = cron.schedule(cronSchedule, () => {
    // Execute the ping command
    exec(pingCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing ping command: ${error}`);
            return;
        }
        console.log(`Ping result: ${stdout}`);
    });
}, {
    scheduled: false // Start the job manually
});


export const updateAirtelUserKyc = async () => {
    try {
        console.log(" =======  UPDATE AIRTEL USER KYC =========")
        const users = await db.users.findAll({
            where: {
                partner_id: 1,
                first_name: null,
                last_name: null,

            }
        });
        if(users.length == 0){
          console.log("No users to update")
            return;
        }
        

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            console.log(user.phone_number);
              let getAirtelUserKyc = await getAirtelUserKenya(user.phone_number);

              console.log('getAirtelUserKyc',getAirtelUserKyc);

              if(getAirtelUserKyc && getAirtelUserKyc.first_name && getAirtelUserKyc.last_name){
               let updateUser=  await db.users.update({
                    first_name: getAirtelUserKyc.first_name,
                    last_name: getAirtelUserKyc.last_name,
                }, {
                    where: {
                        phone_number: user.phone_number,
                        partner_id: 1,

                    }
                });
                console.log(updateUser);
              }
            //await new Promise(resolve => setTimeout(resolve, 2000));
        }

    } catch (error) {
        console.log(error);

    }
}