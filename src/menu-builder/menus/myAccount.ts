import sendSMS from "../../services/sendSMS";

export function myAccount(menu: any, args: any, db: any) {
  const User = db.users;
  const Policy = db.policies;
  const Beneficiary = db.beneficiaries;
  menu.state("myAccount", {
    run: async () => {
      menu.con(
        "My Account " +
          "\n1. Pay Now" +
          "\n2. My insurance policy" +
          "\n3. Renew Policy" +
          "\n4. Update My Profile" +
           '\n5. Cancel policy' +
          "\n6. Add Beneficiary" +
          "\n7. My Hospital" +
          "\n0.Back" +
          "\n00.Main Menu"
      );
    },
    next: {
      "1": "payNow",
      "2": "myInsurancePolicy",
      "3": "renewPolicy",
      "4": "updateProfile",
       '5': 'cancelPolicy',
      "6": "listBeneficiaries",
      "7": "myHospitalOption",
      "0": "account",
      "00": "insurance",
    },
  });

  //update profile ( user dob and gender)
  menu.state("updateProfile", {
    run: async () => {
      menu.con(`Whats your gender
            1.  Male
            2. Female
            0. Back
            00. Main Menu
             `);
    },
    next: {
      "1": "updateGender",
      "2": "updateGender",
      "0": "myAccount",
      "00": "insurance",
    },
  });

  menu.state("updateGender", {
    run: async () => {
      const gender = menu.val == 1 ? "M" : "F";
      const user = await User.update(
        {
          gender: gender,
        },
        {
          where: {
            phone_number: args.phoneNumber,
          },
        }
      );

      console.log("USER: ", user);

      menu.con(`Enter your date of birth in the format DDMMYYYY
            0. Back
            00. Main Menu
             `);
    },
    next: {
      "*[0-9]": "updateDob",
      "0": "myAccount",
      "00": "insurance",
    },
  });

  menu.state("updateDob", {
    run: async () => {
      let dob = menu.val;
      console.log("dob", dob);

      //remove all non numeric characters
      dob = dob.replace(/\D/g, "");
      console.log("dob", dob);
      // convert ddmmyyyy to valid date
      let day = parseInt(dob.substring(0, 2));
      let month = parseInt(dob.substring(2, 4));
      let year = parseInt(dob.substring(4, 8));
      let date = new Date(year, month - 1, day);
      console.log(" dob date", date);

      const user = await User.update(
        {
          dob: date,
        },
        {
          where: {
            phone_number: args.phoneNumber,
          },
        }
      );

      console.log("USER DOB UPDATE: ", user);

      menu.con(`Your profile has been updated successfully
            0. Back
            00. Main Menu
             `);
    },
    next: {
      "0": "myAccount",
      "00": "insurance",
    },
  });

  //update beneficiary
  // menu.state('addBeneficiary', {
  //     run: async () => {
  //         menu.con('Update or add Beneficiary ' +

  //             '\n1. Update Beneficiary' +
  //             '\n2. Add Beneficiary' +
  //             '\n0.Back' +
  //             '\n00.Main Menu'
  //         )
  //     },
  //     next: {
  //         '1': 'listBeneficiaries',
  //         '2': 'addBeneficiaryName',
  //         '0': 'myAccount',
  //         '00': 'insurance',
  //     }
  // })

  menu.state("addBeneficiaryName", {
    run: async () => {
      menu.con("Enter full name of beneficiary");
    },
    next: {
      "*[a-zA-Z]+": "updateBeneficiaryName",
    },
  });

  //list beneficiaries
  menu.state("listBeneficiaries", {
    run: async () => {
      const user = await User.findOne({
        where: {
          phone_number: args.phoneNumber,
        },
      });
      if (user) {
        const beneficiaries = await Beneficiary.findAll({
          where: {
            user_id: user?.user_id,
          },
        });

        console.log("BENEFICIARIES: ", beneficiaries);
        if (beneficiaries.length > 0) {
          let beneficiaryInfo = "";
          for (let i = 0; i < beneficiaries.length; i++) {
            let beneficiary = beneficiaries[i];
            beneficiaryInfo += `${
              i + 1
            }. ${beneficiary.full_name.toUpperCase()}\n`;
          }
          menu.con(beneficiaryInfo);
        } else {
          menu.con("You have no beneficiaries\n0 Back");
        }
      } else {
        menu.end("User not found");
      }
    },
    next: {
      "*[0-9]": "updateBeneficiaryGender",
    },
  });

  menu.state("updateBeneficiaryGender", {
    run: async () => {
      menu.con("Enter gender of beneficiary: " + "\n1. Male" + "\n2. Female");
    },
    next: {
      "*[0-9]": "updateBeneficiaryDob",
    },
  });

  menu.state("updateBeneficiaryDob", {
    run: async () => {
      menu.con("Enter your date of birth in the format DDMMYYYY");
    },
    next: {
      "*[0-9]": "updateBeneficiaryConfirm",
    },
  });

  menu.state("updateBeneficiaryConfirm", {
    run: async () => {
      let dob = menu.val;
      console.log("dob", dob);

      // convert ddmmyyyy to valid date
      let day = dob.substring(0, 2);
      let month = dob.substring(2, 4);
      let year = dob.substring(4, 8);
      let date = new Date(year, month - 1, day);
      console.log("date", date);

      // Fetch the beneficiary ID from the previous step's input value
      const selected = args.text;
      const input = selected.trim();
      const digits = input.split("*").map((digit) => parseInt(digit, 10));
      console.log("digits", digits);
      const beneficiaryId = digits[digits.length - 3];
      console.log("beneficiaryId", beneficiaryId);

      let gender = digits[digits.length - 2] == 1 ? "M" : "F";

      console.log("gender", gender);
      // Assuming you have the beneficiary ID from the previous steps
      const user = await User.findOne({
        where: {
          phone_number: args.phoneNumber,
        },
      });

      if (user) {
        let beneficiaries = await Beneficiary.findAll({
          where: {
            user_id: user?.user_id,
          },
          attributes: { exclude: [] }, // return all columns
        });

        const selectedBeneficiary = beneficiaries[beneficiaryId - 1];
        console.log("selectedBeneficiary", selectedBeneficiary);

        if (selectedBeneficiary) {
          // Update the beneficiary's information
          let thisYear = new Date().getFullYear();
          selectedBeneficiary.dob = date;
          selectedBeneficiary.age = thisYear - date.getFullYear();
          selectedBeneficiary.gender = gender;

          try {
            let result = await selectedBeneficiary.save();

            console.log("Result after save:", result);

            menu.end("Beneficiary updated successfully");
          } catch (error) {
            console.error("Error saving beneficiary:", error);
            menu.end("Failed to update beneficiary. Please try again.");
          }
        } else {
          menu.end("Invalid beneficiary selection");
        }
      } else {
        menu.end("User not found");
      }
    },
  });

  //============CANCEL POLICY=================

  menu.state("cancelPolicy", {
    run: async () => {
      const user = await User.findOne({
        where: {
          phone_number: args.phoneNumber,
        },
      });
      if (user) {
        const policy = await Policy.findOne({
          where: {
            user_id: user?.user_id,
          },
        });

        console.log("POLICY: ", policy);
        if (policy) {
          // 1. Cancel Policy
          menu.con(
            `Hospital cover ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
            `   Inpatient limit: UGX ${policy.sum_insured}\n` +
            `   Remaining: UGX ${policy.sum_insured}\n` +
            `   Last Expense Per Person Benefit: ${policy.benefit}\n\n` +
            "\n1. Cancel Policy"
            );
        
            
        } else {
          menu.con("Your policy is INACTIVE\n0 Buy cover");
        }
      } else {
        menu.end("User not found");
      }
    },
    next: {
      "0": "account",
      "1": "cancelPolicyPin",
    },
  });

  //cancel policy pin

  menu.state("cancelPolicyPin", {
    run: async () => {
      const user = await User.findOne({
        where: {
          phone_number: args.phoneNumber,
        },
      });
      const policy = await Policy.findOne({
        where: {
          user_id: user?.user_id,
        },
      });
      let today = new Date();

      console.log("POLICY: ", policy);
      menu.con(`By cancelling, you will no longer be covered for ${policy.policy_type.toUpperCase()} Insurance as of ${today}.
            '\nEnter PIN or Membership ID to  Confirm cancellation
                0.Back
                00.Main Menu`);
    },
    next: {
      "*[0-9]": "cancelPolicyConfirm",
    },
  });

  //cancel policy confirm

  menu.state("cancelPolicyConfirm", {
    run: async () => {
      const to = args.phoneNumber;
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
            user_id: user?.user_id,
          },
        });
      }

      console.log("POLICY: ", policy);
      if (policy) {
        // 1. Cancel Policy
        policy.policy_status = "cancelled";
        policy.policy_end_date = today;
        await policy.save();
      }
      const message = `You CANCELLED your Medical cover cover. Your Policy will expire on ${today} and you will not be covered. Dial *187*7*1# to reactivate.`;

      const sms = await sendSMS(to, message);

      menu.con(`Your policy will expire on ${today}  and will not be renewed. Dial *187*7# to reactivate.
            0.Back     00.Main Menu`);
    },
    next: {
      "0": "myAccount",
      "00": "insurance",
    },
  });

  //my insurance policy
  menu.state("myInsurancePolicy", {
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
        menu.con("User not found");
        return;
      }

      let policies = await Policy.findAll({
        where: {
          policy_status: "paid",
          user_id: user?.user_id,
        },
      });

      console.log("POLICIES: ", policies);

      if (policies.length === 0) {
        menu.con(
          "You have no policies\n" +
            "1. Buy cover\n" +
            "0. Back\n" +
            "00. Main Menu"
        );
        return;
      }

      let policyInfo = "";

      for (let i = 0; i < policies.length; i++) {
        let policy = policies[i];
        let benefit: any;

        if (policy.policy_type == "bronze") {
          benefit = bronzeLastExpenseBenefit;
        } else if (policy.policy_type == "silver") {
          benefit = silverLastExpenseBenefit;
        } else if (policy.policy_type == "gold") {
          benefit = goldLastExpenseBenefit;
        }

//         Bronze cover ACTIVE up to DD/MM/YYYY
// Inpatient limit L: UGX 3,000,000. Balance remaining UGX 2,300,000 
  //format date to dd/mm/yyyy
  let formatDate = (date:any) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  policy.policy_end_date = formatDate(policy.policy_end_date)

        policyInfo +=
          `${
            i + 1
          }. ${policy.policy_type.toUpperCase()} ACTIVE to ${
            policy.policy_end_date
          }\n` +
          `   Inpatient limit: UGX ${policy.sum_insured}\n` 
          // \n` +
          // `   Last Expense Per Person Benefit: ${benefit}\n\n`;
      }

      menu.end(`My Insurance Policies:\n\n${policyInfo}`);
    },
    next: {
      "1": "account",
      "0": "account",
      "00": "insurance",
    },
  });

  menu.state("manageAutoRenew", {
    run: async () => {
      menu.con(
        "Manage auto-renew " +
          "\n1. Activate auto-renew" +
          "\n2. Deactivate auto-renew" +
          "\n0.Back" +
          "\n00.Main Menu"
      );
    },
  });



}
