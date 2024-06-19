import SMSMessenger from "../../services/sendSMS";
import { v4 as uuidv4 } from 'uuid';
import { calculatePaymentOptions, generateNextMembershipId, parseAmount } from "../../services/utils";
import { getAirtelUser } from "../../services/getAirtelUserKyc";
import { airtelMoney, airtelMoneyKenya } from "../../services/payment";
import moment from "moment";

const othersMenu = async (args, db) => {
  let { msisdn, response, currentStep, userText, allSteps } = args;

  const FamilyCover = db.family_covers;
  const Packages = db.packages;
  const PaymentOption = db.payment_options;

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
      yearly_premium: '3,294',
      last_expense_insured: '',
      inpatient_cover: 400000,
      outpatient_cover: 0,
      hospital_cash: 100000,
      maternity: 0,
      packages: [
        {
          name: 'Bamba',
          code_name: 'M',
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
          code_name: 'M',
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
          code_name: 'M',
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
          code_name: 'M+1',
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
          code_name: 'M+1',
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
          code_name: 'M+2',
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
          code_name: 'M+2',
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
          code_name: 'M+3',
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
          code_name: 'M+3',
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
          code_name: 'M+4',
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
          code_name: 'M+4',
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
          code_name: 'M+5',
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
          code_name: 'M+5',
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
          code_name: 'M+6',
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
          code_name: 'M+6',
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

  if (currentStep == 2) {
    let coversList = covers.map((cover, index) => {
      return `\n${index + 1}. ${cover.name}`
    }).join("")

    response = "CON " + coversList + "\n0. Back";
  }
  else if (currentStep == 3) {
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
  else if (currentStep == 4) {
    response = "CON Enter atleast Name of Other or 1 child\n"
  }
  else if (currentStep == 5) {
    response = "CON Enter Phone number for Other e.g 0712345678\n"
  }
  else if (currentStep == 6) {
    let otherName = allSteps[3];
    let otherPhone = allSteps[4];
    let coverType = allSteps[3];

    let selectedCover = covers[parseInt(allSteps[2]) - 1];
    console.log("SELECTED COVER", selectedCover);

    let selectedCoverPackage = selectedCover.packages[coverType - 1];

    console.log("SELECTED COVER PACKAGE", selectedCoverPackage);

    otherUser = await db.users.findOne({
      where: {
        phone_number: allSteps[5].replace('0', ""),
      },
      limit: 1,
    });


    response = `CON Inpatient cover for ${otherPhone} ${otherName}, Kshs ${selectedCoverPackage.inpatient_cover} a year` +
      "\nPAY " +
      `\n1 Kshs ${selectedCoverPackage.premium} monthly` +
      `\n2 Kshs ${selectedCoverPackage.yearly_premium} yearly` + "\n0. Back \n00. Main Menu";
  }
  else if (currentStep == 7) {
    const selectedCover = covers[parseInt(allSteps[2]) - 1];
    let paymentOption = parseInt(userText);
    let period = paymentOption == 1 ? "monthly" : "yearly";
    let coverType = allSteps[3];
    console.log("COVER TYPE", coverType);
    //console.log("SELECTED COVER", selectedCover);
    let selectedCoverPackage = selectedCover.packages[coverType - 1];
    //console.log("SELECTED COVER PACKAGE", selectedCoverPackage);
    let ultimatePremium = paymentOption == 1 ? selectedCoverPackage.premium : selectedCoverPackage.yearly_premium;

    let selectedPolicyType = covers[parseInt(allSteps[1]) - 1];
    //console.log("POLICY TYPE USERTEXT 1", selectedPolicyType)


    let fullPhone = !msisdn?.startsWith('+') ? `+${msisdn}` : msisdn;

    if (!existingUser) {

      //let user = await getAirtelUser(msisdn, 1)
      let membershipId = Math.floor(100000 + Math.random() * 900000);

      existingUser = await db.users.create({
        user_id: uuidv4(),
        phone_number: phone,
        membership_id: generateNextMembershipId(),
        total_member_number: selectedPolicyType.code_name,
        partner_id: 1,
        role: "user",
        nationality: "KENYA",
        unique_profile_id: await generateNextMembershipId(),
      });
      const message = `Dear Customer, welcome to AfyaShua Care. Membership ID: ${membershipId} Dial *334*7*3# to access your account.`;
      await SMSMessenger.sendSMS(3, fullPhone, message);

    }


    response = `CON Kshs ${ultimatePremium} ${period}.` +
      `\nTerms and Conditions - www.airtel.com` +
      `\nConfirm to Agree and Pay\n Age 0 - 65 Years ` +
      "\n1. Confirm \n0. Back";
  }
  else if (currentStep == 8) {


    if (userText == "1") {

      response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'
      console.log("=============== END SCREEN USSD RESPONCE WAS CALLED KENYA  =======", moment().toDate());
      //console.log("otherUser", otherUser);

      let selectedPolicyType = covers[parseInt(allSteps[2]) - 1];
      console.log("SELECTED POLICY TYPE", selectedPolicyType);
      let fullPhone = !msisdn?.startsWith('+') ? `+${msisdn}` : msisdn;
      response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment.'

      let paymentOption = parseInt(allSteps[6]);
      let installment_type = paymentOption == 1 ? 2 : 1;
      let installment_order = 1


      // let installment_next_month_date = new Date(moment().toDate().getFullYear(), moment().toDate().getMonth() + 1, moment().toDate().getDate() - 1)

      let policyType = selectedPolicyType.packages[parseInt(allSteps[3]) - 1];
      console.log("POLICY TYPE USERTEXT 1", policyType)
      let ultimatePremium = paymentOption == 1 ? policyType.premium : policyType.yearly_premium;
      //console.log("ULTIMATE PREMIUM", ultimatePremium)



      //console.log("OTHER USER", otherUser, allSteps[4].replace('0', ""))
      if (!otherUser) {
        let otherPhone = allSteps[5].replace('0', "");

        let otherData = {
          user_id: uuidv4(),
          phone_number: otherPhone,
          membership_id: Math.floor(100000 + Math.random() * 900000),
          unique_profile_id: await generateNextMembershipId(),
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

        const pendingPolicy = await db.policies.findOne({
          where: {
            user_id: existingUser.user_id,
            policy_status: "pending",
            premium: parseAmount(ultimatePremium),
            bought_for: otherUser.user_id,
            policy_type: policyType.name.toUpperCase(),
          },
          limit: 1,
        });

        let policy;

        if (!pendingPolicy) {
          policy = await db.policies.create(policyObject);
        } else {
          // Delete existing pending policy before creating a new one
          await pendingPolicy.destroy();
          policy = await db.policies.create(policyObject);
        }

        const airtelMoneyResponse = airtelMoneyKenya(
          existingUser,
          policy

        );

        console.log("AIRTEL MONEY RESPONSE", airtelMoneyResponse);
      } catch (error) {
        //response = 'END Payment failed'; // Set an error response
        console.log("OTHER - RESPONSE WAS CALLED EER", error);
      }
      console.log("============== AFTER CATCH  TIME KENYA ================ ", moment().toDate());


    } else {
      response = "END Thank you for using AfyaShua Care"
    }
  }

  return response;

}

export default othersMenu;

