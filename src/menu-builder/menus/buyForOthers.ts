import sendSMS from "../../services/sendSMS";
import { airtelMoney, initiateConsent } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
const bcrypt = require("bcrypt");

export function buyForOthers(menu: any, args: any, db: any): void {
  const User = db.users;
  const Policy = db.policies;

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
    return await Policy.findOne({
      where: {
        user_id: user?.user_id,
        policy_status: 'paid',
      },
    });
  };

  const findPolicyByUser = async (user_id: any) => {
    let policies = await Policy.findAll({
      where: {
        user_id: user_id,
      },
    });

    return policies[policies.length - 1];
  }

  menu.state("buyForOthers", {
    run: () => {

      menu.con(
        "Buy for others " +
        "\n1. Other " +
        "\n2. Other + Spouse or Child" +
        "\n3. Other + Spouse + 1 Children" +
        "\n01. Next" +
        "\n0.Back" +
        "\n00.Main Menu"
      );
    },
    next: {
      "1": "buyForOthers.member",
      "2": "buyForOthers.member",
      "3": "buyForOthers.member",
      "01": "buyForOthers.next",
      "0": "account",
    },
  });

  menu.state("buyForOthers.next", {
    run: () => {
      menu.con(
        "Buy for others " +
        "\n4. Other + Spouse + 2 Children" +
        "\n5. Other + Spouse + 3 Children" +
        "\n6. Other + Spouse + 4 Children" +
        "\n7. Other + Spouse + 5 Children" +
        "\n0.Back" +
        "\n00.Main Menu"
      );
    },
    next: {
      "4": "buyForOthers.member",
      "5": "buyForOthers.member",
      "6": "buyForOthers.member",
      "7": "buyForOthers.member",
      "0": "buyForOthers",
      "00": "insurance",
    },
  });

  menu.state("buyForOthers.member", {
    run: async () => {
      let member_number = menu.val.toString();
      console.log("MEMBER NUMBER", member_number);
      if (member_number == "1") {
        member_number = "M";
      } else if (member_number == "2") {
        member_number = "M+1";
      } else if (member_number == "3") {
        member_number = "M+2";
      } else if (member_number == "4") {
        member_number = "M+3";
      } else if (member_number == "5") {
        member_number = "M+4";
      } else if (member_number == "6") {
        member_number = "M+5";
      } else if (member_number == "7") {
        member_number = "M+6";
      } else {
        menu.end("Invalid option");
      }

      let existingUser = await findUserByPhoneNumber(args.phoneNumber);
      menu.session.set('user', existingUser)
      //let existingUser = await menu.session.get('user')

      console.log("USER DATA SESSION", existingUser);
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
          nationality: "UGANDA"
        });
      }
      if (member_number == "M") {
        menu.con(
          "Buy for Other" +
          "\n1. Mini UGX 10,000" +
          "\n2. Midi  UGX 14,000" +
          "\n3. Biggie UGX 18,000" +
          "\n0.Back" +
          "\n00.Main Menu"
        );
      } else if (member_number == "M+1") {
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
        menu.end("Invalid option");
      }
    },
    next: {
      "*\\d+": "buyForOthers.coverType",
      "0": "account",
      "00": "insurance",
    },
  });

  //ask for phone number and name of person to buy for
  menu.state("buyForOthers.coverType", {
    run: async () => {
      let coverType = menu.val.toString();
      console.log("COVER TYPE", coverType);

      let existingUser = await menu.session.get('user')

      console.log("USER DATA SESSION", existingUser);
      let { user_id, partner_id, total_member_number } = existingUser
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
        user_id: user_id,
        policy_id: uuidv4(),
        policy_type: coverType,
        beneficiary: "OTHERS",
        policy_status: "pending",
        policy_start_date: new Date(),
        policy_end_date: new Date(
          date.getFullYear() + 1,
          date.getMonth(),
          day
        ),
        policy_deduction_day: day * 1,
        partner_id: partner_id,
        country_code: "UGA",
        currency_code: "UGX",
        product_id: "d18424d6-5316-4e12-9826-302b866a380c",
      });


      console.log("TOTAL MEMBER NUMBER", total_member_number);

      menu.con(
        "\nEnter atleast Name of spouse or 1 child" +
        "\n0.Back" +
        "\n00.Main Menu"
      );
    },
    next: {
      "*[a-zA-Z]+": "buyForOthersName",
    },
  });

  menu.state("buyForOthersName", {
    run: async () => {
      let name = menu.val;
      console.log("NAME", name);

      menu.con("Enter Phone number for Other");
    },
    next: {
      "*\\d+": "buyForOthersPhoneNumber",
    },
  });

  menu.state("buyForOthersPhoneNumber", {
    run: async () => {
      let otherPhone = menu.val;
      console.log("SPOUSE Phone", otherPhone);

      let existingUser = await menu.session.get('user')

      console.log("USER DATA SESSION", existingUser);


      //uganda phone number validation

      if (otherPhone.charAt(0) == "0") {
        otherPhone = otherPhone.substring(1);
      }
      if (otherPhone.charAt(0) == "+") {
        otherPhone = otherPhone.substring(1);
      }

      if (otherPhone.charAt(0) == "256") {
        otherPhone = otherPhone.substring(3);
      }

      if (otherPhone.length != 9) {
        menu.con("Invalid Phone Number, please try again");
        return;
      }

      // second last input text
      let otherName =
        menu.args.text.split("*")[menu.args.text.split("*").length - 2];

      let uniqueId = uuidv4();
      const newUser = await User.create({
        user_id: uniqueId,
        name: otherName,
        first_name: otherName.split(" ")[0],
        middle_name: otherName.split(" ")[1],
        last_name: otherName.split(" ")[2] || otherName.split(" ")[1],
        password: await bcrypt.hash(`${otherName}`, 10),
        createdAt: new Date(),
        membership_id: Math.floor(100000 + Math.random() * 900000),
        pin: Math.floor(1000 + Math.random() * 9000),
        nationality: "UGANDA",
        phone_number: otherPhone,
        role: "user",
        partner_id: existingUser.partner_id,

      });

      console.log("NEW USER", newUser);
      const message = `Dear ${newUser.first_name}, Welcome to Ddwaliro Care. Membership ID: ${newUser.membership_id}. Dial *187*7*6# to access your account.`;
      await sendSMS(otherPhone, message);

      let otherPolicy = await Policy.findOne({
        where: { user_id: existingUser?.user_id, beneficiary: "OTHERS" },
      });

      console.log("OTHER POLICY", otherPolicy);
      otherPolicy.bought_for = newUser.user_id;
      await otherPolicy.save();

      const {
        user_id,
        phone_number,
        first_name,
        last_name,
        total_member_number,
      } = newUser
      console.log(
        " ========= USER total_member_number========",
        total_member_number
      );

      const { policy_type, beneficiary, bought_for } = otherPolicy;

      console.log(
        " ========= USER policy_type========",
        policy_type,
        beneficiary,
        bought_for
      );

      let sum_insured: number,
        period: string,
        installment_type: number,
        si: string,
        premium: number = 0,
        yearly_premium: number = 0,
        last_expense_insured: number = 0,
        lei: string;
      let paymentOption = 1;

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
      "00": "insurance",
    },
  });

}