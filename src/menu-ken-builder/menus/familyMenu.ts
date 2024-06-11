import { airtelMoney, airtelMoneyKenya } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
import SMSMessenger from "../../services/sendSMS";
import { calculatePaymentOptions, generateNextMembershipId, parseAmount } from "../../services/utils";
import { getAirtelUser } from "../../services/getAirtelUserKyc";

const redisClient = require("../../middleware/redis");




require("dotenv").config();


const getSessionData = async (sessionid: string, key: string) => {
  try {
    const data = await redisClient.hget(sessionid, key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting session data for  key ${key}:`, error);
    return null;
  }
};

const setSessionData = async (sessionId: string, key: string, value: string | boolean, ttl = 180) => {
  try {
    await redisClient.hset(sessionId, key, JSON.stringify(value));
    await redisClient.expire(sessionId, ttl);
  } catch (error) {
    console.error(`Error setting session data for key ${key}:`, error);
  }
};




const familyMenu = async (args, db) => {
  let { msisdn, text, response,
    currentStep, previousStep, userText, allSteps
  } = args;
  console.log(" FAMILY ARGS", args)

  const Policy = db.policies;
  const Beneficiary = db.beneficiaries;
  const User = db.users;
  const FamilyCover = db.family_covers;
  const Packages = db.packages;
  const PaymentOption = db.payment_options;
  console.log("CURRENT STEP", currentStep)
  let phone = msisdn?.replace('+', "")?.substring(3);
  let existingUser = await db.users.findOne({
    where: {
      phone_number: phone,
      partner_id: 1,
    },
    limit: 1,
  });

  // family_cover_data for family
  // const family_cover_data = [
  //   {
  //     name: "Self+Spouse or Child",
  //     code_name: "M+1",
  //     packages: [
  //       {
  //         name: "Zidi",
  //         code_name: "ZIDI",
  //         premium: '1,040',
  //         sum_insured: '',
  //         sumInsured: 0,
  //         last_expense_insured: '',
  //         lastExpenseInsured: 0,
  //         year_premium: '10,944',
  //         inpatient_cover: 300000,
  //         outpatient_cover: 0,
  //         hospital_cash: 0,
  //         maternity: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '1,040',
  //             yearly_premium: '10,944',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '10,944',
  //             yearly_premium: '10,944',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       },
  //       {
  //         name: "Smarta",
  //         code_name: "SMARTA",
  //         premium: '2,240',
  //         sum_insured: '',
  //         sumInsured: 0,
  //         last_expense_insured: '',
  //         lastExpenseInsured: 0,
  //         year_premium: '24,736',
  //         inpatient_cover: 400000,
  //         outpatient_cover: 400000,
  //         hospital_cash: 0,
  //         maternity: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '2,240',
  //             yearly_premium: '24,736',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '24,736',
  //             yearly_premium: '24,736',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       }

  //     ],
  //   }, {
  //     name: "Self+Spouse+1 Child",
  //     code_name: "M+2",
  //     packages: [
  //       {
  //         name: "Zidi",
  //         code_name: "ZIDI",
  //         premium: '1,300',
  //         sum_insured: '',
  //         sumInsured: 0,
  //         last_expense_insured: '0',
  //         lastExpenseInsured: 0,
  //         year_premium: '13,680',
  //         inpatient_cover: 300000,
  //         outpatient_cover: 0,
  //         hospital_cash: 0,
  //         maternity: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '1,300',
  //             yearly_premium: '13,680',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '13,680',
  //             yearly_premium: '13,680',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       },
  //       {
  //         name: "Smarta",
  //         code_name: "SMARTA",
  //         premium: '2,800',
  //         sum_insured: '',
  //         sumInsured: 0,
  //         last_expense_insured: '',
  //         lastExpenseInsured: 0,
  //         year_premium: '30,745',
  //         inpatient_cover: 400000,
  //         outpatient_cover: 400000,
  //         hospital_cash: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '2,800',
  //             yearly_premium: '30,745',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '30,745',
  //             yearly_premium: '30,745',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       }

  //     ],
  //   },
  //   {
  //     name: "Self+Spouse+2 Children",
  //     code_name: "M+3",
  //     packages: [
  //       {
  //         name: "Zidi",
  //         code_name: "ZIDI",
  //         premium: '1.456',
  //         sum_insured: '',
  //         sumInsured: 0,
  //         last_expense_insured: '',
  //         lastExpenseInsured: 0,
  //         year_premium: '15,322',
  //         inpatient_cover: 300000,
  //         outpatient_cover: 0,
  //         hospital_cash: 0,
  //         maternity: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '1,456',
  //             yearly_premium: '15,322',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '15,322',
  //             yearly_premium: '15,322',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       },
  //       {
  //         name: "Smarta",
  //         code_name: "SMARTA",
  //         premium: '3,136',
  //         sum_insured: '',
  //         sumInsured: 0,
  //         last_expense_insured: '',
  //         lastExpenseInsured: 0,
  //         year_premium: '15,322',
  //         inpatient_cover: 400000,
  //         outpatient_cover: 400000,
  //         hospital_cash: 0,
  //         maternity: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '3,136',
  //             yearly_premium: '35,322',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '35,322',
  //             yearly_premium: '35,322',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       }

  //     ],
  //   }, {
  //     name: "Self+Spouse+3 Children",
  //     code_name: "M+4",
  //     packages: [
  //       {
  //         name: "Zidi",
  //         code_name: "ZIDI",
  //         premium: '1,602',
  //         sum_insured: '',
  //         sumInsured: 0,
  //         last_expense_insured: '',
  //         lastExpenseInsured: 0,
  //         year_premium: '16,854',
  //         inpatient_cover: 300000,
  //         outpatient_cover: 0,
  //         hospital_cash: 0,
  //         maternity: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '1,602',
  //             yearly_premium: '16,854',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '16,854',
  //             yearly_premium: '16,854',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       },
  //       {
  //         name: "Smarta",
  //         code_name: "SMARTA",
  //         premium: '3,450',
  //         sum_insured: '',
  //         sumInsured: 0,
  //         last_expense_insured: '',
  //         lastExpenseInsured: 0,
  //         year_premium: '38,732',
  //         inpatient_cover: 400000,
  //         outpatient_cover: 400000,
  //         hospital_cash: 0,
  //         maternity: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '3,450',
  //             yearly_premium: '38,732',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '38,732',
  //             yearly_premium: '38,732',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       },


  //     ],
  //   }, {
  //     name: "Self+Spouse+4 Children",
  //     code_name: "M+5",
  //     packages: [
  //       {
  //         name: "Zidi",
  //         code_name: "ZIDI",
  //         premium: '1,730',
  //         sum_insured: '',
  //         sumInsured: 0,
  //         last_expense_insured: '',
  //         lastExpenseInsured: 0,
  //         year_premium: '18,203',
  //         inpatient_cover: 300000,
  //         outpatient_cover: 0,
  //         hospital_cash: 0,
  //         maternity: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '1,730',
  //             yearly_premium: '18,203',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '18,203',
  //             yearly_premium: '18,203',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       },
  //       {
  //         name: "Smarta",
  //         code_name: "SMARTA",
  //         premium: '3,726',
  //         sum_insured: '',
  //         sumInsured: 0,
  //         last_expense_insured: '',
  //         lastExpenseInsured: 0,
  //         year_premium: '41,831',
  //         inpatient_cover: 0,
  //         outpatient_cover: 400000,
  //         hospital_cash: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '3,726',
  //             yearly_premium: '41,831',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '41,831',
  //             yearly_premium: '41,831',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       },


  //     ],
  //   }, {
  //     name: "Self+Spouse+5 Children",
  //     code_name: "M+6",
  //     packages: [
  //       {
  //         name: "Zidi",
  //         code_name: "ZIDI",
  //         premium: '1,834',
  //         sum_insured: '',
  //         sumInsured: 0,
  //         last_expense_insured: '',
  //         lastExpenseInsured: 0,
  //         year_premium: '19,259',
  //         inpatient_cover: 300000,
  //         outpatient_cover: 0,
  //         hospital_cash: 0,
  //         maternity: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '1,834',
  //             yearly_premium: '19,259',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '19,259',
  //             yearly_premium: '19,259',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       },
  //       {
  //         name: "Smarta",
  //         code_name: "SMARTA",
  //         premium: '3,949',
  //         sum_insured: '3M',
  //         sumInsured: 3000000,
  //         last_expense_insured: '1.5M',
  //         lastExpenseInsured: 1500000,
  //         year_premium: '44,341',
  //         inpatient_cover: 400000,
  //         outpatient_cover: 400000,
  //         hospital_cash: 0,
  //         maternity: 0,
  //         payment_options: [
  //           {
  //             name: 'Monthly',
  //             code_name: 'monthly',
  //             premium: '3,949',
  //             yearly_premium: '44,341',
  //             installment_type: 1,
  //             period: 'monthly'
  //           },
  //           {
  //             name: 'Yearly',
  //             code_name: 'yearly',
  //             premium: '44,341',
  //             yearly_premium: '44,341',
  //             installment_type: 2,
  //             period: 'yearly'
  //           }
  //         ]
  //       },


  //     ],
  //   }
  // ];


  // await setSessionData(sessionid, 'family_cover_data', family_cover_data);// Adjust the path as needed

  async function getPackagesWithDetails() {
    try {
      const query = `SELECT 
      fc.name AS family_cover_name,
      fc.code_name AS family_cover_code,
      p.name AS package_name,
      p.code_name AS package_code,
      p.premium,
      p.sum_insured,
      p.sumInsured,
      p.last_expense_insured,
      p.lastExpenseInsured,
      p.year_premium,
      p.inpatient_cover,
      p.outpatient_cover,
      p.hospital_cash,
      p.maternity,
      po.name AS payment_option_name,
      po.code_name AS payment_option_code,
      po.premium AS payment_option_premium,
      po.yearly_premium AS payment_option_yearly_premium,
      po.installment_type,
      po.period
  FROM 
      family_covers fc
  JOIN 
      packages p ON fc.id = p.family_cover_id
  JOIN 
      package_payment_options ppo ON p.id = ppo.package_id
  JOIN 
      payment_options po ON ppo.payment_option_id = po.id
  ORDER BY 
      fc.id, p.id, po.id;
  `

      const results = await db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT
      });

      //console.log("RESULTS", results)

      let family_cover_data = [];
      let currentFamilyCover = null;
      let currentPackage = null;

      for (let result of results) {
        if (!currentFamilyCover || currentFamilyCover.code_name !== result.family_cover_code) {
          currentFamilyCover = {
            name: result.family_cover_name,
            code_name: result.family_cover_code,
            packages: []
          };
          family_cover_data.push(currentFamilyCover);
        }

        if (!currentPackage || currentPackage.code_name !== result.package_code) {
          currentPackage = {
            name: result.package_name,
            code_name: result.package_code,
            premium: result.premium,
            sum_insured: result.sum_insured,
            sumInsured: result.sumInsured,
            last_expense_insured: result.last_expense_insured,
            lastExpenseInsured: result.lastExpenseInsured,
            year_premium: result.year_premium,
            inpatient_cover: result.inpatient_cover,
            outpatient_cover: result.outpatient_cover,
            hospital_cash: result.hospital_cash,
            maternity: result.maternity,
            payment_options: []
          };
          currentFamilyCover.packages.push(currentPackage);
        }

        currentPackage.payment_options.push({
          name: result.payment_option_name,
          code_name: result.payment_option_code,
          premium: result.payment_option_premium,
          yearly_premium: result.payment_option_yearly_premium,
          installment_type: result.installment_type,
          period: result.period
        });
      }
      //console.log("FORMARTED FAMILY COVER DATA", family_cover_data)
      return family_cover_data;

    } catch (error) {
      console.error('Error fetching packages with details:', error);
    }
  }


  let family_cover_data = await  getSessionData(msisdn, 'family_cover_data');
  if(!family_cover_data){

  family_cover_data = await getPackagesWithDetails();
  await setSessionData(msisdn, 'family_cover_data', family_cover_data);
  }


  if (currentStep == 2) {
    console.log("CURRENT STEP", currentStep)

    response = "CON " +
      "\n1. Self+Spouse or Child" +
      "\n2. Self+Spouse+1 Child" +
      "\n3. Self+Spouse+2 Children" +
      "\n4. Self+Spouse+3 Children" +
      "\n5. Self+Spouse+4 Children" +
      "\n6. Self+Spouse+5 Children" +
      "\n0. Back \n00. Main Menu";


  } else if (currentStep == 3) {
    const selectedCover = family_cover_data[parseInt(userText) - 1];

    console.log("SELECTED COVER", selectedCover)

    if (!selectedCover) {
      response = "END Invalid option" + "\n0. Back \n00. Main Menu";
      return response;
    }
    const packages = selectedCover.packages.map((coverType, index) => {
      return `\n${index + 1}. ${coverType.name} at KES ${coverType.premium}`
    }
    ).join("");


    response = "CON " + selectedCover.name + packages + "\n0. Back \n00. Main Menu";


  } else if (currentStep == 4) {

    response = "CON Enter atleast Full Name of spouse or 1 child \nAge 0 - 65 Years\n"

  } else if (currentStep == 5) {

    response = "CON Enter Phone of spouse (or Main member, if dependent is child) \n"
  } else if (currentStep == 6) {

    const selectedCover = family_cover_data[parseInt(allSteps[1]) - 1];
    const selectedPackage = selectedCover.packages[parseInt(allSteps[2]) - 1];
    let usermsisdn = msisdn?.replace('+', "")?.substring(3);

    console.log("SELECTED PACKAGE", selectedPackage)
    let coverText = `CON Inpatient cover for 0${usermsisdn}, ${selectedPackage.inpatient_cover} a year` +
      "\nPAY " +
      `\n1. Kshs ${selectedPackage?.payment_options[0].premium} monthly` +
      `\n2. Kshs ${selectedPackage?.payment_options[1].yearly_premium} yearly` + "\n0. Back \n00. Main Menu";

    response = coverText;

  } else if (currentStep == 7) {

    const selectedCover = family_cover_data[parseInt(allSteps[1]) - 1];
    const selectedPackage = selectedCover.packages[parseInt(allSteps[2]) - 1];
    let premium = selectedPackage?.payment_options[parseInt(userText) - 1].premium;
    let period = selectedPackage?.payment_options[parseInt(userText) - 1].period;
    let fullPhone = !msisdn?.startsWith('+') ? `+${msisdn}` : msisdn;

    let selectedPolicyType = family_cover_data[parseInt(allSteps[1]) - 1];

    const spouse = allSteps[3];

    let beneficiary = {
      beneficiary_id: uuidv4(),
      full_name: spouse,
      first_name: spouse?.split(" ")[0]?.toUpperCase(),
      middle_name: spouse?.split(" ")[1]?.toUpperCase(),
      last_name: spouse?.split(" ")[2]?.toUpperCase() || spouse.split(" ")[1]?.toUpperCase(),
      relationship: "SPOUSE",
      member_number: selectedPolicyType.code_name,
      principal_phone_number: msisdn,
      //user_id: existingUser.user_id,
    };
    // console.log("BENEFICIARY", beneficiary);

    await Beneficiary.create(beneficiary);


    console.log("EXISTING USER", existingUser?.name)

    if (!existingUser) {
      console.log("USER DOES NOT EXIST FAMILY KENYA ");
      let user = await getAirtelUser(msisdn, 2);

      let membership_id = generateNextMembershipId(),

        existingUser = await db.users.create({
          user_id: uuidv4(),
          phone_number: phone,
          membership_id: membership_id,
          first_name: user.first_name,
          last_name: user.last_name,
          name: `${user.first_name} ${user.last_name}`,
          total_member_number: selectedPolicyType.code_name,
          partner_id: 1,
          nationality: "KENYA"
        });
      console.log("USER DOES NOT EXIST", user);
      const message = `Dear ${existingUser.first_name}, welcome to AfyaShua Care. Membership ID: ${membership_id} Dial *334*7*3# to access your account.`;
      await SMSMessenger.sendSMS(3, fullPhone, message);

    }


    response = `CON Kshs ${premium} payable ${period}` +
      `\nTerms&Conditions - www.airtel.com` +
      `\nConfirm to Agree and Pay \n Age 0 - 65 Years` + "\n1. Confirm \n0. Back" + "\n00. Main Menu";
  } else if (currentStep == 8) {

    console.log("existingUser", existingUser)
    response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment';
    await processUserText(userText, allSteps, msisdn, family_cover_data, existingUser, db)
  }

  return response;
}



