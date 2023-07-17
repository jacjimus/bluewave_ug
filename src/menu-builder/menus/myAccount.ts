
import sendSMS from "../../services/sendSMS";

export function myAccount(menu: any, args: any, db: any) {
    const User = db.users;
    const Policy = db.policies;
    menu.state('myAccount', {
        run: async () => {

            menu.con('My Account ' +

                '\n1. Pay Now' +
                '\n2. Manage auto-renew' +
                '\n3. My insurance policy' +
                '\n4. Cancel policy' +
                '\n5. My Hospital' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        },
        next: {
            '1': 'payNow',
            '2': 'manageAutoRenew',
            '3': 'myInsurancePolicy',
            '4': 'cancelPolicy',
            '5': 'myHospitalOption',
            '0': 'account',
            '00': 'insurance',
        }
    })
    //============CANCEL POLICY=================

    menu.state('cancelPolicy', {
        run: async () => {

            const user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            if (user) {
                const policy = await Policy.findOne({
                    where: {
                        user_id: user.id,
                    },
                });

                console.log("POLICY: ", policy)
                if (policy) {
                    // 1. Cancel Policy
                    menu.con('Hospital cover of Kes 1M a year(100k per night, max 10 nights)' +
                        'Life cover of Kes 4M Funeral Benefit' +
                        '\n1. Cancel Policy');
                } else {
                    menu.con("Your policy is INACTIVE\n0 Buy cover");
                }
            } else {
                menu.end("User not found");
            }

        },
        next: {
            '0': 'account',
            '1': 'cancelPolicyPin',
        }

    })

    //cancel policy pin

    menu.state('cancelPolicyPin', {

        run: async () => {
            const user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            const policy = await Policy.findOne({
                where: {
                    user_id: user.id,
                },
            });
            let today = new Date();

            console.log("POLICY: ", policy)
            menu.con(`By cancelling, you will no longer be covered for ${(policy.policy_type).toUpperCase()} Insurance as of ${today}.
                Enter PIN to  Confirm cancellation
                0.Back
                00.Main Menu` )
        },
        next: {
            '*[0-9]': 'cancelPolicyConfirm',
        }
    })





    //cancel policy confirm

    menu.state('cancelPolicyConfirm', {
        run: async () => {
            const to = '254' + args.phoneNumber.substring(1);
            const message = ' You CANCELLED your Medical cover cover. Your Policy will expire on DD/MM/YYYY and you will not be covered. Dial *187*7*1# to reactivate.';


            const sms = await sendSMS(to, message);
            let today = new Date();

            //update policy status to cancelled
            const user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            let policy: any;
            if (user) {
                policy = await Policy.findOne({
                    where: {
                        user_id: user.id,
                    },
                });
            }

            console.log("POLICY: ", policy)
            if (policy) {
                // 1. Cancel Policy
                policy.policy_status = 'cancelled';
                policy.policy_end_date = today;
                await policy.save();
            }



            menu.con(`Your policy will expire on ${today}  and will not be renewed. Dial *187*7# to reactivate.
                0.Back     00.Main Menu`
            )
        },
        next: {

            '0': 'myAccount',
            '00': 'insurance',

        }
    })



    //my insurance policy
    menu.state('myInsurancePolicy', {
        run: async () => {
          const bronzeLastExpenseBenefit = "UGX 1,000,000";
          const silverLastExpenseBenefit = "UGX 1,500,000";
          const goldLastExpenseBenefit = "UGX 2,000,000";
      
          const user = await User.findOne({
            where: {
              phone_number: args.phoneNumber,
            },
          });
      
          console.log("USER: ", user);
      
          if (!user) {
            menu.con('User not found');
            return;
          }
      
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
      
          menu.end(`My Insurance Policies:\n\n${policyInfo}`);
        },
        next: {
          '1': 'account',
          '0': 'account',
          '00': 'insurance',
        }
      });
      

    menu.state('manageAutoRenew', {
        run: async () => {
            menu.con('Manage auto-renew ' +
                '\n1. Activate auto-renew' +
                '\n2. Deactivate auto-renew' +
                '\n0.Back' +
                '\n00.Main Menu'
            )
        }
    })

}