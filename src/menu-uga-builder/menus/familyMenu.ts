import { airtelMoney, createTransaction } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
import SMSMessenger from "../../services/sendSMS";
import { calculatePaymentOptions, parseAmount } from "../../services/utils";
import { getAirtelUser } from "../../services/getAirtelUserKyc";
import { Op } from 'sequelize';


const familyMenu = async (args, db) => {
  let { phoneNumber, text, response,
    currentStep, previousStep, userText, allSteps
  } = args;

  const Beneficiary = db.beneficiaries;
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
          name: "S Mini",
          code_name: "S MINI",
          premium: '10,000',
          sum_insured: '750,000',
          sumInsured: 750000,
          last_expense_insured: '500000',
          lastExpenseInsured: 500000,
          year_premium: '120,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '10,000',
              yearly_premium: '120,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '120,000',
              yearly_premium: '120,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Mini",
          code_name: "MINI",
          premium: '20,000',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000,
          year_premium: '240,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '20,000',
              yearly_premium: '240,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '240,000',
              yearly_premium: '240,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Midi",
          code_name: "MIDI",
          premium: '28,000',
          sum_insured: '3M',
          sumInsured: 3000000,
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000,
          year_premium: '322,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '28,000',
              yearly_premium: '322,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '322,000',
              yearly_premium: '322,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Biggie",
          code_name: "BIGGIE",
          premium: '35,000',
          sum_insured: '5M',
          sumInsured: 5000000,
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000,
          year_premium: '400,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '35,000',
              yearly_premium: '400,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '400,000',
              yearly_premium: '400,000',
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
          name: "S Mini",
          code_name: "S MINI",
          premium: '15,000',
          sum_insured: '750,000',
          sumInsured: 750000,
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000,
          year_premium: '180,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '15,000',
              yearly_premium: '180,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '180,000',
              yearly_premium: '180,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Mini",
          code_name: "MINI",
          premium: '30,000',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000,
          year_premium: '360,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '30,000',
              yearly_premium: '360,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '360,000',
              yearly_premium: '360,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Midi",
          code_name: "MIDI",
          premium: '40,000',
          sum_insured: '3M',
          sumInsured: 3000000,
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000,
          year_premium: '467,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '40,000',
              yearly_premium: '400,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '467,000',
              yearly_premium: '467,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Biggie",
          code_name: "BIGGIE",
          premium: '50,000',
          sum_insured: '5M',
          sumInsured: 5000000,
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000,
          year_premium: '577,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '50,000',
              yearly_premium: '577,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '577,000',
              yearly_premium: '577,000',
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
          name: "S Mini",
          code_name: "S MINI",
          premium: '20,000',
          sum_insured: '750,000',
          sumInsured: 750000,
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000,
          year_premium: '240,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '20,000',
              yearly_premium: '240,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '240,000',
              yearly_premium: '240,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Mini",
          code_name: "MINI",
          premium: '40,000',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000,
          year_premium: '480,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '40,000',
              yearly_premium: '480,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '480,000',
              yearly_premium: '480,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Midi",
          code_name: "MIDI",
          premium: '50,000',
          sum_insured: '3M',
          sumInsured: 3000000,
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000,
          year_premium: '590,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '50,000',
              yearly_premium: '590,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '590,000',
              yearly_premium: '590,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Biggie",
          code_name: "BIGGIE",
          premium: '65,000',
          sum_insured: '5M',
          sumInsured: 5000000,
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000,
          year_premium: '740,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '65,000',
              yearly_premium: '740,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '740,000',
              yearly_premium: '740,000',
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
          name: "S Mini",
          code_name: "S MINI",
          premium: '25,000',
          sum_insured: '750,000',
          sumInsured: 750000,
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000,
          year_premium: '300,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '25,000',
              yearly_premium: '300,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '300,000',
              yearly_premium: '300,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Mini",
          code_name: "MINI",
          premium: '50,000',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000,
          year_premium: '600,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '50,000',
              yearly_premium: '600,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '600,000',
              yearly_premium: '600,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Midi",
          code_name: "MIDI",
          premium: '63,000',
          sum_insured: '3M',
          sumInsured: 3000000,
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000,
          year_premium: '720,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '63,000',
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
          name: "Biggie",
          code_name: "BIGGIE",
          premium: '77,000',
          sum_insured: '5M',
          sumInsured: 5000000,
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000,
          year_premium: '885,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '77,000',
              yearly_premium: '885,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '885,000',
              yearly_premium: '885,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        }

      ],
    }, {
      name: "Self+Spouse+4 Children",
      code_name: "M+5",
      packages: [
        {
          name: "S Mini",
          code_name: "S MINI",
          premium: '30,000',
          sum_insured: '750,000',
          sumInsured: 750000,
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000,
          year_premium: '360,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '30,000',
              yearly_premium: '360,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '360,000',
              yearly_premium: '360,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Mini",
          code_name: "MINI",
          premium: '60,000',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000,
          year_premium: '720,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '60,000',
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
          name: "Midi",
          code_name: "MIDI",
          premium: '75,000',
          sum_insured: '3M',
          sumInsured: 3000000,
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000,
          year_premium: '860,000',
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
        {
          name: "Biggie",
          code_name: "BIGGIE",
          premium: '93,000',
          sum_insured: '5M',
          sumInsured: 5000000,
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000,
          year_premium: '1,060,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '93,000',
              yearly_premium: '1,060,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '1,060,000',
              yearly_premium: '1,060,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        }

      ],
    }, {
      name: "Self+Spouse+5 Children",
      code_name: "M+6",
      packages: [
        {
          name: "S Mini",
          code_name: "S MINI",
          premium: '35,000',
          sum_insured: '750,000',
          sumInsured: 750000,
          last_expense_insured: '500,000',
          lastExpenseInsured: 500000,
          year_premium: '420,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '35,000',
              yearly_premium: '420,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '420,000',
              yearly_premium: '420,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        },
        {
          name: "Mini",
          code_name: "MINI",
          premium: '70,000',
          sum_insured: '1.5M',
          sumInsured: 1500000,
          last_expense_insured: '1M',
          lastExpenseInsured: 1000000,
          year_premium: '840,000',
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
          name: "Midi",
          code_name: "MIDI",
          premium: '88,000',
          sum_insured: '3M',
          sumInsured: 3000000,
          last_expense_insured: '1.5M',
          lastExpenseInsured: 1500000,
          year_premium: '1,010,000',
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
        {
          name: "Biggie",
          code_name: "BIGGIE",
          premium: '108,000',
          sum_insured: '5M',
          sumInsured: 5000000,
          last_expense_insured: '2M',
          lastExpenseInsured: 2000000,
          year_premium: '1,238,000',
          payment_options: [
            {
              name: 'Monthly',
              code_name: 'monthly',
              premium: '108,000',
              yearly_premium: '1,238,000',
              installment_type: 1,
              period: 'monthly'
            },
            {
              name: 'Yearly',
              code_name: 'yearly',
              premium: '1,238,000',
              yearly_premium: '1,238,000',
              installment_type: 2,
              period: 'yearly'
            }
          ]
        }

      ],
    }
  ];

  if (currentStep == 1) {

    response = "CON Buy for family " +
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
    let existingPolicy = await db.policies.findAndCountAll({
      where: {
        phone_number: `+256${phone}`,
        policy_status: "paid",
        [Op.or]: [
          { beneficiary: "FAMILY" },
          { beneficiary: "SELF" }
        ]
      },
      limit: 1,
    });


    if (existingPolicy && existingPolicy.count > 0) {
      response = "END You already have an active policy"
      return response;
    }
    const packages = selectedCover.packages.map((coverType, index) => {
      return `\n${index + 1}. ${coverType.name} at UGX ${coverType.premium}`
    }
    ).join("");

    response = "CON " + selectedCover.name + packages + "\n0. Back \n00. Main Menu";

  }
  else if (currentStep == 3) {

    response = "CON Enter atleast Full Name of spouse or 1 child\n (Must be below 65 years) \n"
  }
  else if (currentStep == 4) {
    response = "CON Enter Phone of spouse (or Main member, if dependent is child) eg. 0700000000 \n"
  }
  else if (currentStep == 5) {
    const selectedCover = covers[parseInt(allSteps[1]) - 1];
    const selectedPackage = selectedCover.packages[parseInt(allSteps[2]) - 1];

    if (allSteps[4].length < 10) {
      response = "END Sorry Phone number for Other not valid e.g 0700000000\n"
      return response;
    }

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
      phone_number: allSteps[4],
      principal_phone_number: phoneNumber,
      //user_id: existingUser.user_id,
    };

    await Beneficiary.create(beneficiary);

    if (!existingUser) {
      console.log("USER DOES NOT EXIST FAMILY");
      existingUser = await getAirtelUser(phoneNumber, 2);

    }

    response = `CON Pay UGX ${premium} ${period}` +
      `\nTerms&Conditions - https://rb.gy/g4hyk` +
      `\nConfirm to Agree and Pay \nAge 0 - 65 Years ` + "\n1. Confirm \n0. Back";
  }
  else if (currentStep == 7) {

    if (userText == "1") {

      response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment'
      console.log("=============== END SCREEN USSD RESPONCE - FAMILY =======", new Date());

      let selectedPolicyType = covers[parseInt(allSteps[1]) - 1];
      let selectedPackage = selectedPolicyType.packages[parseInt(allSteps[2]) - 1];
      let ultimatePremium = parseAmount(selectedPackage.payment_options[parseInt(allSteps[5]) - 1].premium);

      let checkPaidPolicy = await db.policies.findAndCountAll({
        where: {
          user_id: existingUser.user_id,
          policy_status: 'paid',
        },
      });

      let policyNumber =
        checkPaidPolicy.count > 0
          ? `BW${phoneNumber?.replace('+', '')?.substring(3)}_${checkPaidPolicy.count + 1}`
          : `BW${phoneNumber?.replace('+', '')?.substring(3)}`;


      let policyObject = {
        policy_id: uuidv4(),
        installment_type: parseInt(allSteps[5]) == 1 ? 2 : 1,
        installment_order: 1,
        policy_type: selectedPackage.code_name,
        policy_deduction_amount: ultimatePremium,
        policy_next_deduction_date: parseInt(allSteps[5]) == 1 ? new Date(new Date().setMonth(new Date().getMonth() + 1)) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        policy_pending_premium: parseAmount(selectedPackage.year_premium) - ultimatePremium,
        sum_insured: selectedPackage.sumInsured,
        premium: ultimatePremium,
        yearly_premium: parseAmount(selectedPackage.year_premium),
        last_expense_insured: selectedPackage.lastExpenseInsured,
        membership_id: existingUser.membership_id,
        beneficiary: "FAMILY",
        partner_id: 2,
        policy_status: "pending",
        country_code: "UGA",
        currency_code: "UGX",
        product_id: "d18424d6-5316-4e12-9826-302b866a380c",
        user_id: existingUser.user_id,
        phone_number: phoneNumber,
        total_member_number: selectedPolicyType.code_name,
        first_name: existingUser?.first_name,
        last_name: existingUser?.last_name,
        policy_number: policyNumber
      }

      let policy = await db.policies.create(policyObject);


      console.log("============== START TIME - FAMILY ================ ", phoneNumber, new Date());

      
      let preGeneratedTransactionId = uuidv4();

      await createTransaction(existingUser.user_id, existingUser.partner_id, policy.policy_id, preGeneratedTransactionId, policy.premium);

   
      setTimeout(async () => {


        const airtelMoneyPromise = await airtelMoney(
            phoneNumber.replace("+", "").substring(3),
            policy.premium,
            existingUser.membership_id,
            preGeneratedTransactionId
        );

        const timeout = parseInt(process.env.AIRTEL_MONEY_TIMEOUT) || 3000;

        Promise.race([
            airtelMoneyPromise,
            new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('Airtel Money operation timed out'));
                }, timeout);
            })
        ]).then((result) => {
            // Airtel Money operation completed successfully
            console.log("============== END TIME - FAMILY ================ ", phoneNumber, new Date());
            //response = 'END Payment successful';
            console.log("SELF RESPONSE WAS CALLED", result);
            return response;
        }).catch((error) => {
            // Airtel Money operation failed
            //response = 'END Payment failed';
            console.log("SELF RESPONSE WAS CALLED", error);
            return response;
        });

        console.log("============== AFTER CATCH TIME - FAMILY ================ ", phoneNumber, new Date());
    }, 500);

      console.log("============== AFTER CATCH  TIME - FAMILY ================ ", phoneNumber, new Date());

    } else {
      response = "END Thank you for using Ddwaliro Care"
    }
  }

  return response;
}

export default familyMenu;



