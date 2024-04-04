import SMSMessenger from "../../services/sendSMS";
import { v4 as uuidv4 } from 'uuid';
import { calculatePaymentOptions, parseAmount } from "../../services/utils";
import { getAirtelUser } from "../../services/getAirtelUserKyc";
import { airtelMoney, processPayment } from "../../services/payment";


const othersMenu = async (args, db) => {
  let { phoneNumber, response, currentStep, userText, allSteps } = args;

  function replaceLeadingZero(phoneNumber) {
    if (phoneNumber.startsWith('07')) {
      return '' + phoneNumber.substring(1);
    } else {
      return phoneNumber;
    }
  }


  let phone = phoneNumber?.replace('+', "")?.substring(3);
  console.log("PHONE NUMBER", phone);
  let existingUser = await db.users.findOne({
    where: {
      phone_number: phone,
    },
    limit: 1,
  });
  let otherUser: any, existingOther: any, otherUserPhone: any;
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
          name: 'S Mini',
          sum_insured: '750,000',
          sumInsured: 750000,
          premium: '5,000',
          yearly_premium: '60,000',
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000
        },
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
          name: 'S Mini',
          sum_insured: '750,000',
          sumInsured: 1500000,
          premium: '10,000',
          yearly_premium: '120,000',
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000
        },
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
          name: 'S Mini',
          sum_insured: '750,000',
          sumInsured: 1500000,
          premium: '15,000',
          yearly_premium: '180,000',
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000
        },
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
          name: "S Mini",
          sum_insured: '750,000',
          sumInsured: 1500000,
          premium: '20,000',
          yearly_premium: '240,000',
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000
        },
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
          name: 'S Mini',
          sum_insured: '750,000',
          sumInsured: 1500000,
          premium: '25,000',
          yearly_premium: '300,000',
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000
        },
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
          name: 'S Mini',
          sum_insured: '750,000',
          sumInsured: 1500000,
          premium: '30,000',
          yearly_premium: '360,000',
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000
        },
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
          name: 'S Mini',
          sum_insured: '750,000',
          sumInsured: 1500000,
          premium: '35,000',
          yearly_premium: '420,000',
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000

        },
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

  } else if (currentStep == 2) {
    let selectedCover = covers[parseInt(userText) - 1];
    if (!selectedCover) {
      response = "CON Invalid option" + "\n0. Back \n00. Main Menu";
      return response;
    }

    let packages = selectedCover.packages.map((cover, index) => {
      return `\n${index + 1}. ${cover.name} at UGX ${cover.premium}`
    }).join("");

    response = "CON " + selectedCover.name + packages + "\n0. Back \n00. Main Menu";

  } else if (currentStep == 3) {
    response = "CON Enter atleast Full Name of Other or 1 child \n (Must be below 65 years) \n"

  } else if (currentStep == 4) {
    response = "CON Enter Phone number for Other e.g 07XXXXXXXX\n"

  } else if (currentStep == 5) {
    let otherName = allSteps[3];
    let otherPhone = allSteps[4];
    let coverType = allSteps[2];

    // IF NO NAME OR PHONE NUMBER
    if (otherPhone.length != 10) {
      response = "END Sorry Phone number for Other not valid e.g 07XXXXXXXX\n"
      return response;
    }
    if (otherPhone.substring(1) == phone) {
      response = "END Sorry you cannot buy for yourself\n"
      return response;
    }


    let selectedCover = covers[parseInt(allSteps[1]) - 1];
    let selectedCoverPackage = selectedCover.packages[coverType - 1];

    otherUser = await db.users.findOne({
      where: {
        phone_number: replaceLeadingZero(allSteps[4]),
      },
      limit: 1,
    });


    response = `CON Inpatient cover for ${allSteps[4]} ${otherName}, UGX ${selectedCoverPackage.sum_insured} a year` +
      "\nPAY " +
      `\n1 UGX ${selectedCoverPackage.premium} monthly` +
      `\n2 UGX ${selectedCoverPackage.yearly_premium} yearly` + "\n0. Back \n00. Main Menu";
  }
  else if (currentStep == 6) {
    const selectedCover = covers[parseInt(allSteps[1]) - 1];
    let paymentOption = parseInt(userText);
    let period = paymentOption == 1 ? "monthly" : "yearly";
    let coverType = allSteps[2];
    let selectedCoverPackage = selectedCover.packages[coverType - 1];
    let ultimatePremium = paymentOption == 1 ? selectedCoverPackage.premium : selectedCoverPackage.yearly_premium;

    otherUserPhone = allSteps[4].substring(1)

    existingOther = await db.users.findOne({
      where: {
        phone_number: otherUserPhone,
      },
      limit: 1,
    });

    if (!existingOther) {

      existingUser = await getAirtelUser(phoneNumber, 2);
      console.log("USER CREATED SELF", existingUser);

    }


    response = `CON Pay UGX ${ultimatePremium} ${period}.` +
      `\nTerms&Conditions https://rb.gy/g4hyk` +
      `\nConfirm to Agree and Pay \nAge 0 - 65 Years` + "\n1. Confirm \n0. Back";
  }
  else if (currentStep == 7) {

    if (userText == "1") {

      response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'
      console.log("=============== END SCREEN USSD RESPONCE WAS CALLED - OTHER =======", new Date());

      let selectedPolicyType = covers[parseInt(allSteps[1]) - 1];
      response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment.'

      let paymentOption = parseInt(allSteps[5]);


      let policyType = selectedPolicyType.packages[parseInt(allSteps[2]) - 1];
      let ultimatePremium = paymentOption == 1 ? policyType.premium : policyType.yearly_premium;

      otherUserPhone = replaceLeadingZero(allSteps[4])

      let policyNumber = "BW" + otherUserPhone.toString()

      existingOther = await db.users.findOne({
        where: {
          phone_number: otherUserPhone.toString(),
        },
        limit: 1,
      });

      let policyObject = {
        policy_id: uuidv4(),
        installment_type: paymentOption == 1 ? 2 : 1,
        installment_order: 1,
        policy_type: policyType.name.toUpperCase(),
        policy_deduction_amount: parseAmount(ultimatePremium),
        policy_pending_premium: parseAmount(policyType.yearly_premium) - parseAmount(ultimatePremium),
        sum_insured: policyType.sumInsured,
        premium: parseAmount(ultimatePremium),
        yearly_premium: parseAmount(policyType.yearly_premium),
        last_expense_insured: policyType.lastExpenseInsured,
        membership_id: existingOther.membership_id,
        beneficiary: "OTHER",
        partner_id: 2,
        country_code: "UGA",
        currency_code: "UGX",
        product_id: "d18424d6-5316-4e12-9826-302b866a380c",
        user_id: existingOther.user_id,
        phone_number: phoneNumber,
        total_member_number: selectedPolicyType.code_name,
        bought_for: existingUser.user_id,
        first_name: existingOther?.first_name,
        last_name: existingOther?.last_name,
        policy_number: policyNumber
        
      }

      await processPayment(policyObject, phone, existingOther)

      console.log("============== AFTER CATCH  TIME - OTHER ================ ", new Date());

    }
  }

  return response;


}

export default othersMenu;

