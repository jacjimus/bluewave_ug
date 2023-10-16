import { airtelMoney } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
import sendSMS from "../../services/sendSMS";
import { getAirtelUser } from '../../services/getAirtelUser';


export function buyForFamily(menu: any, args: any, db: any): void {

  const Policy = db.policies;
  const Beneficiary = db.beneficiaries;
  const User = db.users;

  if (args.phoneNumber.charAt(0) == "+") {
    args.phoneNumber = args.phoneNumber.substring(1);
  }


  const findUserByPhoneNumber = async (phoneNumber: any) => {
    return await User.findOne({
      where: {
        phone_number: phoneNumber,
      },
    });
  };

  const findPaidPolicyByUser = async (user: any) => {
    let policies = await Policy.findAll({
      where: {
        user_id: user.user_id,
        policy_status: 'paid'
      },
    });
    return policies[policies.length - 1];
  };

  const findPolicyByUser = async (user_id: any) => {
    let policies = await Policy.findAll({
      where: {
        user_id: user_id,
      },
    });

    return policies[policies.length - 1];
  }

  menu.state("buyForFamily", {
    run: () => {


      menu.con(
        "Buy for family " +
        "\n1. Self + Spouse or Child" +
        "\n2. Self + Spouse + 1 Child" +
        "\n3. Self + Spouse + 2 Children" +
        "\n01. Next" +
        "\n0.Back" +
        "\n00.Main Menu"
      );
    },
    next: {
      "1": "buyForFamily.selfSpouseCover",
      "2": "buyForFamily.selfSpouseCover",
      "3": "buyForFamily.selfSpouseCover",
      "0": "account",
      "00": "account",
      "01": "buyForFamily.next",
    },
  });

  menu.state("buyForFamily.next", {
    run: () => {
      menu.con(
        "Buy for family " +
        "\n4. Self + Spouse + 3 Child" +
        "\n5. Self + Spouse + 4 Child" +
        "\n6. Self + Spouse + 5 Children" +
        "\n0.Back" +
        "\n00.Main Menu"
      );
    },
    next: {
      "4": "buyForFamily.selfSpouseCover",
      "5": "buyForFamily.selfSpouseCover",
      "6": "buyForFamily.selfSpouseCover",
      "0": "buyForFamily",
      "00": "account",
    },
  });

  menu.state("buyForFamily.selfSpouseCover", {
    run: async () => {
      let member_number = menu.val;
      console.log("MEMBER NUMBER", member_number);
      if (member_number == "1") {
        member_number = "M+1";
      } else if (member_number == "2") {
        member_number = "M+2";
      } else if (member_number == "3") {
        member_number = "M+3";
      } else if (member_number == "4") {
        member_number = "M+4";
      } else if (member_number == "5") {
        member_number = "M+5";
      } else if (member_number == "6") {
        member_number = "M+6";
      } else {
        menu.end("Invalid option");
      }
      console.log("MEMBER NUMBER", member_number);
      let existingUser = await findUserByPhoneNumber(args.phoneNumber);
      menu.session.set('user', existingUser)
      existingUser.total_member_number = member_number;
      await existingUser.save();

      if (!existingUser) {
        await User.create({
          user_id: uuidv4(),
          phone_number: args.phoneNumber,
          membership_id: Math.floor(100000 + Math.random() * 900000),
          pin: Math.floor(1000 + Math.random() * 9000),
          first_name: "",
          middle_name: "",
          last_name: "",
          name: "",
          total_member_number: member_number,
          partner_id: 2,
          role: "user",
        });
      }

      if (member_number == "M+1") {
        menu.con(`
              1. Mini UGX 20,000
              2. Midi UGX 28,000
              3. Biggie UGX 35,000
              0. Back
              00. Main Menu`);
      } else if (member_number == "M+2") {
        menu.con(`
              1. Mini UGX 30,000
              2. Midi UGX 40,000
              3. Biggie UGX 50,000
              0. Back
              00. Main Menu`);
      } else if (member_number == "M+3") {
        menu.con(`
              1. Mini UGX 40,000
              2. Midi UGX 50,000
              3. Biggie UGX 65,000
              0. Back
              00. Main Menu`);
      } else if (member_number == "M+4") {
        menu.con(`
              1. Mini UGX 50,000
              2. Midi UGX 63,000
              3. Biggie UGX 77,000
              0. Back
              00. Main Menu`);
      } else if (member_number == "M+5") {
        menu.con(`
              1. Mini UGX 60,000
              2. Midi UGX 75,000
              3. Biggie UGX 93,000
              0. Back
              00. Main Menu`);
      } else if (member_number == "M+6") {
        menu.con(`
              1. Mini UGX 70,000
              2. Midi UGX 88,000
              3. Biggie UGX 108,000
              0. Back
              00. Main Menu`);
      } else {
        menu.con(`
                  1. Mini UGX 20,000
                  2. Midi UGX 28,000
                  3. Biggie UGX 35,000
                  0. Back
                  00. Main Menu`);
      }
    },
    next: {
      "*\\d+": "buyForFamily.selfSpouseCoverType",
      "0": "buyForFamily",
      "00": "account",
    },
  });

  menu.state("buyForFamily.selfSpouseCoverType", {
    run: async () => {
      let coverType = menu.val;
      console.log("FAMILY COVER TYPE", coverType);

      let existingUser = await menu.session.get('user')

      console.log("USER DATA SESSION", existingUser);
      if (existingUser) {
        //let { user_id, partner_id } = user;
        let date = new Date();
        let day = date.getDate() - 1;

        if (coverType == "1") {
          coverType = "MINI";
        } else if (coverType == "2") {
          coverType = "MIDI";
        } else if (coverType == "3") {
          coverType = "BIGGIE";
        }


        await Policy.create({
          phone_number: args.phoneNumber,
          user_id: existingUser.user_id,
          policy_id: uuidv4(),
          policy_type: coverType,
          beneficiary: "FAMILY",
          policy_status: "pending",
          policy_start_date: new Date(),
          policy_end_date: new Date(
            date.getFullYear() + 1,
            date.getMonth(),
            day
          ),
          policy_deduction_day: day * 1,
          partner_id: 2,
          country_code: "UGA",
          currency_code: "UGX",
          product_id: "d18424d6-5316-4e12-9826-302b866a380c",
          cover_type: coverType,
          total_member_number: existingUser.total_member_number,
        });

        menu.con(
          "\nEnter atleast Name of spouse or 1 child" +
          "\n0.Back" +
          "\n00.Main Menu"
        );
      }
    },
    next: {
      "*[a-zA-Z]+": "buyForFamily.selfSpouseName",
      "0": "buyForFamily",
      "00": "account",
    },
  });

  menu.state("buyForFamily.selfSpouseName", {
    run: async () => {
      let spouse = menu.val;
      console.log("SPOUSE NAME", spouse);
      let existingUser = await menu.session.get('user')

      console.log("USER DATA SESSION", existingUser);

      let beneficiary = {
        beneficiary_id: uuidv4(),
        full_name: spouse,
        first_name: spouse.split(" ")[0],
        middle_name: spouse.split(" ")[1],
        last_name: spouse.split(" ")[2] || spouse.split(" ")[1],
        relationship: "SPOUSE",
        member_number: existingUser.total_member_number,
        user_id: existingUser.user_id,
      };

      let newBeneficiary = await Beneficiary.create(beneficiary);
      console.log("new beneficiary selfSpouse", newBeneficiary);
      menu.con(
        "\nEnter Phone of spouse (or Main member, if dependent is child)" +
        "\n0.Back" +
        "\n00.Main Menu"
      );

    },
    next: {
      "*\\d+": "buyForFamily.selfSpousePhoneNumber",
      "0": "buyForFamily",
      "00": "account",
    },
  });

  menu.state("buyForFamily.selfSpousePhoneNumber", {
    run: async () => {
      let spousePhone = menu.val;
      console.log("SPOUSE Phone", spousePhone);
      let existingUser = await menu.session.get('user')

      console.log("USER DATA SESSION", existingUser);

      if (spousePhone.charAt(0) == "+") {
        spousePhone = spousePhone.substring(1);
      }
      const current_beneficiary = await Beneficiary.findOne({
        where: { phone_number: spousePhone },
      });
      if (current_beneficiary) {
        menu.con("Beneficiary already exists, enter another phone number");
      }

      const {
        user_id,
        partner_id,
        phone_number,
        first_name,
        last_name,
        total_member_number,
      } = existingUser
      console.log(
        " ========= USER total_member_number========",
        total_member_number
      );
      await Beneficiary.update(
        { phone_number: spousePhone },
        { where: { user_id: user_id, relationship: "SPOUSE" } }
      );


      const { beneficiary, bought_for, policy_type } = await findPolicyByUser(
        args.phoneNumber
      );

      console.log(
        " ========= USER policy_type========",

        beneficiary,
        bought_for,
        policy_type
      );
      if (bought_for !== null) {
        await User.update(
          { phone_number: spousePhone },
          { where: { user_id: bought_for } }
        );
      }
      let sum_insured: number,
        period: string,
        installment_type: number,
        si: string,
        premium: number = 0,
        yearly_premium: number = 0,
        last_expense_insured: number = 0,
        lei: string;
      let paymentOption = 1;
      let coverType = policy_type;
      if (coverType == "MINI") {
        lei = "1M";
        si = "1.5M";
        if (paymentOption == 1) {
          period = "monthly";
          installment_type = 1;
        } else {
          period = "yearly";
          installment_type = 2;
        }

        if (total_member_number == "M") {
          sum_insured = 1500000;
          premium = 120000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            premium = 10000;
            yearly_premium = 240000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+1") {
          sum_insured = 1500000;
          premium = 240000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            premium = 20000;
            yearly_premium = 240000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+2") {
          sum_insured = 1500000;

          premium = 360000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            premium = 30000;
            yearly_premium = 360000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+3") {
          sum_insured = 1500000;
          premium = 480000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            premium = 40000;
            yearly_premium = 480000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+4") {
          sum_insured = 1500000;
          premium = 600000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 50000;
            yearly_premium = 600000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+5") {
          sum_insured = 1500000;
          premium = 720000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 60000;
            yearly_premium = 7200000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+6") {
          sum_insured = 1500000;
          premium = 840000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 70000;
            yearly_premium = 840000;
            last_expense_insured = 1000000;
          }
        } else {
          sum_insured = 1500000;
          premium = 240000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 20000;
            yearly_premium = 240000;
            last_expense_insured = 1000000;
          }
        }
      } else if (coverType == "MIDI") {
        si = "3M";
        lei = "1.5M";
        if (paymentOption == 1) {
          period = "monthly";
          installment_type = 1;
        } else {
          period = "yearly";
          installment_type = 2;
        }

        if (total_member_number == "M") {
          sum_insured = 3000000;
          premium = 167000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            premium = 14000;
            yearly_premium = 167000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+1") {
          sum_insured = 3000000;
          premium = 322000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            premium = 28000;
            yearly_premium = 322000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+2") {
          sum_insured = 3000000;
          premium = 467000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            premium = 40000;
            yearly_premium = 467000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+3") {
          sum_insured = 3000000;
          premium = 590000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            premium = 50000;
            yearly_premium = 590000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+4") {
          sum_insured = 3000000;
          premium = 720000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 63000;
            yearly_premium = 720000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+5") {
          sum_insured = 3000000;
          premium = 860000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 75000;
            yearly_premium = 860000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+6") {
          sum_insured = 3000000;
          premium = 1010000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 88000;
            yearly_premium = 1010000;
            last_expense_insured = 1500000;
          }
        } else {
          sum_insured = 3000000;
          premium = 322000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            premium = 28000;
            yearly_premium = 322000;
            last_expense_insured = 1500000;
          }
        }
      } else if (coverType == "BIGGIE") {
        si = "5M";
        lei = "2M";
        if (paymentOption == 1) {
          period = "monthly";
          installment_type = 1;
        } else {
          period = "yearly";
          installment_type = 2;
        }

        if (total_member_number == "M") {
          sum_insured = 5000000;
          premium = 208000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            premium = 18000;
            yearly_premium = 208000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+1") {
          sum_insured = 5000000;

          premium = 400000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            premium = 35000;
            yearly_premium = 400000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+2") {
          sum_insured = 5000000;

          premium = 577000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            period = "monthly";

            premium = 50000;
            yearly_premium = 577000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+3") {
          sum_insured = 5000000;

          premium = 740000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            premium = 65000;
            yearly_premium = 740000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+4") {
          sum_insured = 5000000;

          premium = 885000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            premium = 77000;
            yearly_premium = 885000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+5") {
          sum_insured = 5000000;
          premium = 1060000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 93000;
            yearly_premium = 1060000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+6") {
          sum_insured = 5000000;
          premium = 1238000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 108000;
            yearly_premium = 1238000;
            last_expense_insured = 2000000;
          }
        } else {
          sum_insured = 5000000;
          premium = 400000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 35000;
            yearly_premium = 400000;
            last_expense_insured = 2000000;
          }
        }
      } else {
        menu.end("Invalid option");
      }

      console.log("SUM INSURED", sum_insured);
      console.log("PREMIUM", premium);
      console.log("LAST EXPENSE INSURED", last_expense_insured);
      console.log("YEARLY PREMIUM", yearly_premium);

      menu.con(`Inpatient Family cover for ${first_name.toUpperCase()} ${last_name.toUpperCase()} ${phone_number}, UGX ${si} 
                PAY
                1 UGX ${new Intl.NumberFormat().format(premium)} monthly
                2 UGX ${new Intl.NumberFormat().format(yearly_premium)} yearly
                0.Back
                00.Main Menu`);
    },
    next: {
      "*\\d+": "buyForFamilyPin",
      "0": "buyForFamily",
      "00": "account",
    },
  });

  menu.state("buyForFamilyPin", {
    run: async () => {
      const paymentOption = Number(menu.val);
      console.log("PAYMENT OPTION", paymentOption);

      const { policy_id, user_id, policy_type, total_member_number } = await Policy.findOne({
        where: {
          phone_number: args.phoneNumber,
        },
      });

      console.log("====== Total_member_number ====  ", total_member_number);

      if (policy_id == null) {
        menu.end("Sorry, you have no policy to buy for family");
      }
      let sum_insured: number,
        si: string,
        premium: number = 0,
        installment_type: number = 0,
        period: string = "monthly",
        last_expense_insured: number = 0,
        lei: string,
        yearly_premium: number = 0;
      if (policy_type == "MINI") {
        lei = "1M";
        si = "1.5M";
        if (paymentOption == 1) {
          period = "monthly";
          installment_type = 1;
        } else {
          period = "yearly";
          installment_type = 2;
        }
        if (total_member_number == "M") {
          sum_insured = 1500000;
          premium = 120000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            premium = 10000;
            yearly_premium = 240000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+1") {
          sum_insured = 1500000;
          premium = 240000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            premium = 20000;
            yearly_premium = 240000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+2") {
          sum_insured = 1500000;
          premium = 360000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            premium = 30000;
            yearly_premium = 360000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+3") {
          sum_insured = 1500000;
          premium = 480000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            premium = 40000;
            yearly_premium = 480000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+4") {
          sum_insured = 1500000;
          premium = 600000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 50000;
            yearly_premium = 600000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+5") {
          sum_insured = 1500000;
          premium = 720000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 60000;
            yearly_premium = 7200000;
            last_expense_insured = 1000000;
          }
        } else if (total_member_number == "M+6") {
          sum_insured = 1500000;
          premium = 840000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 70000;
            yearly_premium = 840000;
            last_expense_insured = 1000000;
          }
        } else {
          sum_insured = 1500000;
          premium = 240000;
          last_expense_insured = 1000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 20000;
            yearly_premium = 240000;
            last_expense_insured = 1000000;
          }
        }
      } else if (policy_type == "MIDI") {
        si = "3M";
        lei = "1.5M";
        if (paymentOption == 1) {
          period = "monthly";
          installment_type = 1;
        } else {
          period = "yearly";
          installment_type = 2;
        }

        if (total_member_number == "M") {
          sum_insured = 3000000;
          premium = 167000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            premium = 14000;
            yearly_premium = 167000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+1") {
          sum_insured = 3000000;
          premium = 322000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            premium = 28000;
            yearly_premium = 322000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+2") {
          sum_insured = 3000000;
          premium = 467000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            premium = 40000;
            yearly_premium = 467000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+3") {
          sum_insured = 3000000;
          premium = 590000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            premium = 50000;
            yearly_premium = 590000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+4") {
          sum_insured = 3000000;
          premium = 720000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 63000;
            yearly_premium = 720000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+5") {
          sum_insured = 3000000;
          premium = 860000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 75000;
            yearly_premium = 860000;
            last_expense_insured = 1500000;
          }
        } else if (total_member_number == "M+6") {
          sum_insured = 3000000;
          premium = 1010000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 88000;
            yearly_premium = 1010000;
            last_expense_insured = 1500000;
          }
        } else {
          sum_insured = 3000000;
          premium = 322000;
          last_expense_insured = 1500000;

          if (paymentOption == 1) {
            premium = 28000;
            yearly_premium = 322000;
            last_expense_insured = 1500000;
          }
        }
      } else if (policy_type == "BIGGIE") {
        si = "5M";
        lei = "2M";
        if (paymentOption == 1) {
          period = "monthly";
          installment_type = 1;
        } else {
          period = "yearly";
          installment_type = 2;
        }

        if (total_member_number == "M") {
          sum_insured = 5000000;
          premium = 208000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            premium = 18000;
            yearly_premium = 208000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+1") {
          sum_insured = 5000000;
          premium = 400000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            premium = 35000;
            yearly_premium = 400000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+2") {
          sum_insured = 5000000;
          premium = 577000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            period = "monthly";

            premium = 50000;
            yearly_premium = 577000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+3") {
          sum_insured = 5000000;
          premium = 740000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            premium = 65000;
            yearly_premium = 740000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+4") {
          sum_insured = 5000000;
          premium = 885000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            premium = 77000;
            yearly_premium = 885000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+5") {
          sum_insured = 5000000;
          premium = 1060000;
          last_expense_insured = 2000000;

          if (paymentOption == 1) {
            period = "monthly";
            premium = 93000;
            yearly_premium = 1060000;
            last_expense_insured = 2000000;
          }
        } else if (total_member_number == "M+6") {
          sum_insured = 5000000;
          premium = 1238000;
          last_expense_insured = 2000000;
          if (paymentOption == 1) {
            period = "monthly";
            premium = 108000;
            yearly_premium = 1238000;
            last_expense_insured = 2000000;
          }
        } else {
          menu.end("Invalid option");
        }
      } else {
        menu.end("Invalid option");
      }

      console.log("SUM INSURED", sum_insured);
      console.log("PREMIUM", premium);
      console.log("LAST EXPENSE INSURED", last_expense_insured);
      console.log("YEARLY PREMIUM", yearly_premium);

      menu.con(`Pay UGX ${premium} payable ${period}.
                  Terms&Conditions - www.airtel.com
                  Enter PIN to Agree and Pay 
                  0.Back
                  00.Main Menu`);
    },
    next: {
      "*\\d+": "family.confirmation",
      "0": "buyForFamily",
      "00": "account",
    },
  });

  //buyForFamily.selfSpouse.pay.yearly
  menu.state("family.confirmation", {
    run: async () => {
      try {
        const userKyc = await getAirtelUser(
          args.phoneNumber,
          "UG",
          "UGX",
          2
        );
        console.log("=========  USER KYC ===========", userKyc);
        console.log("=========  USER args ===========", args.phoneNumber);

        await User.update(
          { first_name: userKyc.first_name, last_name: userKyc.last_name },
          { where: { phone_number: args.phoneNumber } }
        )
        const userPin = Number(menu.val);

        const selected = args.text;

        const input = selected.trim();
        const digits = input.split("*").map((digit) => parseInt(digit, 10));

        let paymentOption = Number(digits[digits.length - 2]);
        let existingUser = await menu.session.get('user')

        console.log("USER DATA SESSION", existingUser);

        const {
          user_id,
          phone_number,
          partner_id,
          membership_id,
          pin,
          total_member_number,
          cover_type,
        } = existingUser

        let coverType = cover_type;

        const { policy_type, policy_id, beneficiary, bought_for } =
          await findPolicyByUser(existingUser?.user_id);

        if (policy_id == null) {
          menu.end("Sorry, you have no policy to buy for family");
        }
        let otherMember: any;
        if (bought_for !== null && beneficiary == "OTHERS") {
          otherMember = await User.findOne({
            where: { user_id: bought_for },
          });
          console.log("OTHER MEMBER", otherMember);
        }
        let sum_insured: number,
          premium: number = 0,
          installment_type: number = 0,
          period: string = "monthly",
          last_expense_insured: number = 0,
          si: string = "",
          lei: string,
          yearly_premium: number = 0,
          members: string = "";
        if (coverType == "MINI") {
          lei = "1M";
          si = "1.5M";
          if (paymentOption == 1) {
            period = "monthly";
            installment_type = 1;
          } else {
            period = "yearly";
            installment_type = 2;
          }

          if (total_member_number == "M") {
            sum_insured = 1500000;
            premium = 120000;
            last_expense_insured = 1000000;
            members = "other";

            if (paymentOption == 1) {
              premium = 10000;
              yearly_premium = 240000;
              last_expense_insured = 1000000;
            }
          } else if (total_member_number == "M+1") {
            sum_insured = 1500000;
            premium = 240000;
            last_expense_insured = 1000000;
            members = "You and 1 dependent";
            if (paymentOption == 1) {
              premium = 20000;
              yearly_premium = 240000;
              last_expense_insured = 1000000;
            }
          } else if (total_member_number == "M+2") {
            sum_insured = 1500000;
            premium = 360000;
            last_expense_insured = 1000000;
            members = "You and 2 dependent";

            if (paymentOption == 1) {
              premium = 30000;
              yearly_premium = 360000;
              last_expense_insured = 1000000;
            }
          } else if (total_member_number == "M+3") {
            sum_insured = 1500000;
            premium = 480000;
            last_expense_insured = 1000000;
            members = "You and 3 dependent";

            if (paymentOption == 1) {
              premium = 40000;
              yearly_premium = 480000;
              last_expense_insured = 1000000;
            }
          } else if (total_member_number == "M+4") {
            sum_insured = 1500000;
            premium = 600000;
            last_expense_insured = 1000000;
            members = "You and 4 dependent";

            if (paymentOption == 1) {
              period = "monthly";
              premium = 50000;
              yearly_premium = 600000;
              last_expense_insured = 1000000;
            }
          } else if (total_member_number == "M+5") {
            sum_insured = 1500000;
            premium = 720000;
            last_expense_insured = 1000000;
            members = "You and 5 dependent";

            if (paymentOption == 1) {
              period = "monthly";
              premium = 60000;
              yearly_premium = 7200000;
              last_expense_insured = 1000000;
            }
          } else if (total_member_number == "M+6") {
            sum_insured = 1500000;
            premium = 840000;
            last_expense_insured = 1000000;
            members = "You and 6 dependent";

            if (paymentOption == 1) {
              period = "monthly";
              premium = 70000;
              yearly_premium = 840000;
              last_expense_insured = 1000000;
            }
          } else {
            sum_insured = 1500000;
            premium = 240000;
            last_expense_insured = 1000000;

            members = "You";

            if (paymentOption == 1) {
              period = "monthly";
              premium = 20000;
              yearly_premium = 240000;
              last_expense_insured = 1000000;
            }
          }
        } else if (coverType == "MIDI") {
          si = "3M";
          lei = "1.5M";
          if (paymentOption == 1) {
            period = "monthly";
            installment_type = 1;
          } else {
            period = "yearly";
            installment_type = 2;
          }

          if (total_member_number == "M") {
            sum_insured = 3000000;
            premium = 167000;
            last_expense_insured = 1500000;
            members = "other";

            if (paymentOption == 1) {
              premium = 14000;
              yearly_premium = 167000;
              last_expense_insured = 1500000;
            }
          } else if (total_member_number == "M+1") {
            sum_insured = 3000000;
            premium = 322000;
            last_expense_insured = 1500000;
            members = "You and 1 dependent";

            if (paymentOption == 1) {
              premium = 28000;
              yearly_premium = 322000;
              last_expense_insured = 1500000;
            }
          } else if (total_member_number == "M+2") {
            sum_insured = 3000000;
            premium = 467000;
            last_expense_insured = 1500000;
            members = "You and 2 dependent";

            if (paymentOption == 1) {
              premium = 40000;
              yearly_premium = 467000;
              last_expense_insured = 1500000;
            }
          } else if (total_member_number == "M+3") {
            sum_insured = 3000000;
            premium = 590000;
            last_expense_insured = 1500000;
            members = "You and 3 dependent";

            if (paymentOption == 1) {
              premium = 50000;
              yearly_premium = 590000;
              last_expense_insured = 1500000;
            }
          } else if (total_member_number == "M+4") {
            sum_insured = 3000000;
            premium = 720000;
            last_expense_insured = 1500000;
            members = "You and 4 dependent";

            if (paymentOption == 1) {
              period = "monthly";
              premium = 63000;
              yearly_premium = 720000;
              last_expense_insured = 1500000;
            }
          } else if (total_member_number == "M+5") {
            sum_insured = 3000000;
            premium = 860000;
            last_expense_insured = 1500000;
            members = "You and 5 dependent";

            if (paymentOption == 1) {
              period = "monthly";
              premium = 75000;
              yearly_premium = 860000;
              last_expense_insured = 1500000;
            }
          } else if (total_member_number == "M+6") {
            sum_insured = 3000000;
            premium = 1010000;
            last_expense_insured = 1500000;
            members = "You and 6 dependent";

            if (paymentOption == 1) {
              period = "monthly";
              premium = 88000;
              yearly_premium = 1010000;
              last_expense_insured = 1500000;
            }
          } else {
            sum_insured = 3000000;
            premium = 322000;
            last_expense_insured = 1500000;
            members = "You";

            if (paymentOption == 1) {
              premium = 28000;
              yearly_premium = 322000;
              last_expense_insured = 1500000;
            }
          }
        } else if (coverType == "BIGGIE") {
          si = "5M";
          lei = "2M";
          if (paymentOption == 1) {
            period = "monthly";
            installment_type = 1;
          } else {
            period = "yearly";
            installment_type = 2;
          }

          if (total_member_number == "M") {
            sum_insured = 5000000;
            premium = 208000;
            last_expense_insured = 2000000;
            members = "other";

            if (paymentOption == 1) {
              premium = 18000;
              yearly_premium = 208000;
              last_expense_insured = 2000000;
            }
          } else if (total_member_number == "M+1") {
            sum_insured = 5000000;
            premium = 400000;
            last_expense_insured = 2000000;
            members = "You and 1 dependent";

            if (paymentOption == 1) {
              premium = 35000;
              yearly_premium = 400000;
              last_expense_insured = 2000000;
            }
          } else if (total_member_number == "M+2") {
            sum_insured = 5000000;
            premium = 577000;
            last_expense_insured = 2000000;
            members = "You and 2 dependent";

            if (paymentOption == 1) {
              period = "monthly";
              premium = 50000;
              yearly_premium = 577000;
              last_expense_insured = 2000000;
            }
          } else if (total_member_number == "M+3") {
            sum_insured = 5000000;
            premium = 740000;
            last_expense_insured = 2000000;
            members = "You and 3 dependent";

            if (paymentOption == 1) {
              premium = 65000;
              yearly_premium = 740000;
              last_expense_insured = 2000000;
            }
          } else if (total_member_number == "M+4") {
            sum_insured = 5000000;
            premium = 885000;
            last_expense_insured = 2000000;
            members = "You and 4 dependent";

            if (paymentOption == 1) {
              premium = 77000;
              yearly_premium = 885000;
              last_expense_insured = 2000000;
            }
          } else if (total_member_number == "M+5") {
            sum_insured = 5000000;
            premium = 1060000;
            last_expense_insured = 2000000;
            members = "You and 5 dependent";

            if (paymentOption == 1) {
              period = "monthly";
              premium = 93000;
              yearly_premium = 1060000;
              last_expense_insured = 2000000;
            }
          } else if (total_member_number == "M+6") {
            sum_insured = 5000000;
            premium = 1238000;
            last_expense_insured = 2000000;

            if (paymentOption == 1) {
              period = "monthly";
              premium = 108000;
              yearly_premium = 1238000;
              last_expense_insured = 2000000;
            }
          } else {
            sum_insured = 5000000;
            premium = 400000;
            last_expense_insured = 2000000;
            members = "You";

            if (paymentOption == 1) {
              period = "monthly";

              premium = 35000;
              yearly_premium = 400000;
              last_expense_insured = 2000000;
            }
          }
        } else {
          menu.end("Invalid option");
        }

        let policy_end_date = new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        );
        // minus 1 day
        policy_end_date.setDate(policy_end_date.getDate() - 1);

        await Policy.update(
          {
            policy_type: policy_type,
            policy_deduction_amount: premium,
            policy_pending_premium: premium,
            sum_insured: sum_insured,
            premium: premium,
            installment_type: installment_type,
            installment_order: 1,
            last_expense_insured: last_expense_insured,
            policy_start_date: new Date(),
            policy_end_date: policy_end_date,
            first_name: userKyc.first_name,
            last_name: userKyc.last_name,
            phone_number: phone_number,

          },
          { where: { user_id: user_id } }
        );

        let paymentStatus = await airtelMoney(
          user_id,
          partner_id,
          policy_id,
          phone_number,
          premium,
          membership_id,
          "UG",
          "UGX"
        );
        //let paymentStatus =  await initiateConsent(newPolicy.policy_type,newPolicy.policy_start_date, newPolicy.policy_end_date, phone_number, newPolicy.policy_deduction_amount , newPolicy.premium)

        let members_covered: string,
          congratSms: string,
          congratText: string,
          frequency: string = "monthly";
        if (paymentOption == 1) {
          frequency = "month";
        } else {
          frequency = "year";
        }
        if (beneficiary == "FAMILY") {
          members_covered = "Your family";
          congratSms = `Congratulations! Your family is now covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                  Cover valid till ${policy_end_date.toDateString()}.`;
          congratText = `Congratulations! ${members} are each covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                   Cover valid till ${policy_end_date.toDateString()} `;
        } else if (beneficiary == "OTHERS") {
          members_covered = members;
          congratSms = `Congratulations! You have bought cover for ${otherMember?.name.toUpperCase()} for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                  Cover valid till ${policy_end_date.toDateString()}.  `;
          congratText = `Congratulations! You have  bought Mini cover for ${otherMember?.name.toUpperCase()} . 
                  Pay UGX ${premium} every ${frequency} to stay covered`;
        } else {
          members_covered = "You";
          congratSms = `Congratulations! You are now covered for Inpatient benefit of UGX ${si} and Funeral benefit of UGX ${lei}.
                  Cover valid till ${policy_end_date.toDateString()}`;
          congratText = `Congratulations! You bought Mini cover for Inpatient (UGX ${si}) and Funeral (UGX ${lei}) for a year. 
                  Pay UGX ${premium} every ${frequency} to stay covered`;
        }

        console.log("PAYMENT STATUS", paymentStatus);
        if (paymentStatus.code === 200) {
          await User.update({
            cover_type: null,
            total_member_number: null,
          });

          await sendSMS(phone_number, congratSms);

          menu.end(congratText);
        } else {
          menu.end(`Sorry, your payment was not successful. 
                      \n0. Back \n00. Main Menu`);
        }
      } catch (error) {
        console.error("Confirmation Error:", error);
        menu.end("An error occurred. Please try again later.");
      }
    },
  });


}