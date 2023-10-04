import sendSMS from "../../services/sendSMS";
import { generateClaimId } from "../../services/utils";

export function makeClaim(menu: any, args: any, db: any): void {

    const User = db.users;
    const Policy = db.policies;
    const Claim = db.claims;

    if (args.phoneNumber.charAt(0) == "+") {

        args.phoneNumber = args.phoneNumber.substring(1);
    }

    //==================MAKE CLAIM===================
    menu.state('makeClaim', {
        run: async () => {

            menu.con('Make Claim ' +
                '\n1. Inpatient Claim' +
                '\n2. Death Claim' +
                '\n0. Back' +
                '\n00. Main Menu'
            );
        }
        ,
        next: {
            '1': 'inpatientClaim',
            '2': 'inpatientClaim',
            '0': 'account',
            '00': 'insurance'
        }
    })
    //==================INPATIENT CLAIM===================

    menu.state('inpatientClaim', {
        run: async () => {
            let claim_type = menu.val;

            let user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            })
            console.log("USER", user);
            const { policy_id, policy_type, beneficiary, sum_insured, last_expense_insured } = await Policy.findOne({
                where: {
                    user_id: user?.user_id,
                    policy_status: 'paid'
                }
            });
           
            const claimId = generateClaimId();
            console.log(claimId);
            let claim_amount: any;
            if (claim_type == 1) {
                claim_type = 'Inpatient Claim'
                claim_amount = sum_insured;
            }
            else {
                claim_type = 'Death Claim'
                claim_amount = last_expense_insured
            }

        let userClaim = await Claim.findOne({
            where: {
                user_id: user?.user_id,
                claim_type: claim_type,
                claim_status: 'paid'
            }
        })

        if(userClaim){
            menu.end(`Discharge Claim already made for this policy`);
            return;
        }

            
            const newClaim = await Claim.create({
                claim_number: claimId,
                policy_id: policy_id,
                user_id: user?.user_id,
                claim_date: new Date(),
                claim_status: 'pending',
                partner_id: user.partner_id,
                claim_description: `${claim_type} ID: ${claimId} for Member ID: ${user.membership_id}  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} policy`,
                claim_type: claim_type,
                claim_amount: claim_amount

            });
            console.log("CLAIM", newClaim);

            menu.end(`Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service`)

        }
        ,
        next: {
            '0': 'account',
            '00': 'insurance'
        }
    })


    //   menu.state('makeClaim', {
    //     run: async () => {
    //       const bronzeLastExpenseBenefit = "UGX 1,000,000";
    //       const silverLastExpenseBenefit = "UGX 1,500,000";
    //       const goldLastExpenseBenefit = "UGX 2,000,000";
    //       let user = await User.findOne({
    //         where: {
    //           phone_number: args.phoneNumber
    //         }
    //       })

    //       let policies = await Policy.findAll({
    //         where: {
    //           user_id: user?.user_id,
    //           policy_status: 'paid'
    //         },
    //       });

    //       console.log("POLICIES: ", policies);

    //       if (policies.length === 0) {
    //         menu.con(
    //           'You have no policies\n' +
    //           '1. Buy cover\n' +
    //           '0. Back\n' +
    //           '00. Main Menu'
    //         );
    //         return;
    //       }

    //       let policyInfo = '';

    //       for (let i = 0; i < policies.length; i++) {
    //         let policy = policies[i];
    //         let benefit: any;

    //         if (policy.policy_type == 'MINI') {
    //           benefit = bronzeLastExpenseBenefit;
    //         } else if (policy.policy_type == 'MIDI') {
    //           benefit = silverLastExpenseBenefit;
    //         } else if (policy.policy_type == 'BIGGIE') {
    //           benefit = goldLastExpenseBenefit;
    //         }

    //         policyInfo += `${i + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
    //           `   Inpatient limit: UGX ${policy.sum_insured}\n` +
    //           `   Remaining: UGX ${policy.sum_insured}\n` +
    //           `   Last Expense Per Person Benefit: ${benefit}\n\n`;
    //       }

    //       // menu.end(`My Insurance Policies:\n\n${policyInfo}`);
    //       menu.con(`Please, Choose policy to make a claim for
    //         ${policyInfo}

    //         00.Main Menu`
    //       );
    //     },
    //     next: {
    //       '*\\d+': 'choosePolicyToMakeClaim',
    //       '0': 'account',
    //       '00': 'insurance',
    //     }

    //   })
    //   menu.state('choosePolicyToMakeClaim', {
    //     run: async () => {
    //       const policyIndex = Number(menu.val) - 1; // Adjust the policy index
    //       const phoneNumber = args.phoneNumber;

    //       try {
    //         const user = await User.findOne({
    //           where: {
    //             phone_number: phoneNumber,
    //           },
    //         });

    //         if (!user) {
    //           throw new Error('Sorry. recgiister first');
    //         }

    //         const policies = await Policy.findAll({
    //           where: {
    //             policy_status: 'paid',
    //             user_id: user.user_id,
    //           },
    //         });

    //         if (!policies || policies.length === 0) {
    //           throw new Error('Sorry, No paid policies found, please buy a policy first or contact customer care');
    //         }

    //         const selectedPolicy = policies[policyIndex];

    //         if (!selectedPolicy) {
    //           throw new Error('Sorry, Invalid policy selection');
    //         }

    //         const {
    //           policy_id,
    //           premium,
    //           policy_type,
    //           beneficiary,
    //           sum_insured,
    //         } = selectedPolicy;

    //         // check if claim has been made for this policy
    //         const existingClaim = await Claim.findOne({
    //           where: {
    //             policy_id: policy_id,
    //           },
    //         });


    //         if (existingClaim) {
    //           menu.end('Claim already made for this policy');
    //         }



    //         // Example usage:
    //         const claimId = generateClaimId();
    //         console.log(claimId);

    //         const claim = await Claim.create({
    //           claim_number: claimId,
    //           policy_id: policy_id,
    //           user_id: user?.user_id,
    //           claim_date: new Date(),
    //           claim_status: 'pending',
    //           partner_id: user.partner_id,
    //           claim_description: `Admission of Claim: ${claimId} for Member ID: ${user.membership_id}  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} policy`,
    //           claim_type: 'Dwalingo medical cover claim',
    //           claim_amount: sum_insured,

    //         });

    //         if (claim) {
    //           const goldAndSilverMessage = `Your medical details have been confirmed. You are covered for Inpatient benefit of UGX 10,000,000`;
    //           const bronzeMessage = `Your medical details have been confirmed. You are covered for Inpatient cash of UGX 4,500 per night payable from the second night`;

    //           const message = policy_type.toLowerCase() === 'MINI' ? bronzeMessage : goldAndSilverMessage;

    //           await sendSMS(phoneNumber, message);

    //           menu.end(`Admission Claim - CLAIM ID: ${claim.claim_number},  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} - Premium: UGX ${premium}, SUM INSURED: UGX ${sum_insured} \nProceed to the reception to verify your details\n0. Back\n00. Main Menu"`);
    //         } else {
    //           menu.end('Claim failed. Please try again');
    //         }
    //       } catch (error) {
    //         console.error('Error:', error);
    //         menu.end('An error occurred while processing the claim');
    //       }
    //     },
    //   });


}