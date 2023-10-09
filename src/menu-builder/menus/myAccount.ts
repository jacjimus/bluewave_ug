import sendSMS from "../../services/sendSMS";
import {registerDependant,fetchMemberStatusData } from "../../services/aar";

export function myAccount(menu: any, args: any, db: any) {
  const User = db.users;
  const Policy = db.policies;
  const Beneficiary = db.beneficiaries;
  menu.state("myAccount", {
    run: async () => {
      
      menu.con(
        "My Account " +
          "\n1. Policy Status" +
          "\n2. Pay Now" +
          "\n3. Renew Policy" +
          "\n4. Update My Profile(KYC)" +
          "\n5. Cancel policy" +
          "\n6. Update Beneficiary Details" +
          "\n7. My Hospital" +
          "\n0.Back" +
          "\n00.Main Menu"
      );
    },
    next: {
      "1": "myInsurancePolicy",
      "2": "payNow",
      "3": "renewPolicy",
      "4": "updateProfile",
      "5": "cancelPolicy",
      "6": "listBeneficiaries",
      "7": "myHospitalOption",
      "0": "account",
      "00": "insurance",
    },
  });

  //update profile ( user dob and gender)
  menu.state("updateProfile", {
    run: async () => {
      menu.con(`Whats their gender
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

      menu.con(`Enter your date of birth in the format DDMMYYYY e.g 01011990
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

      menu.con(`Enter your marital status
            1. Single
            2. Married
            3. Divorced
            4. Widowed
            0. Back
            00. Main Menu
              `);
    },
    next: {
      "*[0-9]": "updateMaritalStatus",
      "0": "myAccount",
      "00": "insurance",
    },
  });

  menu.state("updateMaritalStatus", {
    run: async () => {

      const { gender } = await User.findOne({
        where: {
          phone_number: args.phoneNumber,
        },
      });

      let title ="";

      let ben_marital_status = menu.val;
      if (ben_marital_status == 1) {
        ben_marital_status = "single";
        gender == "M" ? title = "Mr" : title = "Ms"
      } else if (ben_marital_status == 2) {
        ben_marital_status = "married";
        gender == "M"  ? title = "Mr" : title = "Mrs"
      } else if (ben_marital_status == 3) {
        ben_marital_status = "divorced";
        gender == "M"  ? title = "Mr" : title = "Ms"
      } else if (ben_marital_status == 4) {
        ben_marital_status = "widowed";
        gender == "M" ? title = "Mr" : title = "Mrs"
      }

      console.log("ben_marital_status", ben_marital_status);
      const user = await User.update(
        {
          marital_status: ben_marital_status,
          title: title
        },
        {
          where: {
            phone_number: args.phoneNumber,
          },
        }
      );

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


  //list beneficiaries
  menu.state("listBeneficiaries", {
    run: async () => {
      const user = await User.findOne({
        where: {
          phone_number: args.phoneNumber,
        },
      });
      console.log("USER: ", user?.user_id)

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
      const ben_dob = menu.val;
      console.log("ben_dob", ben_dob);

      // convert ddmmyyyy to valid date
      let day = ben_dob.substring(0, 2);
      let month = ben_dob.substring(2, 4);
      let year = ben_dob.substring(4, 8);
      let date = new Date(year, month - 1, day);
      console.log("date", date);

      //get the second last digit of the input
      const selected = args.text;
      const input = selected.trim();
      const digits = input.split("*").map((digit) => parseInt(digit, 10));
      console.log("digits", digits);
      const beneficiaryId = digits[digits.length - 2];
      console.log("beneficiaryId", beneficiaryId);

      //get all beneficiaries for this user and select the one with the beneficiaryId index

      const user = await User.findOne({ 
        where: {
          phone_number: args.phoneNumber,
        },
      });


      const beneficiaries = await Beneficiary.findAll({ 
        where: {
          user_id: user?.user_id,
        },
      });

      let myBeneficiary = beneficiaries[beneficiaryId - 1];
      console.log("myBeneficiary", myBeneficiary);

      // FIRST_NAME LAST_NAME
      // divide the name into first name and last name and save them separately
      let names = myBeneficiary.full_name.split(" ");
      let first_name = names[0];
      let last_name = names[1];
      let middle_names = names[2] || names[1];

 console.log("GENDER", digits[digits.length - 1] )
      if (myBeneficiary) {
        // Update the beneficiary's information
        let thisYear = new Date().getFullYear();
        myBeneficiary.dob = date;
        myBeneficiary.age = thisYear - date.getFullYear();
        myBeneficiary.first_name = first_name;
        myBeneficiary.last_name = last_name;
        myBeneficiary.middle_names = middle_names;
        myBeneficiary.gender = digits[digits.length - 1] == 1 ? "M" : "F";
        myBeneficiary.save();

      }

      console.log("==== myBeneficiary =======", myBeneficiary);


      menu.con("Enter beneficiary date of birth in the format DDMMYYYY e.g 01011990");
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
            menu.con("Enter the phone number of the beneficiary eg 0772123456");
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
  next: {
    "*[0-9]": "updateBeneficiaryPhoneNumber",
    "1": "cancelPolicyPin",
  },
  });

  menu.state("updateBeneficiaryPhoneNumber", {
    run: async () => {
      let ben_first_phone = menu.val;
   
      //remove all non numeric characters
      ben_first_phone = ben_first_phone.replace(/\D/g, "");
      console.log("ben_first_phone", ben_first_phone);
      //remove leading 0 if any and add 256
      if (ben_first_phone.startsWith("0")) {
        ben_first_phone = "256" + ben_first_phone.substring(1);
      } else if (ben_first_phone.startsWith("7")) {
        ben_first_phone = "256" + ben_first_phone;
      }
      //check if phone number is valid
      if (ben_first_phone.length != 12) {
        menu.end("Invalid phone number");
        return;
      }

      console.log("ben_first_phone", ben_first_phone);
      
      let user = await User.findOne({
        where: {
          phone_number: args.phoneNumber,
        },
      });

      console.log("USER: ", user)
      
      const policy = await Policy.findOne({
        where: {
          user_id: user?.user_id,
          beneficiary:  'FAMILY',
        },
      });

      console.log("POLICY: ", policy);
      
    

      let beneficiary = await Beneficiary.findOne({
        where: {
          user_id: user?.user_id,
        },
      });

      beneficiary.phone_number = ben_first_phone;

      await beneficiary.save();

      console.log("beneficiary", beneficiary);

      let arr_member =  await fetchMemberStatusData({ member_no: user.arr_member_number , unique_profile_id: user.membership_id + ""});
      console.log("arr_member", arr_member);
      if(arr_member.code == 200){
        await registerDependant({
              member_no: user.arr_member_number,
              surname: beneficiary.last_name,
              first_name: beneficiary.first_name,
              other_names: beneficiary.middle_name || "",
              gender: beneficiary.gender == "M" ? "1" : "2",
              dob: beneficiary.dob,
              email: "dependant@bluewave.insure",
              pri_dep: "25",
              family_title: "4",
              tel_no: beneficiary.phone_number,
              next_of_kin: {
                surname: "",
                first_name: "",
                other_names: "",
                tel_no: "",
              },
              member_status: "2",
              health_option: "63",
              health_plan: "AIRTEL_" + policy?.policy_type,
              policy_start_date: policy.policy_start_date,
              policy_end_date: policy.policy_end_date,
              unique_profile_id: user.membership_id + "-04",
            }
        );
          }

      menu.con(`Your beneficiary profile has been updated successfully
            0. Back
            00. Main Menu
             `);
    },
    next: {
      "0": "myAccount",
      "00": "insurance",
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
      // const bronzeLastExpenseBenefit = "UGX 1,000,000";
      // const silverLastExpenseBenefit = "UGX 1,500,000";
      // const goldLastExpenseBenefit = "UGX 2,000,000";

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

          user_id: user?.user_id,
        },
      });


      let otherPolicies = await Policy.findAll({
        where: {
          bought_for: user?.user_id,
        },
      });

      policies = policies.concat(otherPolicies);

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

 

        policyInfo += ` Dwaliro Biggie Inpatient UGX ${policy.sum_insured} and Funeral benefit UGX ${policy.last_expense_insured} is active and paid to ${policy.policy_end_date}. Dial *187*7# to renew.
        0.Back 00.Main Menu 01 Next`
         
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
