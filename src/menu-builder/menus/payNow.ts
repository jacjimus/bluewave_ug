
import airtelMoney from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
export function payNow(menu:any, args:any, db:any):void{

    const User = db.users;
    const Policy = db.policies;
        //==================PAY NOW===================

        menu.state('payNow', {
            run: async () => {
                const bronzeLastExpenseBenefit = "UGX 1,000,000";
                const silverLastExpenseBenefit = "UGX 1,500,000";
                const goldLastExpenseBenefit = "UGX 2,000,000";
               let user = await User.findOne({
                    where: {
                        phone_number: args.phoneNumber
                    }
                })

                const {premium} = await Policy.findOne({
                    where: {
                        user_id: user.id
                    }
                })
                let policies = await Policy.findAll({
                  where: {
                    user_id: user.id,
                  },
                });
            
                console.log("POLICIES: ", policies);
            
                if (policies.length === 0) {
                  menu.con(
                    'You have no policies\n' +
                    '1. Buy cover\n' +
                    '0. Back\n' +
                    '00. Main Menu'
                  );
                  return;
                }
            
                let policyInfo = '';
            
                for (let i = 0; i < policies.length; i++) {
                  let policy = policies[i];
                  let benefit;
            
                  if (policy.policy_type == 'bronze') {
                    benefit = bronzeLastExpenseBenefit;
                  } else if (policy.policy_type == 'silver') {
                    benefit = silverLastExpenseBenefit;
                  } else if (policy.policy_type == 'gold') {
                    benefit = goldLastExpenseBenefit;
                  }
            
                  policyInfo += `${i + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
                    `   Inpatient limit: UGX ${policy.sum_insured}\n` +
                    `   Remaining: UGX ${policy.sum_insured}\n` +
                    `   Last Expense Per Person Benefit: ${benefit}\n\n`;
                }
            
               // menu.end(`My Insurance Policies:\n\n${policyInfo}`);
                menu.con(`Choose policy to pay for
                ${policyInfo}
               
                00.Main Menu`
                );
            },
        
    next: {
        '*\\d+': 'choosePolicy',
        '0': 'account',
        '00': 'insurance',
    }

})


menu.state('choosePolicy', {
    run: async () => {
        let policy = Number(menu.val);

        let user = await User.findOne({
          where: {
              phone_number: args.phoneNumber
          }
      })
        let policies = await Policy.findAll({
          where: {
            user_id: user.id,
          },
        });

        policies= policies[policy - 1];
        console.log("POLICIES: ", policies);

        let { premium , policy_type, beneficiary} = policies;

        let userId = user.id
        let phoneNumber = user.phone_number
        let partner_id = user.partner_id
        let policy_id = policies.id
        let amount = policies.policy_deduction_amount
        const uuid = uuidv4();
        let reference = policies.policy_type+policy_id+userId+uuid

        let payment: any = await airtelMoney(userId,partner_id,policy_id, phoneNumber, amount, reference, uuid)


        payment = 200;

        if (payment == 200) {
          //Paid Kes 5,000 for Medical cover. Your next payment will be due on day # of [NEXT MONTH]
      //     menu.end(`Paid Kes ${amount} for Medical cover. 
      // Your next payment will be due on day ${policy_deduction_day} of ${nextMonth}`)

      menu.end(`Your request for ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()}, UGX ${premium} has been received and will be processed shortly.Please enter your Airtel Money PIN when asked.`)
      } else {
          menu.end('Payment failed. Please try again')
      }
    }

})


}