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
const lang_1 = __importDefault(require("./lang"));
const configs_1 = __importDefault(require("./configs"));
const UssdMenu = require('ussd-builder');
let menu = new UssdMenu();
const apiKey = "f16ecdd2d74c746296367b7f34dcebe7b9f14ab45cfb2113f3e86077f906bc98";
const username = "sandbox";
const AfricasTalking = require('africastalking');
const africastalking = AfricasTalking({
    apiKey,
    username
});
//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
//f16ecdd2d74c746296367b7f34dcebe7b9f14ab45cfb2113f3e86077f906bc98
function default_1(args, db) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            let User = db.users;
            let Policy = db.policies;
            let Payment = db.payments;
            let Claim = db.claims;
            let Session = db.sessions;
            let Beneficiary = db.beneficiaries;
            //check if user exis
            let user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            }).then((user) => {
                console.log("USER1: ", user);
            }).catch((err) => {
                console.log("USER1: ", err);
            });
            // BUILD INPUT VARIABLE
            let buildInput = {
                current_input: args.text,
                full_input: args.text,
                masked_input: args.text,
                active_state: configs_1.default.start_state,
                sid: configs_1.default.session_prefix + args.sessionId,
                language: configs_1.default.default_lang,
                phone: args.phoneNumber,
                hash: "",
                user_id: user === null || user === void 0 ? void 0 : user.id
            };
            console.log(buildInput);
            //         // CHECK IF SESSION EXISTS
            let session = yield Session.findAll({
                where: {
                    sid: buildInput.sid
                }
            }).then((session) => {
                console.log("session1", session[0]);
            });
            if (session) {
                console.log("session2", session);
                buildInput.active_state = session[0].active_state;
                buildInput.language = session[0].language;
                buildInput.full_input = session[0].full_input;
                buildInput.masked_input = session[0].masked_input;
                buildInput.hash = session[0].hash;
                buildInput.phone = session[0].phone;
                buildInput.user_id = session[0].user_id;
            }
            else {
                // CREATE NEW SESSION
                yield Session.create({
                    sid: buildInput.sid,
                    active_state: buildInput.active_state,
                    language: buildInput.language,
                    full_input: buildInput.full_input,
                    masked_input: buildInput.masked_input,
                    hash: buildInput.hash,
                    phone_number: buildInput.phone,
                    user_id: buildInput.user_id
                });
            }
            // SET MENU STATES
            //LANDING PAGE
            menu.startState({
                run: () => {
                    // use menu.con() to send response without terminating session      
                    menu.con('Welcome. Choose option:' +
                        '\n1. Send Money' +
                        '\n2. Airtime/Bundles' +
                        '\n3. Withdraw Cash' +
                        '\n4. Pay Bill' +
                        '\n5. Payments' +
                        '\n6. School Fees' +
                        '\n7. Financial Services' +
                        '\n8. Wewole' +
                        '\n9. AirtelMoney Pay' +
                        '\n10. My account' +
                        '\n11. BiZ Wallet');
                },
                // next object links to next state based on user input
                next: {
                    '7': 'insurance',
                }
            });
            //LEVEL 1
            menu.state('insurance', {
                run: () => {
                    // use menu.end() to send response and terminate session
                    menu.con('Financial Services' +
                        '\n1. Banks' +
                        '\n2. Group Collections' +
                        '\n3. M-SACCO' +
                        '\n4. ATM Withdraw' +
                        '\n5. NSSF Savings' +
                        '\n6. Insurance' +
                        '\n7. Yassako Loans' +
                        '\n8. SACCO' +
                        '\n9. AirtelMoney MasterCard' +
                        '\n10. Loans' +
                        '\n11. Savings' +
                        '\nn  Next');
                },
                next: {
                    '6': 'medical_cover',
                }
            });
            //LEVEL 2
            menu.state('medical_cover', {
                run: () => {
                    // use menu.end() to send response and terminate session
                    menu.con('Insurance ' +
                        '\n1. Medical cover' +
                        '\n2. Auto Insurance' +
                        '\n0. Back' +
                        '\n00. Main Menu');
                },
                next: {
                    '1': 'account',
                }
            });
            //LEVEL 3
            menu.state('account', {
                run: () => {
                    // use menu.end() to send response and terminate session
                    menu.con('Medical cover ' +
                        '\n1. Buy for self' +
                        '\n2. Buy (family)' +
                        '\n3. Buy (others)' +
                        '\n4. Admission Claim' +
                        '\n5. My Account' +
                        '\n6. Terms & Conditions' +
                        '\n7. FAQs' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                },
                next: {
                    '1': 'buyForSelf',
                    '2': 'buyForFamily',
                    '3': 'buyForOthers',
                    '4': 'makeClaim',
                    '5': 'myAccount',
                    '6': 'termsAndConditions',
                    '7': 'faqs',
                }
            });
            //faqs
            menu.state('faqs', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.end() to send response and terminate session
                    menu.con('FAQs ' +
                        '\n1. Eligibility' +
                        '\n2. Bronze cover' +
                        '\n3. Silver Cover' +
                        '\n4. Gold cover' +
                        '\n5. Auto-renew' +
                        '\n6. Waiting period' +
                        '\n7. When to make claim' +
                        '\n8. Claim Payment' +
                        '\n9. Change Name' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '1': 'eligibility',
                    '2': 'bronzeCover',
                    '3': 'silverCover',
                    '4': 'goldCover',
                    '5': 'autoRenew',
                    '6': 'waitingPeriod',
                    '7': 'whenToMakeClaim',
                    '8': 'claimPayment',
                    '9': 'changeName',
                }
            });
            //eligibility
            menu.state('eligibility', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.end() to send response and terminate session
                    menu.end('Persons between the age of 18 and 65 are eligible to purchase Medical cover Policy' +
                        '\nTs&Cs apply');
                }),
            });
            //bronze cover
            menu.state('bronzeCover', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end('Get Free Cover for Bronze Hospitalization cover for 30 nights / year ' +
                        '\nPays keys 4,500 per night from 2nd night. Payout for ICU is Kes9,000 for max 10 nights' +
                        '\nTs&Cs apply');
                }),
            });
            //silver cover
            menu.state('silverCover', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.end() to send response and terminate session
                    menu.end('Outpatient limit of Kes 300,000' +
                        '\nMaternity covered up to Kes 100,000' +
                        '\nCan cover up to 6 dependents' +
                        '\nTs&Cs apply');
                }),
            });
            //gold cover
            menu.state('goldCover', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end('Outpatient limit of Kes 400,000' +
                        '\nMaternity covered up to Kes 100,000' +
                        '\nCan cover up to 6 dependents' +
                        '\nTs&Cs apply');
                }),
            });
            //auto renew
            menu.state('autoRenew', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end('To stay covered, the premium amount will be deducted automatically from your Airtel Money account on the selected day per month' +
                        '\nTs&Cs apply');
                }),
            });
            //waiting period
            menu.state('waitingPeriod', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end('This means the days before benefits become fully active. For the first 30 DAYS, only hospitalizations due to ACCIDENT will be covered. ' +
                        '\n10 month waiting period for pre-existing conditions.' +
                        '\nTs&Cs apply');
                }),
            });
            //when to make claim
            menu.state('whenToMakeClaim', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end('Make Hospital claim when you spend MORE THAN 1 NIGHT in the hospital. ' +
                        '\nA' +
                        '\nTs&Cs apply');
                }),
            });
            //claim payment
            menu.state('claimPayment', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end('Claims will be paid to customer’s Airtel  wallet (Bronze) or to the hospital for Silver and Gold' +
                        '\nTs&Cs apply');
                }),
            });
            //change name
            menu.state('changeName', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end('Policy will cover person whose name SIM is registered in. To change, visit Airtel Service Center with your National ID to Register this SIM Card in your name' +
                        '\nTs&Cs apply');
                }),
            });
            //terms and conditions
            menu.state('termsAndConditions', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const to = '254' + buildInput.phone.substring(1);
                    const message = 'Visit [LINK TBC] to Terms & Conditions. A link will also be sent by SMS';
                    const from = 'Airtel';
                    africastalking.SMS.send({
                        to,
                        message,
                        from
                    })
                        .then(response => {
                        console.log(response);
                    })
                        .catch(error => {
                        console.error(error);
                    });
                    menu.end('Visit [LINK TBC] to Terms & Conditions. A link will also be sent by SMS');
                }),
            });
            //my account
            menu.state('myAccount', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.end() to send response and terminate session    
                    menu.con('My Account ' +
                        '\n1. Pay Now' +
                        '\n2. Manage auto-renew' +
                        '\n3. My insurance policy' +
                        '\n4. Cancel policy' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '1': 'payNow',
                    '2': 'manageAutoRenew',
                    '3': 'myInsurancePolicy',
                    '4': 'cancelPolicy',
                    '0': 'account',
                    '00': 'insurance',
                }
            });
            //cancel policy
            menu.state('cancelPolicy', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone,
                        },
                    });
                    if (user) {
                        const policy = yield Policy.findOne({
                            where: {
                                user_id: user.id,
                            },
                        });
                        if (policy) {
                            // 1. Cancel Policy
                            menu.con(`Hospital cover of Kes 1M a year(100k per night, max 10 nights)
                            Life cover of Kes 4M Funeral Benefit
                            \n1. Cancel Policy`);
                        }
                        else {
                            menu.con("Your policy is INACTIVE\n0 Buy cover");
                        }
                    }
                    else {
                        menu.end("User not found");
                    }
                }),
                next: {
                    '0': 'account',
                    '1': 'cancelPolicyPin',
                }
            });
            //cancel policy pin
            menu.state('cancelPolicyPin', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.end() to send response and terminate session
                    menu.con('By cancelling, you will no longer be covered for Hospital + Life Insurance as of DD/MM/YYYY.' +
                        'Enter PIN to  Confirm cancellation' +
                        '0.Back     00.Main Menu');
                }),
                next: {
                    '*[0-9]': 'cancelPolicyConfirm',
                }
            });
            //cancel policy confirm
            menu.state('cancelPolicyConfirm', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const to = '254' + buildInput.phone.substring(1);
                    const message = ' You CANCELLED your Medical cover cover. Your Policy will expire on DD/MM/YYYY and you will not be covered. Dial *187*7*1# to reactivate.';
                    const from = 'Airtel';
                    africastalking.SMS.send({
                        to,
                        message,
                        from
                    })
                        .then(response => {
                        console.log(response);
                    })
                        .catch(error => {
                        console.error(error);
                    });
                    let pin = menu.val;
                    // use menu.end() to send response and terminate session
                    menu.con('Your policy will expire on DD/MM/YYYY and will not be renewed. Dial *187*7# to reactivate.' +
                        '0.Back     00.Main Menu');
                }),
                next: {
                    '0': 'myAccount',
                    '00': 'insurance',
                }
            });
            //my insurance policy
            menu.state('myInsurancePolicy', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    //grt user by phone number
                    const user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone,
                        },
                        include: [
                            {
                                model: Policy,
                                where: {
                                    policy_status: 'active',
                                },
                                attributes: [
                                    'policy_status',
                                    'policy_type',
                                    'policy_end_date',
                                    'policy_deduction_day',
                                ],
                                raw: true,
                            },
                        ],
                        raw: true,
                    });
                    if (!user) {
                        menu.con('User not found');
                        return;
                    }
                    if (user['policies.policy_status'] === 'active') {
                        menu.end('My Insurance Policy ' +
                            `${user['policies.policy_type']} cover ${user['policies.policy_status']} upto ${user['policies.policy_end_date']}\n` +
                            `HOSPITAL: Kes 100k per night, ## nights remaining\n` +
                            `FUNERAL: Kes 4M cover\n` +
                            `Premium payment auto-deducted day ${user['policies.policy_deduction_day']} monthly`);
                    }
                    else {
                        menu.con('Your policy is INACTIVE\n' +
                            '1 Buy cover\n' +
                            '0.Back\n' +
                            '00.Main Menu');
                    }
                }),
                next: {
                    '1': 'account',
                    '0': 'account',
                    '00': 'insurance',
                }
            });
            //pay now
            menu.state('payNow', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.end() to send response and terminate session
                    menu.con('Your outstanding premium is Kes 1,353 ' +
                        '\n1. Enter PIN to Pay Now' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '*\\d+': 'payNowPin',
                    '0': 'account',
                    '00': 'insurance',
                }
            });
            menu.state('payNowPin', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let pin = menu.val;
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    //get policy
                    let policy = yield Policy.findOne({
                        where: {
                            user_id: user.id
                        }
                    });
                    let policy_deduction_amount = policy.policy_deduction_amount;
                    let policy_deduction_day = policy.policy_deduction_day;
                    let policy_type = policy.policy_type;
                    let policy_end_date = policy.policy_end_date;
                    let nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1).toLocaleString();
                    // check if pin is correct
                    if (user.pin == pin) {
                        // use menu.end() to send response and terminate session
                        //send sms
                        const to = '254' + buildInput.phone.substring(1);
                        const message = `PYour monthly auto premium payment of Kes ${policy_deduction_amount} for ${policy_type} Medical cover was SUCCESSFUL. Cover was extended till ${policy_end_date}. Next payment is on DD/MM/YY
                        `;
                        const from = 'Airtel';
                        africastalking.SMS.send({
                            to,
                            message,
                            from
                        })
                            .then(response => {
                            console.log(response);
                        })
                            .catch(error => {
                            console.error(error);
                        });
                        //Paid Kes 5,000 for Medical cover. Your next payment will be due on day # of [NEXT MONTH]
                        menu.end(`Paid Kes ${policy_deduction_amount} for Medical cover. Your next payment will be due on day ${policy_deduction_day} of ${nextMonth}`);
                    }
                    else {
                        menu.end('Incorrect PIN. Please try again');
                    }
                })
            });
            //makeClaim'
            menu.state('makeClaim', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    //send sms
                    const { phone: to } = buildInput;
                    const from = "Bluewave Insurance";
                    const messages = [
                        `Your medicals details have been confirmed. You are covered for hospital cash of kes 4,500 per night payable from the second night`,
                        `An amount of kes100,000 has been paid by AAR towards your hospital bill.: Your cover balanceis Kes 200,000`
                    ];
                    for (const message of messages) {
                        try {
                            const response = yield africastalking.SMS.send({ to, message, from });
                            console.log(response);
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                    //get user
                    try {
                        const user = yield User.findOne({
                            where: {
                                phone_number: args.phoneNumber,
                            },
                        });
                        console.log("user:", user);
                        if (user) {
                            const policy = yield Policy.findOne({
                                where: {
                                    user_id: user.id,
                                },
                            });
                            console.log("policy:", policy);
                            if (policy) {
                                const claim = yield Claim.create({
                                    policy_id: policy.policy_id,
                                    user_id: buildInput.user_id,
                                    claim_date: new Date(),
                                    claim_status: "Pending",
                                });
                                console.log("claim:", claim);
                                menu.con("Admission Claim\nProceed to the reception to verify your details\n0. Back\n00. Main Menu");
                            }
                            else {
                                menu.con("Your policy is INACTIVE\n0. Buy cover");
                            }
                        }
                        else {
                            menu.end("User not found");
                        }
                    }
                    catch (err) {
                        console.log("err:", err);
                    }
                }),
                next: {
                    '0': 'account',
                    '00': 'insurance',
                }
            });
            //LEVEL 4
            menu.state('buyForSelf', {
                run: () => {
                    // use menu.end() to send response and terminate session
                    menu.con('Buy for self ' +
                        '\n1. Bronze  – Kes 300' +
                        '\n2. Silver – Kes 650' +
                        '\n3. Gold – Kes 1,400' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                },
                next: {
                    '1': 'buyForSelf.bronze',
                    '2': 'buyForSelf.silver',
                    '3': 'buyForSelf.gold',
                    '0': 'account',
                    '00': 'insurance',
                }
            });
            //LEVEL 5
            menu.state('buyForSelf.bronze', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    //get user where phone number = buildInputOneone
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    // use menu.end() to send response and terminate session
                    menu.end(` Hospital cover for ${user === null || user === void 0 ? void 0 : user.name} ${buildInput.phone} John Doe Kes 1M a year /n` +
                        '\nPAY' +
                        '\n1. Kes 300 deducted monthly \n' +
                        '\n 2-3,294 yearly' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '1': 'buyForSelf.bronze.pay',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            menu.state('buyForSelf.silver', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    // use menu.end() to send response and terminate session
                    menu.con(` Hospital cover for  ${user === null || user === void 0 ? void 0 : user.name} ${buildInput.phone} John Doe Kes 1M a year /n` +
                        '\nPAY' +
                        '\n1. Kes 650 deducted monthly \n' +
                        '\n 2-3,294 yearly' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '1': 'buyForSelf.silver.pay',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            menu.state('buyForSelf.gold', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    // use menu.end() to send response and terminate session
                    menu.con(` Hospital cover for ${user === null || user === void 0 ? void 0 : user.name} ${buildInput.phone} John Doe Kes 1M a year /n` +
                        '\nPAY' +
                        '\n1. Kes 1400 deducted monthly \n' +
                        '\n 2-3,294 yearly' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '1': 'buyForSelf.gold.pay',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            //LEVEL 6
            menu.state('buyForSelf.bronze.pay', {
                run: () => {
                    // use menu.end() to send response and terminate session
                    menu.con('Pay Kes 300  deducted monthly.' +
                        '\nTerms&Conditions - www.airtel.com' +
                        '\nEnter PIN to Agree and Pay' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                },
                next: {
                    '*\\d+': 'buyForSelf.bronze.pin',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            menu.state('buyForSelf.silver.pay', {
                run: () => {
                    // use menu.end() to send response and terminate session
                    menu.con('Pay Kes 650  deducted monthly.' +
                        '\nTerms&Conditions - www.airtel.com' +
                        '\nEnter PIN to Agree and Pay' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                },
                next: {
                    '*\\d+': 'buyForSelf.silver.pin',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            menu.state('buyForSelf.gold.pay', {
                run: () => {
                    // use menu.end() to send response and terminate session
                    menu.con('Pay Kes 1400  deducted monthly.' +
                        '\nTerms&Conditions - www.airtel.com' +
                        '\nEnter PIN to Agree and Pay' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                },
                next: {
                    '*\\d+': 'buyForSelf.gold.pin',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            menu.state('buyForSelf.bronze.pin', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let pin = Number(menu.val);
                    //get user by pin
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    // check if pin is correct
                    if (user && user.pin == pin) {
                        // use menu.end() to send response and terminate session
                        menu.con('SCHEDULE' +
                            '\n Enter day of month to deduct Kes 300 premium monthly (e.g. 1, 2, 3…31)' +
                            '\n0.Back' +
                            '\n00.Main Menu');
                    }
                    else {
                        // use menu.con() to send response without terminating session
                        menu.con('PIN incorrect. Try again');
                    }
                }),
                next: {
                    '*\\d+': 'buyForSelf.bronze.confirm',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            menu.state('buyForSelf.silver.pin', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let pin = Number(menu.val);
                    // check if pin is correct
                    //get user by pin
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    // check if pin is correct
                    if (user && user.pin == pin) {
                        // use menu.end() to send response and terminate session
                        menu.con('SCHEDULE' +
                            '\n Enter day of month to deduct Kes 650 premium monthly (e.g. 1, 2, 3…31)' +
                            '\n0.Back' +
                            '\n00.Main Menu');
                    }
                    else {
                        // use menu.con() to send response without terminating session
                        menu.con('PIN incorrect. Try again');
                    }
                }),
                next: {
                    '*\\d+': 'buyForSelf.silver.confirm',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            menu.state('buyForSelf.gold.pin', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let pin = Number(menu.val);
                    // check if pin is correct
                    //get user by pin
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    // check if pin is correct
                    if (user && user.pin == pin) {
                        // use menu.end() to send response and terminate session
                        menu.con('SCHEDULE' +
                            '\n Enter day of month to deduct Kes 1400 premium monthly (e.g. 1, 2, 3…31)' +
                            '\n0.Back' +
                            '\n00.Main Menu');
                    }
                    else {
                        // use menu.con() to send response without terminating session
                        menu.con('PIN incorrect. Try again');
                    }
                }),
                next: {
                    '*\\d+': 'buyForSelf.gold.confirm',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            //LEVEL 7
            menu.state('buyForSelf.bronze.confirm', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let day = Number(menu.val);
                    let date = new Date();
                    let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
                    //nextDeduction to be formatted to MM/DD/YYYY
                    //update user details in db
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    // policy that is active
                    let activePolicy = yield Policy.findOne({
                        where: {
                            user_id: user.id,
                            policy_status: 'active'
                        }
                    });
                    if (user && !activePolicy) {
                        //save policy details
                        let policy = {
                            policy_type: 'bronze',
                            beneficiary: 'self',
                            policy_status: 'active',
                            policy_start_date: new Date(),
                            policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                            policy_deduction_day: day * 1,
                            policy_deduction_amount: 300,
                            policy_next_deduction_date: nextDeduction,
                            user_id: user.id
                        };
                        let newPolicy = yield Policy.create(policy);
                        console.log(newPolicy);
                    }
                    else {
                        menu.end('You already have an active policy. \n' +
                            '\n0.Back ' + ' 00.Main Menu');
                    }
                    //SEND SMS TO USER
                    const to = buildInput.phone; //  '+2547xxxxxxxx';
                    const from = 'BLUEWAVE INSURANCE';
                    const message = `PAID Kes 300 to AAR Kenya for Bronze Cover Cover Charge Kes 0. Bal Kes 10,000. TID: 715XXXXXXXX. 
                    Date: ${new Date().toLocaleDateString()}. `;
                    africastalking.SMS.send({
                        to,
                        message,
                        from
                    })
                        .then(response => {
                        console.log(response);
                    })
                        .catch(error => {
                        console.error(error);
                    });
                    menu.con('Confirm \n' +
                        ` Deduct Kes 300  on day ${day} each month. Next deduction will be on ${nextDeduction} \n` +
                        '\n1.Confirm \n' +
                        '\n0.Back ' + ' 00.Main Menu');
                }),
                next: {
                    '1': 'confirmation',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            menu.state('buyForSelf.silver.confirm', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let day = Number(menu.val);
                    let date = new Date();
                    let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
                    //nextDeduction to be formatted to MM/DD/YYYY
                    //update user details in db
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    // policy that is active
                    let activePolicy = yield Policy.findOne({
                        where: {
                            user_id: user.id,
                            policy_status: 'active'
                        }
                    });
                    if (user && !activePolicy) {
                        //save policy details
                        let policy = {
                            policy_type: 'silver',
                            beneficiary: 'self',
                            policy_status: 'active',
                            policy_start_date: new Date(),
                            policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                            policy_deduction_day: day * 1,
                            policy_deduction_amount: 650,
                            policy_next_deduction_date: nextDeduction,
                            user_id: user.id
                        };
                        let newPolicy = yield Policy.create(policy);
                        console.log(newPolicy);
                    }
                    else {
                        menu.con('You already have an active policy. \n' +
                            '\n0.Back ' + ' 00.Main Menu');
                    }
                    menu.con('Confirm \n' +
                        ` Deduct Kes 650  on day ${day} each month. Next deduction will be on ${nextDeduction} \n` +
                        '\n1.Confirm \n' +
                        '\n0.Back ' + ' 00.Main Menu');
                }),
                next: {
                    '1': 'confirmation',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            menu.state('buyForSelf.gold.confirm', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let day = Number(menu.val);
                    let date = new Date();
                    let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
                    //nextDeduction to be formatted to MM/DD/YYYY
                    //update user details in db
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    // policy that is active
                    let activePolicy = yield Policy.findOne({
                        where: {
                            user_id: user.id,
                            policy_status: 'active'
                        }
                    });
                    if (user && !activePolicy) {
                        //save policy details
                        let policy = {
                            policy_type: 'gold',
                            beneficiary: 'self',
                            policy_status: 'active',
                            policy_start_date: new Date(),
                            policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                            policy_deduction_day: day * 1,
                            policy_deduction_amount: 1400,
                            policy_next_deduction_date: nextDeduction,
                            user_id: user.id
                        };
                        let newPolicy = yield Policy.create(policy);
                        console.log(newPolicy);
                    }
                    else {
                        menu.con('You already have an active policy. \n' +
                            '\n0.Back ' + ' 00.Main Menu');
                    }
                    menu.con('Confirm \n' +
                        ` Deduct Kes 1400  on day ${day} each month. Next deduction will be on ${nextDeduction} \n` +
                        '\n1.Confirm \n' +
                        '\n0.Back ' + ' 00.Main Menu');
                }),
                next: {
                    '1': 'confirmation',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            //LEVEL 8
            menu.state('confirmation', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // get policy details kes 300 
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    let policy = yield Policy.findOne({
                        where: {
                            user_id: user.id
                        }
                    });
                    console.log("XXXXXX POLICY XXXXXX", policy);
                    //BOUGHT Family Medical cover for 07XXXXXXXX [FIRST NAME] [LAST NAME]. Inpatient  cover for 300,000  
                    if (policy.policy_status == 'active') {
                        let day = policy.policy_deduction_day;
                        let policy_deduction_amount = policy.policy_deduction_amount;
                        menu.con('Congratulations you are now covered. \n' +
                            `To stay covered Kes ${policy_deduction_amount} will be deducted on day ${day} of every month`);
                    }
                    else {
                        menu.con('You do not have an active policy. \n' +
                            '\n0.Back ' + ' 00.Main Menu');
                    }
                })
            });
            //Buy for family
            menu.state('buyForFamily', {
                run: () => {
                    // use menu.end() to send response and terminate session        
                    menu.end('Buy for family ' +
                        '\n1. Self  – Kes 650' +
                        '\n2. Self + Spouse – Kes 1,040' +
                        '\n3. Self + Spouse + 1 Child -Kes 1,300' +
                        '\n4. Self + Spouse + 2 children – Kes 1,456' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                },
                next: {
                    '1': 'buyForFamily.self',
                    '2': 'buyForFamily.selfSpouse',
                    '3': 'buyForFamily.selfSpouse1Child',
                    '4': 'buyForFamily.selfSpouse2Children',
                }
            });
            //buy for family self
            menu.state('buyForFamily.self', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    //save premium to db users collection
                    // use menu.end() to send response and terminate session
                    menu.con('\nEnter day of the month you want to deduct premium' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '*[0-9]+': 'buyForFamily.self.confirm',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            //buy for family self confirm
            menu.state('buyForFamily.self.confirm', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let day = Number(menu.val);
                    let date = new Date();
                    let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
                    //nextDeduction to be formatted to MM/DD/YYYY
                    //update user details in db
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    // policy that is active
                    let activePolicy = yield Policy.findOne({
                        where: {
                            user_id: user.id,
                            policy_status: 'active'
                        }
                    });
                    if (user && !activePolicy) {
                        //save policy details
                        let policy = {
                            policy_type: 'family',
                            beneficiary: 'self',
                            policy_status: 'active',
                            policy_start_date: new Date(),
                            policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                            policy_deduction_day: day * 1,
                            policy_deduction_amount: 650,
                            policy_next_deduction_date: nextDeduction,
                            user_id: user.id
                        };
                        let newPolicy = yield Policy.create(policy);
                        console.log(newPolicy);
                    }
                    else {
                        menu.con('You already have an active policy. \n' +
                            '\n0.Back ' + ' 00.Main Menu');
                    }
                    menu.con('Confirm \n' +
                        ` Deduct Kes 1400  on day ${day} each month. Next deduction will be on ${nextDeduction} \n` +
                        '\n1.Confirm \n' +
                        '\n0.Back ' + ' 00.Main Menu');
                }),
                next: {
                    '1': 'confirmation',
                    '0': 'account',
                    '00': 'insurance'
                }
            });
            //buy for family selfSpouse1Child
            menu.state('buyForFamily.selfSpouse1Child', {
                run: () => {
                    //save policy details to db
                    // use menu.end() to send response and terminate session
                    menu.con('\nEnter Spouse name' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                },
                next: {
                    '*[a-zA-Z]+': 'buyForFamily.selfSpouse1Child.spouse',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            //buy for family selfSpouse1Child spouse
            menu.state('buyForFamily.selfSpouse1Child.spouse', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let spouse = menu.val;
                    console.log("SPOUSE NAME 1", spouse);
                    //save spouse name to db users collection
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    //update policy details in db
                    //policy end date equals policy start date + 1 year
                    let date = new Date();
                    const policy = {
                        policy_type: 'family',
                        beneficiary: 'selfSpouse1Child',
                        policy_status: 'active',
                        policy_start_date: new Date(),
                        policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                        policy_deduction_amount: 1300,
                        user_id: user.id
                    };
                    let newPolicy = yield Policy.create(policy).catch(err => console.log(err));
                    console.log("new policy 1", newPolicy);
                    //create beneficiary
                    let beneficiary = {
                        full_name: spouse,
                        relationship: 'spouse',
                        user_id: user.id
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary 1", newBeneficiary);
                    // use menu.end() to send response and terminate session
                    menu.con('\n Enter Spouse ID' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '*\\d+': 'buyForFamily.selfSpouse1Child.spouse.id',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            //buy for family selfSpouse1Child spouse id
            menu.state('buyForFamily.selfSpouse1Child.spouse.id', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let id_number = menu.val;
                    console.log("National id 2", id_number);
                    //save spouse id to db users collection
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    console.log("user 2", user.id);
                    //update beneficiary national id
                    let beneficiary = yield Beneficiary.findOne({
                        where: {
                            user_id: user.id
                        }
                    });
                    console.log("new beneficiary 2", beneficiary);
                    if (beneficiary) {
                        beneficiary.national_id = id_number;
                        beneficiary.save().catch(err => console.log(err));
                    }
                    else {
                        menu.con('No beneficiary found. \n' +
                            '\n0.Back ' + ' 00.Main Menu');
                    }
                    // use menu.end() to send response and terminate session
                    // menu.con(` Hospital cover for ${id_number} ${beneficiary.full_name} Kes 1M a year /n` +
                    //     '\nPAY' +
                    //     '\n1. Kes 1300 deducted monthly \n' +
                    //     '\n 2-3,294 yearly' +
                    //     '\n0.Back' +
                    //     '\n00.Main Menu'
                    // )
                    menu.con('\nEnter Child s name' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '*[a-zA-Z]+': 'buyForFamily.selfSpouse1Child.child1',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            //buy for family selfSpouse1Child child1
            menu.state('buyForFamily.selfSpouse1Child.child1', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let child1 = menu.val;
                    console.log("CHILD NAME 3", child1);
                    //save child name to db users collection
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    //create beneficiary
                    let beneficiary = {
                        full_name: child1,
                        relationship: 'child',
                        user_id: user.id
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary 3", newBeneficiary);
                    // use menu.end() to send response and terminate session
                    // use menu.end() to send response and terminate session
                    menu.con('\nEnter day of the month you want to deduct premium' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '*[0-9]+': 'buyForFamily.selfSpouse1Child.confirm',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            //buy for family selfSpouse1Child confirm
            menu.state('buyForFamily.selfSpouse1Child.confirm', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const day = Number(menu.val);
                    const date = new Date();
                    const nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
                    //update policy details in db
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    console.log("user 5", user.id);
                    let policy = yield Policy.findOne({
                        where: {
                            user_id: user.id
                        }
                    });
                    console.log("policy 5", policy);
                    if (policy) {
                        policy.policy_deduction_day = day;
                        policy.policy_next_deduction_date = nextDeduction;
                        policy.save();
                    }
                    // use menu.end() to send response and terminate session
                    menu.con('Confirm \n' +
                        ` Deduct Kes 1456  on day ${day} each month. Next deduction will be on ${nextDeduction} \n` +
                        '\n1.Confirm \n' +
                        '\n0.Back ' + ' 00.Main Menu');
                }),
                next: {
                    '1': 'confirmation',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
                //save premium to db users collection
            });
            //buyForFamily.selfSpouse2Children
            menu.state('buyForFamily.selfSpouse2Children', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con('\nEnter Spouse name' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '*[a-zA-Z]+': 'buyForFamily.selfSpouse2Child.spouse',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            //buyForFamily.selfSpouse2Children spouse
            menu.state('buyForFamily.selfSpouse2Child.spouse', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let spouse = menu.val;
                    console.log("SPOUSE NAME 1", spouse);
                    //save spouse name to db users collection
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    //update policy details in db
                    const policy = {
                        policy_type: 'family',
                        beneficiary: 'selfSpouse2Child',
                        policy_status: 'active',
                        policy_start_date: new Date(),
                        policy_end_date: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
                        policy_deduction_amount: 1456,
                        policy_deduction_day: 1,
                        policy_next_deduction_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
                        user_id: user.id
                    };
                    let newPolicy = yield Policy.create(policy);
                    console.log("new policy 1", newPolicy);
                    //create beneficiary
                    let beneficiary = {
                        full_name: spouse,
                        relationship: 'spouse',
                        user_id: user.id
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary 1", newBeneficiary);
                    // use menu.end() to send response and terminate session
                    menu.con('\n Enter Spouse ID' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '*\\d+': 'buyForFamily.selfSpouse2Child.spouse.id',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            //buy for family selfSpouse2Child spouse id
            menu.state('buyForFamily.selfSpouse2Child.spouse.id', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let id_number = menu.val;
                    console.log(" spouse National id 2", id_number);
                    //save spouse id to db users collection
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    console.log("user", user.id);
                    //update beneficiary national id
                    let beneficiary = yield Beneficiary.findOne({
                        where: {
                            user_id: user.id
                        }
                    });
                    console.log("new beneficiary 2", beneficiary);
                    if (beneficiary) {
                        beneficiary.national_id = id_number;
                        beneficiary.save();
                    }
                    menu.con('\nEnter Child 1 name' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '*[a-zA-Z]+': 'buyForFamily.selfSpouse2Child.child1.name',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            //buyForFamily.selfSpouse2Children child1 name
            menu.state('buyForFamily.selfSpouse2Child.child1.name', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let child1 = menu.val;
                    console.log("child1 3 NAME", child1);
                    //save child1 name to db users collection
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    //create beneficiary
                    let beneficiary = {
                        full_name: child1,
                        relationship: 'child1',
                        user_id: user.id
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary 3", newBeneficiary);
                    // use menu.end() to send response and terminate session
                    menu.con('\n Enter Child 2 name' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '*[a-zA-Z]+': 'buyForFamily.selfSpouse2Child.child2.name',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            //buyForFamily.selfSpouse2Children child2
            menu.state('buyForFamily.selfSpouse2Child.child2.name', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let child2 = menu.val;
                    console.log("child2 4 NAME", child2);
                    //save child2 name to db users collection
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    //create beneficiary
                    let beneficiary = {
                        full_name: child2,
                        relationship: 'child2',
                        user_id: user.id
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary 4", newBeneficiary);
                    menu.con('Pay Kes 1456  deducted monthly.' +
                        '\nTerms&Conditions - www.airtel.com' +
                        '\nEnter PIN to Agree and Pay' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                }),
                next: {
                    '*\\d+': 'buyForFamily.selfSpouse2Child.pin',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            //buyForFamily.selfSpouse2Children pin
            menu.state('buyForFamily.selfSpouse2Child.pin', {
                run: () => {
                    menu.con('Pay Kes 1456  deducted monthly.' +
                        '\nTerms&Conditions - www.airtel.com' +
                        '\nEnter PIN to Agree and Pay' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                },
                next: {
                    '*\\d+': 'buyForFamilySChedule',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            menu.state('buyForFamilyPin', {
                run: () => {
                    console.log("buyForFamilyPin");
                    // use menu.end() to send response and terminate session
                    menu.con('Pay Kes 1300  deducted monthly.' +
                        '\nTerms&Conditions - www.airtel.com' +
                        '\nEnter PIN to Agree and Pay' +
                        '\n0.Back' +
                        '\n00.Main Menu');
                },
                next: {
                    '*\\d+': 'buyForFamilySChedule',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            menu.state('buyForFamilySChedule', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let pin = Number(menu.val);
                    console.log("pin", pin);
                    // get user details
                    let user = yield User.findOne({
                        where: {
                            phone_number: buildInput.phone
                        }
                    });
                    // check if pin is correct
                    if (user.pin == pin) {
                        // use menu.end() to send response and terminate session
                        menu.con('SCHEDULE' +
                            '\n Enter day of month to deduct Kes 1300 premium monthly (e.g. 1, 2, 3…31)' +
                            '\n0.Back' +
                            '\n00.Main Menu');
                    }
                    else {
                        // use menu.con() to send response without terminating session
                        menu.con('PIN incorrect. Try again');
                    }
                }),
                next: {
                    '*\\d+': 'confirmation',
                    '0': 'buyForFamily',
                    '00': 'insurance'
                }
            });
            // RUN THE MENU
            let menu_res = yield menu.run(args);
            // RETURN THE MENU RESPONSE
            resolve(menu_res);
            return;
        }
        catch (e) {
            console.log(e);
            // SOMETHING WENT REALLY WRONG
            reject("END " + lang_1.default[configs_1.default.default_lang].generic.fatal_error);
            return;
        }
    }));
}
exports.default = default_1;
