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
    var _a, _b, _c, _d, _e, _f;
    let { phoneNumber, text, response, currentStep, previousStep, userText, allSteps } = args;
    const Policy = db.policies;
    const Beneficiary = db.beneficiaries;
    const User = db.users;
    console.log("CURRENT STEP", currentStep);
    let phone = (_a = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _a === void 0 ? void 0 : _a.substring(3);
    let existingUser;
    // family_cover_data for family
    const family_cover_data = [
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
                    maternity: 0,
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
                    maternity: 0,
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
                    maternity: 0,
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
                    maternity: 0,
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
                    maternity: 0,
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
                    maternity: 0,
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
                    maternity: 0,
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
                    sum_insured: '',
                    sumInsured: 0,
                    last_expense_insured: '',
                    lastExpenseInsured: 0,
                    year_premium: '18,203',
                    inpatient_cover: 300000,
                    outpatient_cover: 0,
                    hospital_cash: 0,
                    maternity: 0,
                    payment_options: [
                        {
                            name: 'Monthly',
                            code_name: 'monthly',
                            premium: '1,730',
                            yearly_premium: '18,203',
                            installment_type: 1,
                            period: 'monthly'
                        },
                        {
                            name: 'Yearly',
                            code_name: 'yearly',
                            premium: '18,203',
                            yearly_premium: '18,203',
                            installment_type: 2,
                            period: 'yearly'
                        }
                    ]
                },
                {
                    name: "Smarta",
                    code_name: "SMARTA",
                    premium: '3,726',
                    sum_insured: '',
                    sumInsured: 0,
                    last_expense_insured: '',
                    lastExpenseInsured: 0,
                    year_premium: '41,831',
                    inpatient_cover: 0,
                    outpatient_cover: 400000,
                    hospital_cash: 0,
                    payment_options: [
                        {
                            name: 'Monthly',
                            code_name: 'monthly',
                            premium: '3,726',
                            yearly_premium: '41,831',
                            installment_type: 1,
                            period: 'monthly'
                        },
                        {
                            name: 'Yearly',
                            code_name: 'yearly',
                            premium: '41,831',
                            yearly_premium: '41,831',
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
                    premium: '1,834',
                    sum_insured: '',
                    sumInsured: 0,
                    last_expense_insured: '',
                    lastExpenseInsured: 0,
                    year_premium: '19,259',
                    inpatient_cover: 300000,
                    outpatient_cover: 0,
                    hospital_cash: 0,
                    maternity: 0,
                    payment_options: [
                        {
                            name: 'Monthly',
                            code_name: 'monthly',
                            premium: '1,834',
                            yearly_premium: '19,259',
                            installment_type: 1,
                            period: 'monthly'
                        },
                        {
                            name: 'Yearly',
                            code_name: 'yearly',
                            premium: '19,259',
                            yearly_premium: '19,259',
                            installment_type: 2,
                            period: 'yearly'
                        }
                    ]
                },
                {
                    name: "Smarta",
                    code_name: "SMARTA",
                    premium: '3,949',
                    sum_insured: '3M',
                    sumInsured: 3000000,
                    last_expense_insured: '1.5M',
                    lastExpenseInsured: 1500000,
                    year_premium: '44,341',
                    inpatient_cover: 400000,
                    outpatient_cover: 400000,
                    hospital_cash: 0,
                    maternity: 0,
                    payment_options: [
                        {
                            name: 'Monthly',
                            code_name: 'monthly',
                            premium: '3,949',
                            yearly_premium: '44,341',
                            installment_type: 1,
                            period: 'monthly'
                        },
                        {
                            name: 'Yearly',
                            code_name: 'yearly',
                            premium: '44,341',
                            yearly_premium: '44,341',
                            installment_type: 2,
                            period: 'yearly'
                        }
                    ]
                },
            ],
        }
    ];
    if (currentStep == 1) {
        console.log("CURRENT STEP", currentStep);
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
        const selectedCover = family_cover_data[parseInt(userText) - 1];
        console.log("SELECTED COVER", selectedCover);
        if (!selectedCover) {
            response = "END Invalid option" + "\n0. Back \n00. Main Menu";
            return response;
        }
        const packages = selectedCover.packages.map((coverType, index) => {
            return `\n${index + 1}. ${coverType.name} at KES ${coverType.premium}`;
        }).join("");
        response = "CON " + selectedCover.name + packages + "\n0. Back \n00. Main Menu";
    }
    else if (currentStep == 3) {
        response = "CON Enter atleast Full Name of spouse or 1 child \nAge 0 - 65 Years\n";
    }
    else if (currentStep == 4) {
        response = "CON Enter Phone of spouse (or Main member, if dependent is child) \n";
    }
    else if (currentStep == 5) {
        const selectedCover = family_cover_data[parseInt(allSteps[1]) - 1];
        const selectedPackage = selectedCover.packages[parseInt(allSteps[2]) - 1];
        let userPhoneNumber = (_b = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _b === void 0 ? void 0 : _b.substring(3);
        let coverText = `CON Inpatient cover for 0${userPhoneNumber}, ${selectedPackage.inpatient_cover} a year` +
            "\nPAY " +
            `\n1. Kshs ${selectedPackage === null || selectedPackage === void 0 ? void 0 : selectedPackage.payment_options[0].premium} monthly` +
            `\n2. Kshs ${selectedPackage === null || selectedPackage === void 0 ? void 0 : selectedPackage.payment_options[1].yearly_premium} yearly` + "\n0. Back \n00. Main Menu";
        response = coverText;
    }
    else if (currentStep == 6) {
        const selectedCover = family_cover_data[parseInt(allSteps[1]) - 1];
        const selectedPackage = selectedCover.packages[parseInt(allSteps[2]) - 1];
        let premium = selectedPackage === null || selectedPackage === void 0 ? void 0 : selectedPackage.payment_options[parseInt(userText) - 1].premium;
        let period = selectedPackage === null || selectedPackage === void 0 ? void 0 : selectedPackage.payment_options[parseInt(userText) - 1].period;
        let fullPhone = !(phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.startsWith('+')) ? `+${phoneNumber}` : phoneNumber;
        let selectedPolicyType = family_cover_data[parseInt(allSteps[1]) - 1];
        const spouse = allSteps[3];
        let beneficiary = {
            beneficiary_id: (0, uuid_1.v4)(),
            full_name: spouse,
            first_name: (_c = spouse === null || spouse === void 0 ? void 0 : spouse.split(" ")[0]) === null || _c === void 0 ? void 0 : _c.toUpperCase(),
            middle_name: (_d = spouse === null || spouse === void 0 ? void 0 : spouse.split(" ")[1]) === null || _d === void 0 ? void 0 : _d.toUpperCase(),
            last_name: ((_e = spouse === null || spouse === void 0 ? void 0 : spouse.split(" ")[2]) === null || _e === void 0 ? void 0 : _e.toUpperCase()) || ((_f = spouse.split(" ")[1]) === null || _f === void 0 ? void 0 : _f.toUpperCase()),
            relationship: "SPOUSE",
            member_number: selectedPolicyType.code_name,
            principal_phone_number: phoneNumber,
            //user_id: existingUser.user_id,
        };
        // console.log("BENEFICIARY", beneficiary);
        yield Beneficiary.create(beneficiary);
        existingUser = yield db.users.findOne({
            where: {
                phone_number: phone,
                partner_id: 1,
            },
            limit: 1,
        });
        console.log("EXISTING USER", existingUser === null || existingUser === void 0 ? void 0 : existingUser.name);
        if (!existingUser) {
            console.log("USER DOES NOT EXIST FAMILY KENYA ");
            let user = yield (0, getAirtelUser_1.getAirtelKenyaUser)(phoneNumber);
            let membershierId = Math.floor(100000 + Math.random() * 900000);
            existingUser = yield db.users.create({
                user_id: (0, uuid_1.v4)(),
                phone_number: phone,
                membership_id: membershierId,
                first_name: user.first_name,
                last_name: user.last_name,
                name: `${user.first_name} ${user.last_name}`,
                total_member_number: selectedPolicyType.code_name,
                partner_id: 1,
                nationality: "KENYA"
            });
            console.log("USER DOES NOT EXIST", user);
            const message = `Dear ${existingUser.first_name}, welcome to AfyaShua Care. Membership ID: ${membershierId} Dial *334*7*3# to access your account.`;
            yield sendSMS_1.default.sendSMS(3, fullPhone, message);
        }
        response = `CON Kshs ${premium} payable ${period}` +
            `\nTerms&Conditions - Terms&Conditions - www.airtel.com` +
            `\nConfirm to Agree and Pay \n Age 0 - 65 Years` + "\n1. Confirm \n0. Back" + "\n00. Main Menu";
    }
    else if (currentStep == 7) {
        console.log("existingUser", existingUser);
        yield processUserText(userText, allSteps, phoneNumber, family_cover_data, existingUser, db);
    }
    return response;
});
function processUserText1(allSteps, phoneNumber, family_cover_data, existingUser, db) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = '';
        response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment';
        console.log("=============== END SCREEN USSD RESPONSE - FAMILY KENYA =======", new Date());
        let selectedPolicyType = family_cover_data[parseInt(allSteps[1]) - 1];
        let selectedPackage = selectedPolicyType.packages[parseInt(allSteps[2]) - 1];
        let ultimatePremium = (0, utils_1.parseAmount)(selectedPackage.payment_options[parseInt(allSteps[5]) - 1].premium);
        let policyObject = createPolicyObject(selectedPackage, allSteps, family_cover_data, existingUser, phoneNumber, ultimatePremium);
        let policy = yield createAndSavePolicy(policyObject, db);
        console.log("============== START TIME - FAMILY KENYA  ================ ", phoneNumber, new Date());
        const airtelMoneyPromise = (0, payment_1.airtelMoneyKenya)(existingUser.user_id, policy.policy_id, phoneNumber, ultimatePremium, existingUser.membership_id);
        response = yield handleAirtelMoneyPromise(airtelMoneyPromise, phoneNumber);
        console.log("============== AFTER CATCH  TIME - FAMILY  KENYA ================ ", phoneNumber, new Date());
        return response;
    });
}
function createPolicyObject(selectedPackage, allSteps, family_cover_data, existingUser, phoneNumber, ultimatePremium) {
    var _a;
    let selectedPolicyType = family_cover_data[parseInt(allSteps[1]) - 1];
    return {
        policy_id: (0, uuid_1.v4)(),
        installment_type: parseInt(allSteps[5]) == 1 ? 2 : 1,
        installment_order: 1,
        policy_type: selectedPackage.code_name,
        policy_deduction_amount: ultimatePremium,
        policy_pending_premium: (0, utils_1.parseAmount)(selectedPackage.year_premium) - ultimatePremium,
        sum_insured: selectedPackage.sumInsured,
        premium: ultimatePremium,
        yearly_premium: (0, utils_1.parseAmount)(selectedPackage.year_premium),
        last_expense_insured: selectedPackage.lastExpenseInsured,
        membership_id: Math.floor(100000 + Math.random() * 900000),
        beneficiary: "FAMILY",
        partner_id: 1,
        country_code: "KEN",
        currency_code: "KES",
        product_id: "e18424e6-5316-4f12-9826-302c866b380d",
        user_id: existingUser.user_id,
        phone_number: phoneNumber,
        total_member_number: selectedPolicyType.code_name,
        first_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.first_name,
        last_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.last_name,
        inpatient_cover: selectedPackage.inpatient_cover,
        outpatient_cover: selectedPackage.outpatient_cover,
        maternity_cover: selectedPackage.maternity,
        hospital_cash: selectedPackage.hospital_cash,
        policy_number: "BW" + ((_a = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _a === void 0 ? void 0 : _a.substring(3))
    };
}
function createAndSavePolicy(policyObject, db) {
    return __awaiter(this, void 0, void 0, function* () {
        let policy = yield db.policies.create(policyObject);
        return policy;
    });
}
function handleAirtelMoneyPromise(airtelMoneyPromise, phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const timeout = 3000;
        try {
            yield Promise.race([
                airtelMoneyPromise,
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error('Airtel Money Kenya operation timed out'));
                    }, timeout);
                }),
            ]);
            console.log("============== END TIME - FAMIY KENYA  ================ ", phoneNumber, new Date());
            return 'END Payment successful';
        }
        catch (error) {
            console.log("============== END TIME - FAMIY KENYA  ================ ", phoneNumber, new Date());
            return 'END Payment failed';
        }
    });
}
function processUserText2() {
    return __awaiter(this, void 0, void 0, function* () {
        return 'END Thank you for using AfyaShua Care';
    });
}
function processUserText(userText, allSteps, phoneNumber, family_cover_data, existingUser, db) {
    return __awaiter(this, void 0, void 0, function* () {
        if (userText == "1") {
            return processUserText1(allSteps, phoneNumber, family_cover_data, existingUser, db);
        }
        else {
            return processUserText2();
        }
    });
}
exports.default = familyMenu;
