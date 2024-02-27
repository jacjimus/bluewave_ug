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
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const uuid_1 = require("uuid");
const utils_1 = require("../../services/utils");
const getAirtelUser_1 = require("../../services/getAirtelUser");
const payment_1 = require("../../services/payment");
const othersMenu = (args, db) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    let { phoneNumber, response, currentStep, userText, allSteps } = args;
    let phone = (_a = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _a === void 0 ? void 0 : _a.substring(3);
    // console.log("SELECTED POLICY TYPE", selectedPolicyType);
    let existingUser = yield db.users.findOne({
        where: {
            phone_number: phone,
            partner_id: 1,
        },
        limit: 1,
    });
    let otherUser;
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
            return `\n${index + 1}. ${cover.name}`;
        }).join("");
        response = "CON " + coversList + "\n0. Back";
    }
    else if (currentStep == 2) {
        let selectedCover = covers[parseInt(userText) - 1];
        if (!selectedCover) {
            response = "CON Invalid option" + "\n0. Back \n00. Main Menu";
            return response;
        }
        let packages = selectedCover.packages.map((cover, index) => {
            return `\n${index + 1}. ${cover.name} at Kshs ${cover.premium}`;
        }).join("");
        response = "CON " + selectedCover.name + packages + "\n0. Back \n00. Main Menu";
    }
    else if (currentStep == 3) {
        response = "CON Enter atleast Name of Other or 1 child\n";
    }
    else if (currentStep == 4) {
        response = "CON Enter Phone number for Other\n";
    }
    else if (currentStep == 5) {
        let otherName = allSteps[3];
        let otherPhone = allSteps[4];
        let coverType = allSteps[2];
        let selectedCover = covers[parseInt(allSteps[1]) - 1];
        let selectedCoverPackage = selectedCover.packages[coverType - 1];
        otherUser = yield db.users.findOne({
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
        let fullPhone = !(phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.startsWith('+')) ? `+${phoneNumber}` : phoneNumber;
        if (!existingUser) {
            let user = yield (0, getAirtelUser_1.getAirtelKenyaUser)(phoneNumber);
            let membershipId = Math.floor(100000 + Math.random() * 900000);
            existingUser = yield db.users.create({
                user_id: (0, uuid_1.v4)(),
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
            yield sendSMS_1.default.sendSMS(3, fullPhone, message);
        }
        response = `CON Kshs ${ultimatePremium} ${period}.` +
            `\nTerms&Conditions - www.airtel.com` +
            `\nConfirm to Agree and Pay \n Age 0 - 65 Years ` + "\n1. Confirm \n0. Back";
    }
    else if (currentStep == 7) {
        if (userText == "1") {
            response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment';
            console.log("=============== END SCREEN USSD RESPONCE WAS CALLED KENYA  =======", new Date());
            //console.log("otherUser", otherUser);
            let selectedPolicyType = covers[parseInt(allSteps[1]) - 1];
            let fullPhone = !(phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.startsWith('+')) ? `+${phoneNumber}` : phoneNumber;
            response = 'END Please wait for the Airtel Money prompt to enter your PIN to complete the payment.';
            let paymentOption = parseInt(allSteps[5]);
            let installment_type = paymentOption == 1 ? 2 : 1;
            let installment_order = 1;
            // let installment_next_month_date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1)
            let policyType = selectedPolicyType.packages[parseInt(allSteps[2]) - 1];
            //console.log("POLICY TYPE USERTEXT 1", policyType)
            let ultimatePremium = paymentOption == 1 ? policyType.premium : policyType.yearly_premium;
            //console.log("ULTIMATE PREMIUM", ultimatePremium)
            //console.log("OTHER USER", otherUser, allSteps[4].replace('0', ""))
            if (!otherUser) {
                let otherPhone = allSteps[4].replace('0', "");
                let otherData = {
                    user_id: (0, uuid_1.v4)(),
                    phone_number: otherPhone,
                    membership_id: Math.floor(100000 + Math.random() * 900000),
                    first_name: (_c = (_b = allSteps[3]) === null || _b === void 0 ? void 0 : _b.split(" ")[0]) === null || _c === void 0 ? void 0 : _c.toUpperCase(),
                    middle_name: (_e = (_d = allSteps[3]) === null || _d === void 0 ? void 0 : _d.split(" ")[1]) === null || _e === void 0 ? void 0 : _e.toUpperCase(),
                    last_name: ((_g = (_f = allSteps[3]) === null || _f === void 0 ? void 0 : _f.split(" ")[2]) === null || _g === void 0 ? void 0 : _g.toUpperCase()) ? (_j = (_h = allSteps[3]) === null || _h === void 0 ? void 0 : _h.split(" ")[2]) === null || _j === void 0 ? void 0 : _j.toUpperCase() : (_l = (_k = allSteps[3]) === null || _k === void 0 ? void 0 : _k.split(" ")[1]) === null || _l === void 0 ? void 0 : _l.toUpperCase(),
                    name: `${allSteps[3]}`,
                    total_member_number: selectedPolicyType.code_name,
                    partner_id: 1,
                    nationality: "KENYA",
                };
                otherUser = yield db.users.create(otherData);
                // console.log("OTHER USER CREATED", otherUser)
            }
            let policyObject = {
                policy_id: (0, uuid_1.v4)(),
                installment_type,
                installment_order,
                policy_type: policyType.name.toUpperCase(),
                policy_deduction_amount: (0, utils_1.parseAmount)(ultimatePremium),
                policy_pending_premium: (0, utils_1.parseAmount)(policyType.yearly_premium) - (0, utils_1.parseAmount)(ultimatePremium),
                sum_insured: policyType.sumInsured,
                premium: (0, utils_1.parseAmount)(ultimatePremium),
                yearly_premium: (0, utils_1.parseAmount)(policyType.yearly_premium),
                last_expense_insured: policyType.lastExpenseInsured,
                membership_id: Math.floor(100000 + Math.random() * 900000),
                beneficiary: "OTHER",
                partner_id: 1,
                country_code: "KEN",
                currency_code: "KES",
                product_id: "e18424e6-5316-4f12-9826-302c866b380d",
                user_id: existingUser.user_id,
                phone_number: phoneNumber,
                total_member_number: selectedPolicyType.code_name,
                bought_for: otherUser.user_id,
                first_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.first_name,
                last_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.last_name,
                inpatient_cover: policyType.inpatient_cover,
                outpatient_cover: policyType.outpatient_cover,
                maternity_cover: policyType.maternity,
                hospital_cash: policyType.hospital_cash,
                policy_number: "BW" + ((_m = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace('+', "")) === null || _m === void 0 ? void 0 : _m.substring(3))
            };
            try {
                let policy = yield db.policies.create(policyObject);
                const airtelMoneyPromise = (0, payment_1.airtelMoneyKenya)(existingUser.user_id, policy.policy_id, phone, (0, utils_1.parseAmount)(ultimatePremium), existingUser.membership_id);
                const timeout = 3000;
                Promise.race([
                    airtelMoneyPromise,
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            reject(new Error('Airtel Money kenya operation timed out'));
                        }, timeout);
                    }),
                ]).then((result) => {
                    console.log("============== END TIME - FAMIY KENYA  ================ ", phoneNumber, new Date());
                    response = 'END Payment successful';
                    console.log("RESPONSE WAS CALLED", result);
                    return response;
                })
                    .catch((error) => {
                    response = 'END Payment failed';
                    console.log("RESPONSE WAS CALLED EER", error);
                    return response;
                });
                console.log("============== AFTER CATCH  TIME - FAMILY KENYA  ================ ", phoneNumber, new Date());
            }
            catch (error) {
                //response = 'END Payment failed'; // Set an error response
                console.log("RESPONSE WAS CALLED EER", error);
            }
            console.log("============== AFTER CATCH  TIME KENYA ================ ", new Date());
        }
        else {
            response = "END Thank you for using AfyaShua Care";
        }
    }
    return response;
});
exports.default = othersMenu;
