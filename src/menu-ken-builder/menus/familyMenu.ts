import { airtelMoney } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
import sendSMS from "../../services/sendSMS";
import { calculatePaymentOptions, parseAmount } from "../../services/utils";
import { getAirtelUser } from "../../services/getAirtelUser"


const familyMenu = async (args, db) => {
  let { phoneNumber, text, response,
    currentStep, previousStep, userText, allSteps
  } = args;

  const Policy = db.policies;
  const Beneficiary = db.beneficiaries;
  const User = db.users;
  console.log("CURRENT STEP", currentStep)
  let phone = phoneNumber?.replace('+', "")?.substring(3);
  let existingUser = await db.users.findOne({
    where: {
      phone_number: phone,
    },
    limit: 1,
  });

  // covers for family
  const covers = [
    {
      name: "Self+Spouse or Child",
      code_name: "M+1",
      packages: [
        {
          name: "Zidi",
          code_name: "ZIDI",
          premium: '1,040',
          sum_insured: '',
          sumInsured: 0,
          last_expense_insured: '',
          lastExpenseInsured: 0,
          year_premium: '10,944',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '1,040',
              yearly_premium: '10,944',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '10,944',
              yearly_premium: '10,944',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Smarta",
          code_name: "SMARTA",
          premium: '2,240',
          sum_insured: '',
          sumInsured: 0,
          last_expense_insured: '',
          lastExpenseInsured: 0,
          year_premium: '24,736',
          inpatient_cover: 400000,
          outpatient_cover: 400000,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '2,240',
              yearly_premium: '24,736',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '24,736',
              yearly_premium: '24,736',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        }

      ],
    }, {
      name: "Self+Spouse+1 Child",
      code_name: "M+2",
      packages: [
        {
          name: "Zidi",
          code_name: "ZIDI",
          premium: '1,300',
          sum_insured: '',
          sumInsured: 0,
          last_expense_insured: '0',
          lastExpenseInsured: 0,
          year_premium: '13,680',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '1,300',
              yearly_premium: '13,680',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '13,680',
              yearly_premium: '13,680',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Smarta",
          code_name: "SMARTA",
          premium: '2,800',
          sum_insured: '',
          sumInsured: 0,
          last_expense_insured: '',
          lastExpenseInsured: 0,
          year_premium: '30,745',
          inpatient_cover: 400000,
          outpatient_cover: 400000,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '2,800',
              yearly_premium: '30,745',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '30,745',
              yearly_premium: '30,745',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        }

      ],
    },
    {
      name: "Self+Spouse+2 Children",
      code_name: "M+3",
      packages: [
        {
          name: "Zidi",
          code_name: "ZIDI",
          premium: '1.456',
          sum_insured: '',
          sumInsured: 0,
          last_expense_insured: '',
          lastExpenseInsured: 0,
          year_premium: '15,322',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '1,456',
              yearly_premium: '15,322',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '15,322',
              yearly_premium: '15,322',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Smarta",
          code_name: "SMARTA",
          premium: '3,136',
          sum_insured: '',
          sumInsured: 0,
          last_expense_insured: '',
          lastExpenseInsured: 0,
          year_premium: '15,322',
          inpatient_cover: 400000,
          outpatient_cover: 400000,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '3,136',
              yearly_premium: '35,322',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '35,322',
              yearly_premium: '35,322',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        }

      ],
    }, {
      name: "Self+Spouse+3 Children",
      code_name: "M+4",
      packages: [
        {
          name: "Zidi",
          code_name: "ZIDI",
          premium: '1,602',
          sum_insured: '',
          sumInsured: 0,
          last_expense_insured: '',
          lastExpenseInsured: 0,
          year_premium: '16,854',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '1,602',
              yearly_premium: '16,854',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '16,854',
              yearly_premium: '16,854',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Smarta",
          code_name: "SMARTA",
          premium: '3,450',
          sum_insured: '',
          sumInsured: 0,
          last_expense_insured: '',
          lastExpenseInsured: 0,
          year_premium: '38,732',
          inpatient_cover: 400000,
          outpatient_cover: 400000,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '3,450',
              yearly_premium: '38,732',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '38,732',
              yearly_premium: '38,732',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
      

      ],
    }, {
      name: "Self+Spouse+4 Children",
      code_name: "M+5",
      packages: [
        {
          name: "Zidi",
          code_name: "ZIDI",
          premium: '1,730',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000,
          year_premium: '18,203',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '18,203',
              yearly_premium: '720,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '720,000',
              yearly_premium: '720,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Smarta",
          code_name: "SMARTA",
          premium: '3,726',
          sum_insured: '3M',
          sumInsured: 3000000,
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000,
          year_premium: '',
          inpatient_cover: 400000,
          outpatient_cover: 400000,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '75,000',
              yearly_premium: '860,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '860,000',
              yearly_premium: '860,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        

      ],
    }, {
      name: "Self+Spouse+5 Children",
      code_name: "M+6",
      packages: [
        {
          name: "Zidi",
          code_name: "ZIDI",
          premium: '70,000',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000,
          year_premium: '',
          inpatient_cover: 300000,
          outpatient_cover: 0,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '70,000',
              yearly_premium: '840,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '840,000',
              yearly_premium: '840,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Smarta",
          code_name: "SMARTA",
          premium: '88,000',
          sum_insured: '3M',
          sumInsured: 3000000,
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000,
          year_premium: '',
          inpatient_cover: 400000,
          outpatient_cover: 400000,
          hospital_cash: 0,
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '88,000',
              yearly_premium: '1,010,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '1,010,000',
              yearly_premium: '1,010,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
       

      ],
    }
  ];

  if (currentStep == 1) {
    // const coversList = covers.map((cover, index) => {
    //   return `\n${index + 1}. ${cover.name}`
    // }).join("");
    // response = "CON Buy for family " + coversList + "\n0. Back \n00. Main Menu";

    // create a raw menu with the cover types without looping
    response = "CON " +
      "\n1. Self+Spouse or Child" +
      "\n2. Self+Spouse+1 Child" +
      "\n3. Self+Spouse+2 Children" +
      "\n4. Self+Spouse+3 Children" +
      "\n5. Self+Spouse+4 Children" +
      "\n6. Self+Spouse+5 Children" +
      "\n0. Back \n00. Main Menu";
  }
  else if (currentStep == 2) {
    const selectedCover = covers[parseInt(userText) - 1];
    if (!selectedCover) {
      response = "END Invalid option" + "\n0. Back \n00. Main Menu";
      return response;
    }
    const packages = selectedCover.packages.map((coverType, index) => {
      return `\n${index + 1}. ${coverType.name} at UGX ${coverType.premium}`
    }
    ).join("");

    response = "CON " + selectedCover.name + packages + "\n0. Back \n00. Main Menu";


  }
  else if (currentStep == 3) {
    response = "CON Enter atleast Name of spouse or 1 child\n"
  }
  else if (currentStep == 4) {
    response = "CON Enter Phone of spouse (or Main member, if dependent is child)\n"
  }
  else if (currentStep == 5) {
    const selectedCover = covers[parseInt(allSteps[1]) - 1];
    //console.log("SELECTED COVER", selectedCover)
    const selectedPackage = selectedCover.packages[parseInt(allSteps[2]) - 1];
    // console.log("SELECTED PACKAGE", selectedPackage)
    let userPhoneNumber = phoneNumber?.replace('+', "")?.substring(3);
    let coverText = `CON Inpatient cover for 0${userPhoneNumber}, UGX ${selectedPackage.sum_insured} a year` +
      "\nPAY " +
      `\n1. UGX ${selectedPackage?.payment_options[0].premium} monthly` +
      `\n2. UGX ${selectedPackage?.payment_options[1].yearly_premium} yearly` + "\n0. Back \n00. Main Menu";
    response = coverText;
  }
  else if (currentStep == 6) {
    const selectedCover = covers[parseInt(allSteps[1]) - 1];
    const selectedPackage = selectedCover.packages[parseInt(allSteps[2]) - 1];
    let premium = selectedPackage?.payment_options[parseInt(userText) - 1].premium;
    let period = selectedPackage?.payment_options[parseInt(userText) - 1].period;
    let fullPhone = !phoneNumber?.startsWith('+') ? `+${phoneNumber}` : phoneNumber;

    let selectedPolicyType = covers[parseInt(allSteps[1]) - 1];

    const spouse = allSteps[3];

    let beneficiary = {
      beneficiary_id: uuidv4(),
      full_name: spouse,
      first_name: spouse?.split(" ")[0]?.toUpperCase(),
      middle_name: spouse?.split(" ")[1]?.toUpperCase(),
      last_name: spouse?.split(" ")[2]?.toUpperCase() || spouse.split(" ")[1]?.toUpperCase(),
      relationship: "SPOUSE",
      member_number: selectedPolicyType.code_name,
      principal_phone_number: phoneNumber,
      //user_id: existingUser.user_id,
    };
    // console.log("BENEFICIARY", beneficiary);

    await Beneficiary.create(beneficiary);

    if (!existingUser) {
      console.log("USER DOES NOT EXIST FAMILY");
      let user = await getAirtelUser(phoneNumber, "UG", "UGX", 2);
      let membershierId = Math.floor(100000 + Math.random() * 900000);
      existingUser = await db.users.create({
        user_id: uuidv4(),
        phone_number: phone,
        membership_id: membershierId,
        pin: Math.floor(1000 + Math.random() * 9000),
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        total_member_number: selectedPolicyType.code_name,
        partner_id: 2,
        nationality: "UGANDA"
      });
      console.log("USER DOES NOT EXIST", user);
      const message = `Dear ${existingUser.first_name}, welcome to Ddwaliro Care. Membership ID: ${membershierId} Dial *185*7*6# to access your account.`;
      await sendSMS(fullPhone, message);

    }

    response = `CON Pay UGX ${premium} ${period}` +
      `\nTerms&Conditions - https://rb.gy/g4hyk` +
      `\nConfirm to Agree and Pay` + "\n1. Confirm \n0. Back";
  }
  else if (currentStep == 7) {

    if (userText == "1") {
      // NOT WORK

      response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'
      console.log("=============== END SCREEN USSD RESPONCE - FAMILY =======", new Date());

      let selectedPolicyType = covers[parseInt(allSteps[1]) - 1];
      let selectedPackage = selectedPolicyType.packages[parseInt(allSteps[2]) - 1];
      let ultimatePremium = parseAmount(selectedPackage.payment_options[parseInt(allSteps[5]) - 1].premium);

      let policyObject = {
        policy_id: uuidv4(),
        installment_type: parseInt(allSteps[5]) == 1 ? 2 : 1,
        installment_order:  parseInt(allSteps[5])== 1 ? 0 : 1,
        policy_type: selectedPackage.code_name,
        policy_deduction_amount: ultimatePremium,
        policy_pending_premium: ultimatePremium,
        sum_insured: selectedPackage.sumInsured,
        premium: ultimatePremium,
        yearly_premium: parseAmount(selectedPackage.year_premium),
        last_expense_insured: selectedPackage.lastExpenseInsured,
        membership_id: Math.floor(100000 + Math.random() * 900000),
        beneficiary: "FAMILY",
        partner_id: 2,
        country_code: "UGA",
        currency_code: "UGX",
        product_id: "d18424d6-5316-4e12-9826-302b866a380c",
        user_id: existingUser.user_id,
        phone_number: phoneNumber,
        total_member_number: selectedPolicyType.code_name,
        first_name: existingUser?.first_name,
        last_name: existingUser?.last_name,
      }

      let policy = await db.policies.create(policyObject);

      console.log("============== START TIME - FAMILY ================ ",phoneNumber, new Date());

        const airtelMoneyPromise = airtelMoney(
          existingUser.user_id,
          2,
          policy.policy_id,
          phone,
          ultimatePremium,
          existingUser.membership_id,
          "UG",
          "UGX"
        );

        const timeout = 1000;

        Promise.race([
          airtelMoneyPromise,
          new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error('Airtel Money operation timed out'));
            }, timeout);
          }),
        ]).then((result) => {
          console.log("============== END TIME - FAMIY ================ ",phoneNumber, new Date());
          response = 'END Payment successful'; 
          console.log("RESPONSE WAS CALLED", result);
          return response;
        })
        .catch((error) => {
          response = 'END Payment failed'; 
          console.log("RESPONSE WAS CALLED EER", error);
          return response;
        })
        
        console.log("============== AFTER CATCH  TIME - FAMILY ================ ",phoneNumber, new Date());
        
      } else {
        response = "END Thank you for using Ddwaliro Care"
      }
    }
    
    return response;
  }
  
  export default familyMenu;




  
  
  //| ============== START TIME ================  2023-10-24T14:08:11.341Z
  
  //============== AFTER CATCH  TIME ================  2023-10-24T14:08:13.749Z
  
  // ============== END TIME ================  2023-10-24T14:08:13.750Z
  
  //   if (result === 'timeout') {
  //    // response = 'END Payment operation timed out';
  //     console.log("RESPONSE WAS CALLED", result);
  //   } else {
  //     // Airtel Money operation completed successfully
  //     //response = 'END Payment successful'; // Set your desired response here
  //     console.log("RESPONSE WAS CALLED", result);
  //   }

      // try {


      // let policy = await db.policies.create(policyObject);


      //  let airtelMoneyPromise=  await airtelMoney(
      //     existingUser.user_id,
      //     2,
      //     policy.policy_id,
      //     phone,
      //     ultimatePremium,
      //     existingUser.membership_id,
      //     "UG",
      //     "UGX"
      //   );



      // const result = await Promise.race([
      //   airtelMoneyPromise,
      //   new Promise((resolve) => {
      //     setTimeout(() => {
      //       resolve('timeout'); 
      //     }, 50000);
      //   }),
      // ]);

      //   if (result === 'timeout') {
      //    // response = 'END Payment operation timed out';
      //     console.log("RESPONSE WAS CALLED", result);
      //   } else {
      //     // Airtel Money operation completed successfully
      //     //response = 'END Payment successful'; // Set your desired response here
      //     console.log("RESPONSE WAS CALLED", result);
      //   }
      // } catch (error) {
      //   //response = 'END Payment failed'; // Set an error response
      //   console.log("RESPONSE WAS CALLED EER", error);
      // }
