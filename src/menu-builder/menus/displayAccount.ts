import sendSMS from "../../services/sendSMS";
import { generateClaimId } from "../../services/utils";

export function displayAccount(menu: any, args: any, db: any): void {

  const User = db.users;
  const Policy = db.policies;
  const Claim = db.claims;
  menu.state('account', {
    run: async () => {
      const user = await db.users.findOne({
        where: {
          phone_number: args.phoneNumber,
          gender: {
            [db.Sequelize.Op.ne]: null,
          },
        },
      });

      console.log(" ============== USER ================ ", user);
      if (user) {
        menu.con('Medical cover ' +
          '\n1. Buy for self' +
          '\n2. Buy (family)' +
          '\n3. Buy (others)' +
          '\n4. Admission Claim' +
          '\n5. My Account' +
          '\n6. Choose Hopital' +
          '\n7. Terms & Conditions' +
          '\n8. FAQs' +
          '\n00.Main Menu'
        )

      } else {
        menu.con('Medical cover ' +
          '\n0. Update profile(KYC)')

      }
    },
    next: {
      '1': 'buyForSelf',
      '2': 'buyForFamily',
      '3': 'buyForOthers',
      '4': 'makeClaim',
      '5': 'myAccount',
      '6': 'chooseHospital',
      '7': 'termsAndConditions',
      '8': 'faqs',
      '0': 'updateProfile',
      '00': 'insurance',
    }
  });

 

  //==================MAKE CLAIM===================
  menu.state('makeClaim', {
    run: async () => {
      const bronzeLastExpenseBenefit = "UGX 1,000,000";
      const silverLastExpenseBenefit = "UGX 1,500,000";
      const goldLastExpenseBenefit = "UGX 2,000,000";
      let user = await User.findOne({
        where: {
          phone_number: args.phoneNumber
        }
      })

      let policies = await Policy.findAll({
        where: {
          user_id: user?.user_id,
          policy_status: 'paid'
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
        let benefit: any;

        if (policy.policy_type == 'MINI') {
          benefit = bronzeLastExpenseBenefit;
        } else if (policy.policy_type == 'MIDI') {
          benefit = silverLastExpenseBenefit;
        } else if (policy.policy_type == 'BIGGIE') {
          benefit = goldLastExpenseBenefit;
        }

        policyInfo += `${i + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
          `   Inpatient limit: UGX ${policy.sum_insured}\n` +
          `   Remaining: UGX ${policy.sum_insured}\n` +
          `   Last Expense Per Person Benefit: ${benefit}\n\n`;
      }

      // menu.end(`My Insurance Policies:\n\n${policyInfo}`);
      menu.con(`Please, Choose policy to make a claim for
        ${policyInfo}
       
        00.Main Menu`
      );
    },
    next: {
      '*\\d+': 'choosePolicyToMakeClaim',
      '0': 'account',
      '00': 'insurance',
    }

  })
  menu.state('choosePolicyToMakeClaim', {
    run: async () => {
      const policyIndex = Number(menu.val) - 1; // Adjust the policy index
      const phoneNumber = args.phoneNumber;

      try {
        const user = await User.findOne({
          where: {
            phone_number: phoneNumber,
          },
        });

        if (!user) {
          throw new Error('Sorry. recgiister first');
        }

        const policies = await Policy.findAll({
          where: {
            policy_status: 'paid',
            user_id: user.user_id,
          },
        });

        if (!policies || policies.length === 0) {
          throw new Error('Sorry, No paid policies found, please buy a policy first or contact customer care');
        }

        const selectedPolicy = policies[policyIndex];

        if (!selectedPolicy) {
          throw new Error('Sorry, Invalid policy selection');
        }

        const {
          policy_id,
          premium,
          policy_type,
          beneficiary,
          sum_insured,
        } = selectedPolicy;

        // check if claim has been made for this policy
        const existingClaim = await Claim.findOne({
          where: {
            policy_id: policy_id,
          },
        });


        if (existingClaim) {
          menu.end('Claim already made for this policy');
        }



        // Example usage:
        const claimId = generateClaimId();
        console.log(claimId);

        const claim = await Claim.create({
          claim_number: claimId,
          policy_id: policy_id,
          user_id: user?.user_id,
          claim_date: new Date(),
          claim_status: 'pending',
          partner_id: user.partner_id,
          claim_description: `Admission of Claim: ${claimId} for Member ID: ${user.membership_id}  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} policy`,
          claim_type: 'Dwalingo medical cover claim',
          claim_amount: sum_insured,

        });

        if (claim) {
          const goldAndSilverMessage = `Your medical details have been confirmed. You are covered for Inpatient benefit of UGX 10,000,000`;
          const bronzeMessage = `Your medical details have been confirmed. You are covered for Inpatient cash of UGX 4,500 per night payable from the second night`;

          const message = policy_type.toLowerCase() === 'MINI' ? bronzeMessage : goldAndSilverMessage;

          await sendSMS(phoneNumber, message);

          menu.end(`Admission Claim - CLAIM ID: ${claim.claim_number},  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} - Premium: UGX ${premium}, SUM INSURED: UGX ${sum_insured} \nProceed to the reception to verify your details\n0. Back\n00. Main Menu"`);
        } else {
          menu.end('Claim failed. Please try again');
        }
      } catch (error) {
        console.error('Error:', error);
        menu.end('An error occurred while processing the claim');
      }
    },
  });






}