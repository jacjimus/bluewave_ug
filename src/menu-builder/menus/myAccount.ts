import sendSMS from "../../services/sendSMS";
import { registerDependant, fetchMemberStatusData } from "../../services/aar";
import { v4 as uuidv4 } from 'uuid';

export function myAccount(menu: any, args: any, db: any) {
  const User = db.users;
  const Policy = db.policies;
  const Beneficiary = db.beneficiaries;

  const findUserByPhoneNumber = async (phoneNumber: any) => {
    return await User.findOne({
      where: {
        phone_number: phoneNumber,
      },
    });
  };


  menu.state("myAccount", {
    run: async () => {
      console.log("* MY ACCOUNT ", args.phoneNumber)

      menu.con(
        "My Account " +
        "\n1. Policy Status" +
        "\n2. Pay Now" +
        "\n3. Renew Policy" +
        "\n4. Update My Profile(KYC)" +
        "\n5. Cancel policy" +
        "\n6. Add Dependant" +
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
      "6": "addDependant",
      "7": "myHospitalOption",
      "0": "account",
      "00": "account",
    },
  });

  //update profile ( user dob and gender)
 
  // ======= ADD SPOUSE DEPENDANT =========
  menu.state("addDependant", {
    run: async () => {
      menu.con(
        "Add Dependant " +
        "\n1. Update Spouse" +
        "\n2. Add Child" +
        "\n0.Back" +
        "\n00.Main Menu"
      );
    },
    next: {
      "1": "updateSpouse",
      "2": "addChild",
      "0": "myAccount",
      "00": "account",
    },
  });
  menu.state("updateSpouse", {
    run: async () => {
      menu.con("Enter gender of spouse: " + "\n1. Male" + "\n2. Female");
    },
    next: {
      "*[0-9]": "updateBeneficiaryGender",
    },
  });

  menu.state("updateBeneficiaryGender", {
    run: async () => {
      const gender = menu.val == 1 ? "M" : "F";
      console.log("GENDER", gender)

      const user = await findUserByPhoneNumber(args.phoneNumber);
      let beneficiary = await Beneficiary.findOne({
        where: {
          user_id: user?.user_id,
          relationship: "SPOUSE",

        },
      });
      if (!beneficiary) {
        return menu.end("You have not added a spouse, please buy family cover first");
      }
      console.log("BENEFICIARY: ", beneficiary);

      beneficiary.gender = gender;
      await beneficiary.save();

      console.log("USER: ", user);

      menu.con(`Enter your spouse's date of birth in the format DDMMYYYY e.g 01011990
            0. Back
            00. Main Menu
             `);
    },
    next: {
      "*[0-9]": "updateBeneficiaryDob",
      "0": "myAccount",
      "00": "account",
    },
  });

  menu.state("updateBeneficiaryDob", {
    run: async () => {
      const spouse_dob = menu.val;

      // convert ddmmyyyy to valid date

      // convert ddmmyyyy to valid date
      let day = spouse_dob.substring(0, 2);
      let month = spouse_dob.substring(2, 4);
      let year = spouse_dob.substring(4, 8);
      let date = new Date(year, month - 1, day);
      console.log("DATE OF BIRTH", date);

      const user = await findUserByPhoneNumber(args.phoneNumber);

      let beneficiary = await Beneficiary.findOne({
        where: {
          user_id: user?.user_id,
          relationship: "SPOUSE",

        },
      });

      beneficiary.dob = date;
      beneficiary.age = new Date().getFullYear() - date.getFullYear();

      await beneficiary.save();

      console.log("BENEFICIARY: ", beneficiary);

      const policy = await Policy.findOne({
        where: {
          user_id: user?.user_id,
          beneficiary: 'FAMILY',
        },
      });

      console.log("POLICY: ", policy);


      let arr_member = await fetchMemberStatusData({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
      console.log("arr_member", arr_member);
      if (arr_member.code == 200) {
        await registerDependant({
          member_no: user.arr_member_number,
          surname: beneficiary.last_name,
          first_name: beneficiary.first_name,
          other_names: beneficiary.middle_name || beneficiary.last_name,
          gender: beneficiary.gender == "M" ? "1" : "2",
          dob: date.toISOString().split('T')[0],
          email: "dependant@bluewave.insure",
          pri_dep: "25",
          family_title: "4", //4 spouse // 3 -principal // 25 - child
          tel_no: beneficiary.phone_number,
          next_of_kin: {
            surname: "",
            first_name: "",
            other_names: "",
            tel_no: "",
          },
          member_status: "1",
          health_option: "63",
          health_plan: "AIRTEL_" + policy?.policy_type,
          policy_start_date: policy.policy_start_date,
          policy_end_date: policy.policy_end_date,
          unique_profile_id: user.membership_id + "-01",
        }
        );
      }
      menu.con(
        `Your spouse ${beneficiary.full_name} profile has been updated successfully
                0. Back
                00. Main Menu
                 `
      );
    },
    next: {
      "0": "myAccount",
      "00": "account",
    },
  });


  // ======= ADD CHILD DEPENDANT =========
  menu.state("addChild", {
    run: async () => {
      menu.con("Enter child's name: ");
    },
    next: {
      "*[a-zA-Z]": "addChildGender",
    },
  });



  menu.state("addChildGender", {
    run: async () => {
      let child_name = menu.val;
      console.log("CHILD NAME", child_name);

      const user = await findUserByPhoneNumber(args.phoneNumber);

      let beneficiary = await Beneficiary.findAll({
        where: {
          user_id: user?.user_id,
          relationship: "CHILD",
        },
      });

      console.log("BENEFICIARY CHILD GENDER: ", beneficiary);

      let newChildDep = await Beneficiary.create({
        beneficiary_id: uuidv4(),
        user_id: user?.user_id,
        full_name: child_name,
        first_name: child_name.split(" ")[0],
        middle_name: child_name.split(" ")[1],
        last_name: child_name.split(" ")[2] || child_name.split(" ")[1],
        relationship: "CHILD",
      });

      console.log("NEW CHILD BENEFICIARY: ", newChildDep);

      menu.con("Enter gender of child: " + "\n1. Male" + "\n2. Female");
    }
    ,
    next: {
      "*[0-9]": "updateChildGender",
    },

  });

  menu.state("updateChildGender", {
    run: async () => {
      const gender = menu.val == 1 ? "M" : "F";
      console.log("GENDER", gender)

      const user = await findUserByPhoneNumber(args.phoneNumber);
      let beneficiary = await Beneficiary.findAll({
        where: {
          user_id: user?.user_id,
          relationship: "CHILD",

        },
      });

      beneficiary = beneficiary[beneficiary.length - 1];

      if (!beneficiary) {
        return menu.end("You have not added a spouse, please buy family cover first");
      }
      console.log("BENEFICIARY: ", beneficiary);



      beneficiary.gender = gender;
      await beneficiary.save();

      console.log("USER: ", user);

      menu.con(`Enter child's date of birth in the format DDMMYYYY e.g 01011990`)


    },
    next: {
      "*[0-9]": "addChildDob",
      "0": "myAccount",
      "00": "account",
    },
  });

  menu.state("addChildDob", {
    run: async () => {
      let child_dob = menu.val;
      console.log("CHILD DOB", child_dob);

      // convert ddmmyyyy to valid date
      let day = child_dob.substring(0, 2);
      let month = child_dob.substring(2, 4);
      let year = child_dob.substring(4, 8);
      let date = new Date(year, month - 1, day);
      console.log("DATE OF BIRTH", date);

      const user = await findUserByPhoneNumber(args.phoneNumber);

      let beneficiary = await Beneficiary.findAll({
        where: {
          user_id: user?.user_id,
          relationship: "CHILD",
        },
      });
      console.log("CHILD DOB BENEFICIARY: ", beneficiary);

      beneficiary = beneficiary[beneficiary.length - 1];

      beneficiary.dob = date;
      beneficiary.age = new Date().getFullYear() - date.getFullYear();

      await beneficiary.save();

      console.log("BENEFICIARY: ", beneficiary);


      const policy = await Policy.findOne({
        where: {
          user_id: user?.user_id,
          beneficiary: 'FAMILY',
        },
      });

      console.log("POLICY: ", policy);


      let arr_member = await fetchMemberStatusData({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
      console.log("arr_member", arr_member);
      let arr_dep_reg
      if (arr_member.code == 200) {
        arr_dep_reg = await registerDependant({
          member_no: user.arr_member_number,
          surname: beneficiary.last_name,
          first_name: beneficiary.first_name,
          other_names: beneficiary.middle_name || beneficiary.last_name,
          gender: beneficiary.gender == "M" ? "1" : "2",
          dob: date.toISOString().split('T')[0],
          email: "dependant@bluewave.insure",
          pri_dep: "25",
          family_title: "25", //4 spouse // 3 -principal // 25 - child
          tel_no: user.phone_number,
          next_of_kin: {
            surname: "",
            first_name: "",
            other_names: "",
            tel_no: "",
          },
          member_status: "1",
          health_option: "63",
          health_plan: "AIRTEL_" + policy?.policy_type,
          policy_start_date: policy.policy_start_date,
          policy_end_date: policy.policy_end_date,
          unique_profile_id: user.membership_id + "-02",
        }
        );
        beneficiary.dependant_member_number = arr_dep_reg.member_no;
        await beneficiary.save();
      }
      menu.con(
        `Your child ${beneficiary.full_name} profile has been updated successfully
                0. Back
                00. Main Menu
                 `
      );

    },
    next: {
      "0": "myAccount",
      "00": "account",
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
            // `   Inpatient limit: UGX ${policy.sum_insured}\n` +
            // `   Remaining: UGX ${policy.sum_insured}\n` +
            // `   Last Expense Per Person Benefit: ${policy.last_expense_insured}\n\n` +
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

      menu.con(`Your policy will expire on ${today}  and will not be renewed. Dial *185*7*6# to reactivate.
            0.Back     00.Main Menu`);
    },
    next: {
      "0": "myAccount",
      "00": "account",
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

      console.log("====USER ===  ", user?.user_id)


      let otherPolicies = await Policy.findAll({
        where: {
          bought_for: user?.user_id,
        },
      });

      console.log("OTHER POLICIES: ", otherPolicies);

      policies = policies.concat(otherPolicies);

      console.log("POLICIES: ", policies);

      function formatNumberToM(value) {
        return (value / 1000000).toFixed(1) + 'M';
      }

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
        let formatDate = (date: any) => {
          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yyyy = date.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        }

        policy.policy_end_date = formatDate(policy.policy_end_date)




        policyInfo += ` Dwaliro Inpatient UGX ${formatNumberToM(policy.sum_insured)} and Funeral benefit UGX ${formatNumberToM(policy.last_expense_insured)} is active and paid to ${policy.policy_end_date.toDateString()}.
        `

      }
      policyInfo += "Dial *185*7*6# to renew";
      policyInfo += "\n0. Back\n00. Main Menu";


      menu.end(`My Insurance Policies:\n\n${policyInfo}`);
    },
    next: {
      "1": "account",
      "0": "account",
      "00": "account",
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

  //renewPolicy

  menu.state("renewPolicy", {
    run: async () => {
      // get policy
      const user = await User.findOne({
        where: {
          phone_number: args.phoneNumber,
        },
      });

      console.log("USER: ", user);

      const policy = await Policy.findOne({
        where: {
          user_id: user?.user_id,
          installment: "2",
        },
      });
      console.log("POLICY: ", policy);

      if (!policy) {
        menu.con("You have no policy to renew\n1. Buy cover\n0. Back\n00. Main Menu");
        return;
      }

      menu.con(
        `Your ${policy.policy_type.toUpperCase()} cover expires on ${policy.policy_end_date.toDateString()}.\n` +
        `   Pending amount : UGX ${policy.policy_pending_premium}\n` +

        "\n1. Renew Policy"
      );

    },
    next: {
      "1": "renewPolicyPin",
      "0": "myAccount",
      "00": "account",
    },



    

  }
  )







}
