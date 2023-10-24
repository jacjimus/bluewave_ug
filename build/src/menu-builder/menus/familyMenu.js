"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const payment_1 = require("../../services/payment");
const uuid_1 = require("uuid");
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const utils_1 = require("../../services/utils");
const getAirtelUser_1 = require("../../services/getAirtelUser");
const familyMenu = (args, db) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let { phoneNumber, text, response, currentStep, previousStep, userText, allSteps } = args;
    const Policy = db.policies;
    const Beneficiary = db.beneficiaries;
    const User = db.users;
    console.log("CURRENT STEP", currentStep);
    let phone = (_a = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _a === void 0 ? void 0 : _a.substring(3);
    let existingUser = yield db.users.findOne({
        where: {
            phone_number: phone,
        },
    });
    // covers for family
    const covers = [
        {
            name: "Self+Spouse or Child",
            code_name: "M+1",
            packages: [
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
        // const coversList = covers.map((cover, index) => {
        //   return `\n${index + 1}. ${cover.name}`
        // }).join("");
        // response = "CON Buy for family " + coversList + "\n0. Back \n00. Main Menu";
        // create a raw menu with the cover types without looping
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
        const packages = selectedCover.packages.map((coverType, index) => {
            return `\n${index + 1}. ${coverType.name} at UGX ${coverType.premium}`;
        }).join("");
        response = "CON " + selectedCover.name + packages + "\n0. Back \n00. Main Menu";
    }
    else if (currentStep == 3) {
        response = "CON Enter atleast Name of spouse or 1 child\n";
    }
    else if (currentStep == 4) {
        response = "CON Enter Phone of spouse (or Main member, if dependent is child)\n";
    }
    else if (currentStep == 5) {
        const selectedCover = covers[parseInt(allSteps[1]) - 1];
        //console.log("SELECTED COVER", selectedCover)
        const selectedPackage = selectedCover.packages[parseInt(allSteps[2]) - 1];
        // console.log("SELECTED PACKAGE", selectedPackage)
        let userPhoneNumber = (_b = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _b === void 0 ? void 0 : _b.substring(3);
        let coverText = `CON Inpatient cover for 0${userPhoneNumber}, UGX ${selectedPackage.sum_insured} a year` +
            "\nPAY " +
            `\n1. UGX ${selectedPackage === null || selectedPackage === void 0 ? void 0 : selectedPackage.payment_options[0].premium} monthly` +
            `\n2. UGX ${selectedPackage === null || selectedPackage === void 0 ? void 0 : selectedPackage.payment_options[1].yearly_premium} yearly` + "\n0. Back \n00. Main Menu";
        response = coverText;
    }
    else if (currentStep == 6) {
        const selectedCover = covers[parseInt(allSteps[1]) - 1];
        const selectedPackage = selectedCover.packages[parseInt(allSteps[2]) - 1];
        let premium = selectedPackage === null || selectedPackage === void 0 ? void 0 : selectedPackage.payment_options[parseInt(userText) - 1].premium;
        let period = selectedPackage === null || selectedPackage === void 0 ? void 0 : selectedPackage.payment_options[parseInt(userText) - 1].period;
        let fullPhone = !(phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.startsWith('+')) ? `+${phoneNumber}` : phoneNumber;
        let selectedPolicyType = covers[parseInt(allSteps[1]) - 1];
        const spouse = allSteps[3];
        let beneficiary = {
            beneficiary_id: (0, uuid_1.v4)(),
            full_name: spouse,
            first_name: spouse.split(" ")[0],
            middle_name: spouse.split(" ")[1],
            last_name: spouse.split(" ")[2] || spouse.split(" ")[1],
            relationship: "SPOUSE",
            member_number: selectedPolicyType.code_name,
            principal_phone_number: phoneNumber,
            //user_id: existingUser.user_id,
        };
        // console.log("BENEFICIARY", beneficiary);
        yield Beneficiary.create(beneficiary);
        if (!existingUser) {
            console.log("USER DOES NOT EXIST FAMILY");
            let user = yield (0, getAirtelUser_1.getAirtelUser)(phoneNumber, "UG", "UGX", 2);
            let membershierId = Math.floor(100000 + Math.random() * 900000);
            existingUser = yield db.users.create({
                user_id: (0, uuid_1.v4)(),
                phone_number: phone,
                membership_id: membershierId,
                first_name: user.first_name,
                last_name: user.last_name,
                name: `${user.first_name} ${user.last_name}`,
                total_member_number: selectedPolicyType.code_name,
                partner_id: 2,
                nationality: "UGANDA"
            });
            console.log("USER DOES NOT EXIST", user);
            const message = `Dear ${existingUser.first_name}, welcome to Ddwaliro Care. Membership ID: ${membershierId} Dial *185*7*6# to access your account.`;
            yield (0, sendSMS_1.default)(fullPhone, message);
        }
        response = `CON Pay UGX ${premium} ${period}` +
            `\nTerms&Conditions - https://rb.gy/g4hyk` +
            `\nConfirm to Agree and Pay` + "\n1. Confirm \n0. Back";
    }
    else if (currentStep == 7) {
        if (userText == "1") {
            // NOT WORK
            response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment';
            console.log("=============== END SCREEN USSD RESPONCE WAS CALLED =======", new Date());
            let selectedPolicyType = covers[parseInt(allSteps[1]) - 1];
            let selectedPackage = selectedPolicyType.packages[parseInt(allSteps[2]) - 1];
            let policyType = selectedPackage.code_name;
            let installment_type = parseInt(allSteps[5]) == 1 ? 2 : 1;
            let ultimatePremium = (0, utils_1.parseAmount)(selectedPackage.payment_options[parseInt(allSteps[5]) - 1].premium);
            // console.log("ULTIMATE PREMIUM", ultimatePremium);
            //next month minus 1 day
            //let installment_next_month_date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1)
            //let policy_end_date = new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1));
            // let policy_deduction_day = new Date().getDate() - 1;
            let policyObject = {
                policy_id: (0, uuid_1.v4)(),
                installment_type,
                policy_type: policyType,
                policy_deduction_amount: ultimatePremium,
                policy_pending_premium: ultimatePremium,
                sum_insured: selectedPackage.sumInsured,
                premium: ultimatePremium,
                yearly_premium: (0, utils_1.parseAmount)(selectedPackage.year_premium),
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
            };
            let policy = yield db.policies.create(policyObject);
            console.log("============== START TIME ================ ", new Date());
            try {
                //  let airtelMoneyPromise=  await
                (0, payment_1.airtelMoney)(existingUser.user_id, 2, policy.policy_id, phone, ultimatePremium, existingUser.membership_id, "UG", "UGX");
                //   const timeout = 5000;
                //   Promise.race([
                //     airtelMoneyPromise,
                //     new Promise((resolve, reject) => {
                //       setTimeout(() => {
                //         reject(new Error('Airtel Money operation timed out'));
                //       }, timeout);
                //     })
                //   ]).then((result) => {
                // console.log("============== END TIME ================ ", new Date());
                //   if (result === 'timeout') {
                //    // response = 'END Payment operation timed out';
                //     console.log("RESPONSE WAS CALLED", result);
                //   } else {
                //     // Airtel Money operation completed successfully
                //     //response = 'END Payment successful'; // Set your desired response here
                //     console.log("RESPONSE WAS CALLED", result);
                //   }
                // })
                // .catch((error) => {
                //   //response = 'END Payment failed'; // Set an error response
                //   console.log("RESPONSE WAS CALLED EER", error);
                // })
            }
            catch (error) {
                //response = 'END Payment failed'; // Set an error response
                console.log("RESPONSE WAS CALLED EER", error);
            }
            console.log("============== AFTER CATCH  TIME ================ ", new Date());
            //| ============== START TIME ================  2023-10-24T14:08:11.341Z
            //============== AFTER CATCH  TIME ================  2023-10-24T14:08:13.749Z
            // ============== END TIME ================  2023-10-24T14:08:13.750Z
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
        }
        else {
            response = "END Thank you for using Ddwaliro Care";
        }
    }
    return response;
});
exports.default = familyMenu;
