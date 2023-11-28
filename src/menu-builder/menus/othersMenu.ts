import SMSMessenger from "../../services/sendSMS";
import { v4 as uuidv4 } from 'uuid';
import { calculatePaymentOptions, parseAmount } from "../../services/utils";
import { getAirtelUser } from "../../services/getAirtelUser";
import { airtelMoney } from "../../services/payment";
import { all } from "axios";

const othersMenu = async (args, db) => {
  let { phoneNumber, response, currentStep, userText, allSteps } = args;

  let phone = phoneNumber?.replace('+', "")?.substring(3);
  // console.log("SELECTED POLICY TYPE", selectedPolicyType);
  let existingUser = await db.users.findOne({
    where: {
      phone_number: phone,
    },
    limit: 1,
  });
  let otherUser: any;
  const covers = [
    {
      name: 'Other',
      code_name: 'M',
      sum_insured: '1.5M',
      premium: '10,000',
      yearly_premium: '120,000',
      last_expense_insured: '1M',
      packages: [
        {
          name: 'Mini',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          premium: '10,000',
          yearly_premium: '120,000',
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000
        },
        {
          name: 'Midi',
          sum_insured: '3M',
          sumInsured: 3000000,
          premium: '14,000',
          yearly_premium: '167,000',
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000
        },
        {
          name: 'Biggie',
          sum_insured: '5M',
          sumInsured: 5000000,
          premium: '18,000',
          yearly_premium: '208,000',
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000
        }
      ]
    }, {
      name: 'Other+Spouse or Child',
      code_name: 'M+1',
      sum_insured: '3M',
      premium: '20,000',
      yearly_premium: '240,000',
      last_expense_insured: '2M',
      packages: [
        {
          name: 'Mini',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          premium: '20,000',
          yearly_premium: '240,000',
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000
        },
        {
          name: 'Midi',
          sum_insured: '3M',
          sumInsured: 3000000,
          premium: '28,000',
          yearly_premium: '322,000',
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000
        },
        {
          name: 'Biggie',
          sum_insured: '5M',
          sumInsured: 5000000,
          premium: '35,000',
          yearly_premium: '400,000',
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000
        }
      ]
    }, {
      name: 'Other+Spouse+1Child',
      code_name: 'M+2',
      sum_insured: '4M',
      premium: '30,000',
      yearly_premium: '360,000',
      last_expense_insured: '3M',
      packages: [
        {
          name: 'Mini',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          premium: '30,000',
          yearly_premium: '360,000',
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000

        },
        {
          name: 'Midi',
          sum_insured: '3M',
          premium: '40,000',
          yearly_premium: '467,000',
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000
        },
        {
          name: 'Biggie',
          sum_insured: '5M',
          sumInsured: 5000000,
          premium: '50,000',
          yearly_premium: '577,000',
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000
        }
      ]
    }, {
      name: 'Other+Spouse+2Children',
      code_name: 'M+3',
      sum_insured: '5M',
      premium: '40,000',
      yearly_premium: '480,000',
      last_expense_insured: '4M',
      packages: [
        {
          name: 'Mini',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          premium: '40,000',
          yearly_premium: '480,000',
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000
        },
        {
          name: 'Midi',
          sum_insured: '3M',
          sumInsured: 3000000,
          premium: '50,000',
          yearly_premium: '590,000',
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000
        },
        {
          name: 'Biggie',
          sum_insured: '5M',
          sumInsured: 5000000,
          premium: '65,000',
          yearly_premium: '740,000',
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000
        }
      ]
    }, {
      name: 'Other+Spouse+3Children',
      code_name: 'M+4',
      sum_insured: '6M',
      premium: '50,000',
      yearly_premium: '600,000',
      last_expense_insured: '5M',
      packages: [
        {
          name: 'Mini',
          sum_insured: '1.5M',
          sumInsured: 6000000,
          premium: '50,000',
          yearly_premium: '600,000',
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000
        },
        {
          name: 'Midi',
          sum_insured: '3M',
          sumInsured: 3000000,
          premium: '63,000',
          yearly_premium: '720,000',
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000
        },
        {
          name: 'Biggie',
          sum_insured: '5M',
          sumInsured: 5000000,
          premium: '77,000',
          yearly_premium: '885,000',
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000
        }
      ]
    }, {
      name: 'Other+Spouse+4Children',
      code_name: 'M+5',
      sum_insured: '7M',
      premium: '60,000',
      yearly_premium: '720,000',
      last_expense_insured: '6M',
      packages: [
        {
          name: 'Mini',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          premium: '60,000',
          yearly_premium: '720,000',
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000
        },
        {
          name: 'Midi',
          sum_insured: '3M',
          sumInsured: 3000000,
          premium: '75,000',
          yearly_premium: '860,000',
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000
        },
        {
          name: 'Biggie',
          sum_insured: '5M',
          sumInsured: 5000000,
          premium: '93,000',
          yearly_premium: '1060,000',
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000
        }
      ]
    }, {
      name: 'Other+Spouse+5Children',
      code_name: 'M+6',
      sum_insured: '8M',
      premium: '70,000',
      yearly_premium: '840,000',
      last_expense_insured: '7M',
      packages: [
        {
          name: 'Mini',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          premium: '70,000',
          yearly_premium: '840,000',
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000
        },
        {
          name: 'Midi',
          sum_insured: '3M',
          sumInsured: 3000000,
          premium: '88,000',
          yearly_premium: '1,010,000',
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000
        },
        {
          name: 'Biggie',
          sum_insured: '5M',
          sumInsured: 5000000,
          premium: '108,000',
          yearly_premium: '1,238,000',
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000
        }
      ]
    }
  ];

  if (currentStep == 1) {
    let coversList = covers.map((cover, index) => {
      return `\n${index + 1}. ${cover.name}`
    }).join("")

    response = "CON " + coversList + "\n0. Back";


  }
  else if (currentStep == 2) {
    let selectedCover = covers[parseInt(userText) - 1];
    if (!selectedCover) {
      response = "CON Invalid option" + "\n0. Back \n00. Main Menu";
      return response;
    }

    let packages = selectedCover.packages.map((cover, index) => {
      return `\n${index + 1}. ${cover.name} at UGX ${cover.premium}`
    }).join("");

    response = "CON " + selectedCover.name + packages + "\n0. Back \n00. Main Menu";



  }
  else if (currentStep == 3) {
    response = "CON Enter atleast Name of Other or 1 child\n"
  }
  else if (currentStep == 4) {
    response = "CON Enter Phone number for Other\n"
  }
  else if (currentStep == 5) {
    let otherName = allSteps[3];
    let otherPhone = allSteps[4];
    let coverType = allSteps[2];

    let selectedCover = covers[parseInt(allSteps[1]) - 1];
    let selectedCoverPackage = selectedCover.packages[coverType - 1];

    otherUser = await db.users.findOne({
      where: {
        phone_number: allSteps[4].replace('0', ""),
      },
      limit: 1,
    });

    response = `CON Inpatient cover for ${otherPhone} ${otherName}, UGX ${selectedCoverPackage.sum_insured} a year` +
      "\nPAY " +
      `\n1 UGX ${selectedCoverPackage.premium} monthly` +
      `\n2 UGX ${selectedCoverPackage.yearly_premium} yearly` + "\n0. Back \n00. Main Menu";
  }
  else if (currentStep == 6) {
    const selectedCover = covers[parseInt(allSteps[1]) - 1];
    let paymentOption = parseInt(userText);
    let period = paymentOption == 1 ? "monthly" : "yearly";
    let coverType = allSteps[2];
    console.log("COVER TYPE", coverType);
    //console.log("SELECTED COVER", selectedCover);
    let selectedCoverPackage = selectedCover.packages[coverType - 1];
    //console.log("SELECTED COVER PACKAGE", selectedCoverPackage);
    let ultimatePremium = paymentOption == 1 ? selectedCoverPackage.premium : selectedCoverPackage.yearly_premium;

    let selectedPolicyType = covers[parseInt(allSteps[1]) - 1];
    //console.log("POLICY TYPE USERTEXT 1", selectedPolicyType)


    let fullPhone = !phoneNumber?.startsWith('+') ? `+${phoneNumber}` : phoneNumber;

    if (!existingUser) {

      let user = await getAirtelUser(phoneNumber, "UG", "UGX", 2);
      let membershipId = Math.floor(100000 + Math.random() * 900000);

      existingUser = await db.users.create({
        user_id: uuidv4(),
        phone_number: phone,
        membership_id: Math.floor(100000 + Math.random() * 900000),
        pin: Math.floor(1000 + Math.random() * 9000),
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        total_member_number: selectedPolicyType.code_name,
        partner_id: 2,
        role: "user",
        nationality: "UGANDA"
      });
      const message = `Dear ${user.first_name}, welcome to Ddwaliro Care. Membership ID: ${membershipId} Dial *185*7*6# to access your account.`;
      await SMSMessenger.sendSMS(fullPhone, message);

    }


    response = `CON Pay UGX ${ultimatePremium} ${period}.` +
      `\nTerms&Conditions https://rb.gy/g4hyk` +
      `\nConfirm to Agree and Pay` + "\n1. Confirm \n0. Back";
  }
  else if (currentStep == 7) {


    if (userText == "1") {

      response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'
      console.log("=============== END SCREEN USSD RESPONCE WAS CALLED=======", new Date());
      //console.log("otherUser", otherUser);

      let selectedPolicyType = covers[parseInt(allSteps[1]) - 1];
      let fullPhone = !phoneNumber?.startsWith('+') ? `+${phoneNumber}` : phoneNumber;
      response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment.'

      let paymentOption = parseInt(allSteps[5]);
      let installment_type = paymentOption == 1 ? 2 : 1;
      let installment_order = paymentOption == 1 ? 0 : 1;


      // let installment_next_month_date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1)

      let policyType = selectedPolicyType.packages[parseInt(allSteps[2]) - 1];
      //console.log("POLICY TYPE USERTEXT 1", policyType)
      let ultimatePremium = paymentOption == 1 ? policyType.premium : policyType.yearly_premium;
      //console.log("ULTIMATE PREMIUM", ultimatePremium)



      //console.log("OTHER USER", otherUser, allSteps[4].replace('0', ""))
      if (!otherUser) {
        let otherPhone = allSteps[4].replace('0', "");

        let otherData = {
          user_id: uuidv4(),
          phone_number: otherPhone,
          membership_id: Math.floor(100000 + Math.random() * 900000),
          first_name: allSteps[3]?.split(" ")[0]?.toUpperCase(),
          middle_name: allSteps[3]?.split(" ")[1]?.toUpperCase(),
          last_name: allSteps[3]?.split(" ")[2]?.toUpperCase() ? allSteps[3]?.split(" ")[2]?.toUpperCase() : allSteps[3]?.split(" ")[1]?.toUpperCase(),
          name: `${allSteps[3]}`,
          total_member_number: selectedPolicyType.code_name,
          partner_id: 2,
          nationality: "UGANDA"
        }

        otherUser = await db.users.create(otherData);
        // console.log("OTHER USER CREATED", otherUser)
      }

      let policyObject = {
        policy_id: uuidv4(),
        installment_type,
        installment_order,
        policy_type: policyType.name.toUpperCase(),
        policy_deduction_amount: parseAmount(ultimatePremium),
        policy_pending_premium: parseAmount(ultimatePremium),
        sum_insured: policyType.sumInsured,
        premium: parseAmount(ultimatePremium),
        yearly_premium: parseAmount(policyType.yearly_premium),
        last_expense_insured: policyType.lastExpenseInsured,
        membership_id: Math.floor(100000 + Math.random() * 900000),
        beneficiary: "OTHER",
        partner_id: 2,
        country_code: "UGA",
        currency_code: "UGX",
        product_id: "d18424d6-5316-4e12-9826-302b866a380c",
        user_id: existingUser.user_id,
        phone_number: phoneNumber,
        total_member_number: selectedPolicyType.code_name,
        bought_for: otherUser.user_id,
        first_name: existingUser?.first_name,
        last_name: existingUser?.last_name,
      }

      try {

        let policy = await db.policies.create(policyObject);

        const airtelMoneyPromise = await airtelMoney(
          existingUser.user_id,
          2,
          policy.policy_id,
          phone,
          policy.policy_deduction_amount,
          existingUser.membership_id,
          "UG",
          "UGX"
        );

        console.log("============== START TIME ================ ", new Date());


        const timeout = 1000;

        Promise.race([
          airtelMoneyPromise,
          new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error('Airtel Money operation timed out'));
            }, timeout);
          })
        ])
          .then((result) => {
            // Airtel Money operation completed successfully
            response = 'END Payment successful'; // Set your desired response here
            console.log("RESPONSE WAS CALLED", result);
            return response;
          })
          .catch((error) => {
            console.log("An error occurred:", error);
            response = 'END Payment failed'; // Set an error response
            console.log("RESPONSE WAS CALLED", response);
            return response;
          });

      } catch (error) {
        //response = 'END Payment failed'; // Set an error response
        console.log("RESPONSE WAS CALLED EER", error);
      }
      console.log("============== AFTER CATCH  TIME ================ ", new Date());


    } else {
      response = "END Thank you for using Ddwaliro Care"
    }
  }

  return response;

}

export default othersMenu;