async function processUserText1(allSteps, msisdn, family_cover_data, existingUser, db) {
  console.log("=============== END SCREEN USSD RESPONSE - FAMILY KENYA =======", new Date());

  console.log("ALL STEPS", allSteps)

  let selectedPolicyType = family_cover_data[parseInt(allSteps[1]) - 1];
  console.log("SELECTED POLICY TYPE", selectedPolicyType)
  let selectedPackage = selectedPolicyType.packages[parseInt(allSteps[2]) - 1];
  console.log("SELECTED PACKAGE", selectedPackage)
  let ultimatePremium = parseAmount(selectedPackage.payment_options[parseInt(allSteps[6]) - 1].premium);
  console.log("ULTIMATE PREMIUM", ultimatePremium)

  let policyObject = createPolicyObject(selectedPackage, allSteps, family_cover_data, existingUser, msisdn, ultimatePremium);

  let pendingPolicy = await db.policies.findOne({
    where: {
      user_id: existingUser.user_id,
      policy_status: "pending",
      premium: ultimatePremium,
      policy_type: selectedPackage.name,
    }
  });

  let policy;

  if (!pendingPolicy) {
    policy = await createAndSavePolicy(policyObject, db);

  } else {
    // Delete existing pending policy before creating a new one
    await pendingPolicy.destroy();
    policy = await createAndSavePolicy(policyObject, db);

  }


  console.log("============== START TIME - FAMILY KENYA  ================ ", msisdn, new Date());

  const airtelMoneyResponse = airtelMoneyKenya(
    existingUser,
    policy

  );

  console.log("=========== PUSH TO AIRTEL MONEY ===========", airtelMoneyResponse, new Date());

  let response = await handleAirtelMoneyPromise(airtelMoneyResponse, msisdn);
  console.log("============== AFTER CATCH  TIME - FAMILY  KENYA ================ ", msisdn, new Date());

  return response;
}

