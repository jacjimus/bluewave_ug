import SMSMessenger from "../../services/sendSMS";
import { v4 as uuidv4 } from 'uuid';
import { calculatePaymentOptions, parseAmount } from "../../services/utils";
import { getAirtelUser } from "../../services/getAirtelUserKyc";
import { airtelMoney, airtelMoneyKenya } from "../../services/payment";
import { all } from "axios";

const othersMenu = async (args, db) => {
  let { msisdn, response, currentStep, userText, allSteps } = args;

  let phone = msisdn?.replace('+', "")?.substring(3);
  // console.log("SELECTED POLICY TYPE", selectedPolicyType);
  let existingUser = await db.users.findOne({
    where: {
      phone_number: phone,
      partner_id: 1,
    },
    limit: 1,
  });
  let otherUser: any;



  const covers = [
    {
      name: 'Other',
      code_name: 'M',
      sum_insured: '',
      premium: '300',
      yearly_premium: '',
      last_expense_insured: '',
      inpatient_cover: 400000,
      outpatient_cover: 0,
      hospital_cash: 100000,
      maternity: 0,
      packages: [
        {
          name: 'Bamba',
          sum_insured: '',
          sumInsured: 0,
          premium: '300',
          yearly_premium: '3,294',
          last_expense_insured: '',
          inpatient_cover: 0,
          outpatient_cover: 0,
          hospital_cash: 100000,
          maternity: 0,
          lastExpenseInsured: 0
        },
        {
          name: 'Zidi',
          sum_insured: '',
          sumInsured: 0,
          premium: '650',
          yearly_premium: '6,840',
          last_expense_insured: '',
          inpatient_cover: 0,
          outpatient_cover: 0,
          hospital_cash: 300000,
          maternity: 0,
          lastExpenseInsured: 0
        },
        {
          name: 'Smarta',
          sum_insured: '',
          sumInsured: 0,
          premium: '1,400',
          yearly_premium: '15,873',
          last_expense_insured: '',
          inpatient_cover: 0,
          outpatient_cover: 30000,
          hospital_cash: 400000,
          maternity: 0,
          lastExpenseInsured: 0

        }
      ]
    }, {

      name: 'Other+Spouse or Child',
      code_name: 'M+1',
      sum_insured: '',
      premium: '1,040',
      yearly_premium: '12,480',
      last_expense_insured: '',
      packages: [

        {
          name: 'Zidi',
          sum_insured: '',
          sumInsured: 0,
          premium: '1,040',
          yearly_premium: '10,944',
          last_expense_insured: '',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
        },
        {
          name: 'Smarta',
          sum_insured: '',
          sumInsured: 0,
          premium: '12,480',
          yearly_premium: '424,736 ',
          last_expense_insured: '',
          inpatient_cover: 400000,
          outpatient_cover: 30000,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
        }
      ]
    }, {
      name: 'Other+Spouse+1Child',
      code_name: 'M+2',
      sum_insured: '',
      premium: '1,300',
      yearly_premium: '2,800',
      last_expense_insured: '',
      packages: [

        {
          name: 'Zidi',
          sum_insured: '',
          premium: '1,300',
          yearly_premium: '13,680',
          last_expense_insured: '',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
        },
        {
          name: 'Smarta',
          sum_insured: '',
          sumInsured: 0,
          premium: '2,800',
          yearly_premium: '30,745',
          last_expense_insured: '',
          inpatient_cover: 400000,
          outpatient_cover: 30000,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
        }
      ]
    }, {
      name: 'Other+Spouse+2Children',
      code_name: 'M+3',
      sum_insured: '',
      premium: '2,800',
      yearly_premium: '3,156',
      last_expense_insured: '',
      packages: [

        {
          name: 'Zidi',
          sum_insured: '',
          sumInsured: 0,
          premium: '1,456',
          yearly_premium: '15,322',
          last_expense_insured: '',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
        },
        {
          name: 'Smarta',
          sum_insured: '',
          sumInsured: 0,
          premium: '3,136',
          yearly_premium: '35,211',
          last_expense_insured: '',
          inpatient_cover: 400000,
          outpatient_cover: 30000,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
        }
      ]
    }, {
      name: 'Other+Spouse+3Children',
      code_name: 'M+4',
      sum_insured: '',
      premium: '1,602',
      yearly_premium: '3,450',
      last_expense_insured: '',
      packages: [

        {
          name: 'Zidi',
          sum_insured: '',
          sumInsured: 0,
          premium: '1,602',
          yearly_premium: '16,854',
          last_expense_insured: '',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
        },
        {
          name: 'Smarta',
          sum_insured: '',
          sumInsured: 0,
          premium: '3,450',
          yearly_premium: '38,732',
          last_expense_insured: '',
          inpatient_cover: 400000,
          outpatient_cover: 30000,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
        }
      ]
    }, {
      name: 'Other+Spouse+4Children',
      code_name: 'M+5',
      sum_insured: '',
      premium: '1,730',
      yearly_premium: '3,726',
      last_expense_insured: '',
      packages: [

        {
          name: 'Zidi',
          sum_insured: '',
          sumInsured: 0,
          premium: '1,730',
          yearly_premium: '18,203',
          last_expense_insured: '',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
        },
        {
          name: 'Smarta',
          sum_insured: '',
          sumInsured: 0,
          premium: '3,726',
          yearly_premium: '41,831',
          last_expense_insured: '',
          inpatient_cover: 400000,
          outpatient_cover: 30000,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
        }
      ]
    }, {
      name: 'Other+Spouse+5Children',
      code_name: 'M+6',
      sum_insured: '',
      premium: '1,834',
      yearly_premium: '3,949',
      last_expense_insured: '',
      packages: [
        {
          name: 'Zidi',
          sum_insured: '',
          sumInsured: 0,
          premium: '1,834',
          yearly_premium: '19,295',
          last_expense_insured: '',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
        },
        {
          name: 'Smarta',
          sum_insured: '',
          sumInsured: 0,
          premium: '3,949',
          yearly_premium: '44,341',
          last_expense_insured: '',
          inpatient_cover: 400000,
          outpatient_cover: 30000,
          hospital_cash: 0,
          maternity: 100000,
          lastExpenseInsured: 0
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
      return `\n${index + 1}. ${cover.name} at Kshs ${cover.premium}`
    }).join("");

    response = "CON " + selectedCover.name + packages + "\n0. Back \n00. Main Menu";



  }
  else if (currentStep == 3) {
    response = "CON Enter atleast Name of Other or 1 child\n"
  }
  else if (currentStep == 4) {
    response = "CON Enter Phone number for Other e.g 0712345678\n"
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


    response = `CON Inpatient cover for ${otherPhone} ${otherName}, Kshs ${selectedCoverPackage.inpatient_cover} a year` +
      "\nPAY " +
      `\n1 Kshs ${selectedCoverPackage.premium} monthly` +
      `\n2 Kshs ${selectedCoverPackage.yearly_premium} yearly` + "\n0. Back \n00. Main Menu";
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


    let fullPhone = !msisdn?.startsWith('+') ? `+${msisdn}` : msisdn;

    if (!existingUser) {

      let user = await getAirtelUser(msisdn, 1)
      let membershipId = Math.floor(100000 + Math.random() * 900000);

      existingUser = await db.users.create({
        user_id: uuidv4(),
        phone_number: phone,
        membership_id: Math.floor(100000 + Math.random() * 900000),
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        total_member_number: selectedPolicyType.code_name,
        partner_id: 1,
        role: "user",
        nationality: "KENYA"
      });
      const message = `Dear ${user.first_name}, welcome to AfyaShua Care. Membership ID: ${membershipId} Dial *334*7*3# to access your account.`;
      await SMSMessenger.sendSMS(3, fullPhone, message);

    }


    response = `CON Kshs ${ultimatePremium} ${period}.` +
      `\nTerms&Conditions - www.airtel.com` +
      `\nConfirm to Agree and Pay \n Age 0 - 65 Years ` + "\n1. Confirm \n0. Back";
  }
  else if (currentStep == 7) {


    if (userText == "1") {

      response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'
      console.log("=============== END SCREEN USSD RESPONCE WAS CALLED KENYA  =======", new Date());
      //console.log("otherUser", otherUser);

      let selectedPolicyType = covers[parseInt(allSteps[1]) - 1];
      let fullPhone = !msisdn?.startsWith('+') ? `+${msisdn}` : msisdn;
      response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment.'

      let paymentOption = parseInt(allSteps[5]);
      let installment_type = paymentOption == 1 ? 2 : 1;
      let installment_order = 1


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
          partner_id: 1,
          nationality: "KENYA",
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
        policy_pending_premium: parseAmount(policyType.yearly_premium) - parseAmount(ultimatePremium),
        sum_insured: policyType.sumInsured,
        premium: parseAmount(ultimatePremium),
        yearly_premium: parseAmount(policyType.yearly_premium),
        last_expense_insured: policyType.lastExpenseInsured,
        membership_id: Math.floor(100000 + Math.random() * 900000),
        beneficiary: "OTHER",
        partner_id: 1,
        country_code: "KEN",
        currency_code: "KES",
        product_id: "e18424e6-5316-4f12-9826-302c866b380d",
        user_id: existingUser.user_id,
        phone_number: msisdn,
        total_member_number: selectedPolicyType.code_name,
        bought_for: otherUser.user_id,
        first_name: existingUser?.first_name,
        last_name: existingUser?.last_name,
        inpatient_cover: policyType.inpatient_cover,
        outpatient_cover: policyType.outpatient_cover,
        maternity_cover: policyType.maternity,
        hospital_cash: policyType.hospital_cash,
        policy_number: "BW" + msisdn?.replace('+', "")?.substring(3)
      }

      try {

        let policy = await db.policies.create(policyObject);

        const airtelMoneyPromise = airtelMoneyKenya(
          existingUser.user_id,
          policy.policy_id,
          phone,
          parseAmount(ultimatePremium),
          existingUser.membership_id,
          existingUser.partner_id
        );

        const timeout = 3000;

        Promise.race([
          airtelMoneyPromise,
          new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error('Airtel Money kenya operation timed out'));
            }, timeout);
          }),
        ]).then((result) => {
          console.log("============== END TIME - FAMIY KENYA  ================ ", msisdn, new Date());
          response = 'END Payment successful';
          console.log("OTHER - RESPONSE WAS CALLED", result);
          return response;
        })
          .catch((error) => {
            response = 'END Payment failed';
            console.log("OTHER - RESPONSE WAS CALLED EER", error);
            return response;
          })

        console.log("============== AFTER CATCH  TIME - FAMILY KENYA  ================ ", msisdn, new Date());
      } catch (error) {
        //response = 'END Payment failed'; // Set an error response
        console.log("OTHER - RESPONSE WAS CALLED EER", error);
      }
      console.log("============== AFTER CATCH  TIME KENYA ================ ", new Date());


    } else {
      response = "END Thank you for using AfyaShua Care"
    }
  }

  return response;

}

export default othersMenu;