function createPolicyObject(selectedPackage, allSteps, family_cover_data, existingUser, msisdn, ultimatePremium) {
  let selectedPolicyType = family_cover_data[parseInt(allSteps[1]) - 1];
  return {
    policy_id: uuidv4(),
    installment_type: parseInt(allSteps[5]) == 1 ? 2 : 1,
    installment_order: 1,
    policy_type: selectedPackage.code_name,
    policy_deduction_amount: ultimatePremium,
    policy_pending_premium: parseAmount(selectedPackage.year_premium) - ultimatePremium,
    sum_insured: selectedPackage.sumInsured,
    premium: ultimatePremium,
    yearly_premium: parseAmount(selectedPackage.year_premium),
    last_expense_insured: selectedPackage.lastExpenseInsured,
    membership_id: Math.floor(100000 + Math.random() * 900000),
    beneficiary: "FAMILY",
    partner_id: 1,
    country_code: "KEN",
    currency_code: "KES",
    product_id: "e18424e6-5316-4f12-9826-302c866b380d",
    user_id: existingUser.user_id,
    phone_number: msisdn,
    total_member_number: selectedPolicyType.code_name,
    first_name: existingUser?.first_name,
    last_name: existingUser?.last_name,
    inpatient_cover: selectedPackage.inpatient_cover,
    outpatient_cover: selectedPackage.outpatient_cover,
    maternity_cover: selectedPackage.maternity,
    hospital_cash: selectedPackage.hospital_cash,
    policy_number: "BW" + msisdn?.replace('+', "")?.substring(3)
  };
}

async function createAndSavePolicy(policyObject, db) {
  let policy = await db.policies.create(policyObject);
  return policy;
}

async function handleAirtelMoneyPromise(airtelMoneyPromise, msisdn) {
  const timeout = 1000;

  try {
    await Promise.race([
      airtelMoneyPromise,
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Airtel Money Kenya operation timed out'));
        }, timeout);
      }),
    ]);

    console.log("============== END TIME - FAMIY KENYA  ================ ", msisdn, new Date());
    return 'END Payment successful';
  } catch (error) {
    console.log("============== END TIME - FAMIY KENYA  ================ ", msisdn, new Date());
    return 'END Payment failed';
  }
}

async function processUserText2() {
  return 'END Thank you for using AfyaShua Care';
}

async function processUserText(userText, allSteps, msisdn, family_cover_data, existingUser, db) {
  if (userText == "1") {
    return processUserText1(allSteps, msisdn, family_cover_data, existingUser, db);
  } else {
    return processUserText2();
  }
}


export default familyMenu;



