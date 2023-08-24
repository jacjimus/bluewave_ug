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
const ussd_builder_1 = __importDefault(require("ussd-builder"));
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
require("dotenv").config();
function capitalizeFirstLetter(str) {
    return __awaiter(this, void 0, void 0, function* () {
        return str.charAt(0).toUpperCase() + str.slice(1);
    });
}
const menu = new ussd_builder_1.default();
function handleUssd(args, db) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const Session = db.sessions;
            const User = db.users;
            const Policy = db.policies;
            const Claim = db.claims;
            const Partner = db.partners;
            const Product = db.products;
            const Beneficiary = db.beneficiaries;
            //if  args.phoneNumber has a + then remove it
            if (args.phoneNumber.charAt(0) == "+") {
                args.phoneNumber = args.phoneNumber.substring(1);
            }
            function getUser(phoneNumber) {
                return __awaiter(this, void 0, void 0, function* () {
                    return yield User.findOne({
                        where: {
                            phone_number: phoneNumber,
                        },
                    });
                });
            }
            // Retrieve user using provided phone number
            const user = yield getUser(args.phoneNumber);
            if (!user) {
                throw new Error("User not found");
            }
            // Function to generate a SHA-256 hash
            const generateHash = (data) => {
                const hash = crypto_1.default.createHash('sha256');
                hash.update(data);
                return hash.digest('hex');
            };
            const buildInput = {
                current_input: args.text,
                full_input: args.text,
                masked_input: args.text,
                active_state: configs_1.default.start_state,
                sid: configs_1.default.session_prefix + args.sessionId,
                language: configs_1.default.default_lang,
                phone_number: args.phoneNumber,
                hash: "",
                user_id: user.user_id,
                partner_id: user.partner_id,
            };
            const hashData = `${buildInput.sid}${buildInput.user_id}`;
            const generatedHash = generateHash(hashData);
            // Set the generated hash in the buildInput object
            //buildInput.hash = generatedHash;
            console.log("========  buildInput ===========", buildInput);
            // Check if session exists
            let session = yield Session.findOne({
                where: {
                    sid: buildInput.sid,
                },
            });
            if (!session) {
                // Create new session
                session = yield Session.create(buildInput);
                console.log("New Session:", session);
            }
            else {
                // Update existing session
                yield Session.update(buildInput, {
                    where: {
                        sid: buildInput.sid,
                    },
                });
                console.log("Updated Session:", session);
            }
            // ===============SET START MENU STATES============
            // Set the start state for the menu
            menu.startState({
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Welcome. Choose option:" +
                        "\n1. Send Money" +
                        "\n2. Airtime/Bundles" +
                        "\n3. Withdraw Cash" +
                        "\n4. Pay Bill" +
                        "\n5. Payments" +
                        "\n6. School Fees" +
                        "\n7. Financial Services" +
                        "\n8. Wewole" +
                        "\n9. AirtelMoney Pay" +
                        "\n10. My account" +
                        "\n11. BiZ Wallet");
                }),
                next: {
                    "7": "insurance",
                },
            });
            menu.state("insurance", {
                run: () => {
                    menu.con("Financial Services" +
                        "\n1. Banks" +
                        "\n2. Group Collections" +
                        "\n3. M-SACCO" +
                        "\n4. ATM Withdraw" +
                        "\n5. NSSF Savings" +
                        "\n6. Insurance" +
                        "\n7. Yassako Loans" +
                        "\n8. SACCO" +
                        "\n9. AirtelMoney MasterCard" +
                        "\n10. Loans" +
                        "\n11. Savings" +
                        "\nn  Next");
                },
                next: {
                    "6": "medical_cover",
                },
            });
            menu.state("medical_cover", {
                run: () => {
                    menu.con("Insurance " +
                        "\n1. Medical cover" +
                        "\n2. Auto Insurance" +
                        "\n0. Back" +
                        "\n00. Main Menu");
                },
                next: {
                    "1": "account",
                },
            });
            menu.state("account", {
                run: () => {
                    menu.con("Medical cover " +
                        "\n1. Buy for self" +
                        "\n2. Buy (family)" +
                        "\n3. Buy (others)" +
                        "\n4. Admission Claim" +
                        "\n5. My Account" +
                        "\n6. Choose Hopital" +
                        "\n7. Terms & Conditions" +
                        "\n8. FAQs" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                },
                next: {
                    "1": "buyForSelf",
                    "2": "buyForFamily",
                    "3": "buyForOthers",
                    "4": "makeClaim",
                    "5": "myAccount",
                    "6": "chooseHospital",
                    "7": "termsAndConditions",
                    "8": "faqs",
                },
            });
            //=================BUY FOR SELF=================
            menu.state("buyForSelf", {
                run: () => {
                    menu.con("Buy for self " +
                        "\n1. Bronze  – KES 300" +
                        "\n2. Silver – KES 650" +
                        "\n3. Gold – KES 14,000" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                },
                next: {
                    "1": "buyForSelf.bronze",
                    "2": "buyForSelf.silver",
                    "3": "buyForSelf.gold",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("buyForSelf.bronze", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const user = yield User.findOne({ phone_number: args.phoneNumber });
                        const product = yield Policy.findOne({ where: { partner_id: 1 } });
                        const first_name = capitalizeFirstLetter(user.first_name);
                        const last_name = capitalizeFirstLetter(user.last_name);
                        const full_name = `${first_name} ${last_name}`;
                        const phone_number = user.phone_number;
                        menu.con(`Hospital cover for ${full_name}, ${phone_number} Kes 1M a year 
                          PAY
                          1. KES 300 deducted monthly
                          2. KES 3,292 yearly
                          0. Back
                          00. Main Menu`);
                    }
                    catch (error) {
                        console.error("Error in buyForSelf.bronze:", error);
                        menu.con("An error occurred. Please try again later.");
                    }
                }),
                next: {
                    "1": "buyForSelf.bronze.pay",
                    "2": "buyForSelf.bronze.pay.yearly",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("buyForSelf.bronze.pay", {
                run: () => {
                    menu.con("Pay KES 300 deducted monthly." +
                        "\nTerms&Conditions - www.airtel.com" +
                        "\nEnter PIN to Agree and Pay" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                },
                next: {
                    "*\\d+": "buyForSelf.bronze.pin",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("buyForSelf.bronze.pay.yearly", {
                run: () => {
                    menu.con("Pay KES 3,292 deducted yearly." +
                        "\nTerms&Conditions - www.airtel.com" +
                        "\nEnter PIN to Agree and Pay" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                },
                next: {
                    "*\\d+": "buyForSelf.bronze.yearly.confirm",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("buyForSelf.bronze.pin", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let user_pin = Number(menu.val);
                    const { pin, membership_id } = yield getUser(args.phoneNumber);
                    console.log("USER PIN", user_pin, "PIN", pin);
                    // check if pin is correct
                    if (user_pin !== 1234 ||
                        user_pin == pin ||
                        membership_id == user_pin) {
                        menu.con("SCHEDULE" +
                            "\n Enter day of month to deduct KES 300 premium monthly (e.g. 1, 2, 3…31)" +
                            "\n0.Back" +
                            "\n00.Main Menu");
                    }
                    else {
                        menu.con("PIN incorrect. Try again");
                    }
                }),
                next: {
                    "*\\d+": "buyForSelf.bronze.confirm",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("buyForSelf.bronze.yearly.pin", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let user_pin = Number(menu.val);
                    const { pin, membership_id } = yield getUser(args.phoneNumber);
                    if (user_pin !== 1234 ||
                        user_pin == pin ||
                        membership_id == user_pin) {
                        menu.con("SCHEDULE" +
                            "\n Enter day of month to deduct KES 3,294 premium yearly (e.g. 1, 2, 3…31)" +
                            "\n0.Back" +
                            "\n00.Main Menu");
                    }
                    else {
                        menu.con("PIN incorrect. Try again");
                    }
                }),
                next: {
                    "*\\d+": "buyForSelf.bronze.yearly.confirm",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("buyForSelf.bronze.confirm", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let deduction_day = Number(menu.val);
                    const { pin, user_id, partner_id } = yield getUser(args.phoneNumber);
                    let date = new Date();
                    let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1);
                    //today day of month
                    let day = date.getDate();
                    let countryCode = partner_id == 2 ? "UGA" : "KEN";
                    let currencyCode = partner_id == 2 ? "UGX" : "KES";
                    let policy = {
                        policy_type: "bronze",
                        beneficiary: "self",
                        policy_status: "pending",
                        policy_start_date: new Date(),
                        policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                        policy_deduction_day: day * 1,
                        policy_deduction_amount: 300,
                        policy_next_deduction_date: nextDeduction,
                        user_id: user_id,
                        product_id: 2,
                        premium: 300,
                        installment_order: 1,
                        installment_date: new Date(),
                        installment_alert_date: new Date(),
                        tax_rate_vat: "0.2",
                        tax_rate_ext: "0.25",
                        sum_insured: "300000",
                        excess_premium: "0",
                        discount_premium: "0",
                        partner_id: partner_id,
                        country_code: countryCode,
                        currency_code: currencyCode,
                    };
                    let newPolicy = yield Policy.create(policy);
                    console.log(newPolicy);
                    console.log("NEW POLICY BRONZE SELF", newPolicy);
                    //SEND SMS TO USER
                    //  '+2547xxxxxxxx';
                    //const to = args.phoneNumber + "".replace('+', '');
                    const to = "254" + args.phoneNumber.substring(1);
                    const message = `PAID KES 300 to AAR KENYA for Bronze Cover Cover Charge KES 0. Bal KES 300. TID: 715XXXXXXXX. Date: ${new Date().toLocaleDateString()}. `;
                    //send SMS
                    //const sms = await sendSMS(to, message);
                    menu.con("Confirm \n" +
                        ` Deduct KES 300, Next deduction will be on ${nextDeduction} 
         1.Confirm 
         0.Back 
         00.Main Menu`);
                }),
                next: {
                    "1": "confirmation",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("buyForSelf.bronze.yearly.confirm", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const user_pin = Number(menu.val);
                        const { pin, user_id, partner_id } = yield getUser(args.phoneNumber);
                        if (user_pin !== 1234 && user_pin !== pin) {
                            menu.con("PIN incorrect. Try again");
                            return;
                        }
                        const date = new Date();
                        const day = date.getDate();
                        const nextDeduction = new Date(date.getFullYear() + 1, date.getMonth(), day);
                        const countryCode = partner_id === 2 ? "UGA" : "KEN";
                        const currencyCode = partner_id === 2 ? "UGX" : "KES";
                        const policy = {
                            policy_type: "bronze",
                            beneficiary: "self",
                            policy_status: "pending",
                            policy_start_date: new Date(),
                            policy_end_date: nextDeduction,
                            policy_deduction_day: day,
                            policy_deduction_amount: 3292,
                            policy_next_deduction_date: nextDeduction,
                            product_id: 2,
                            premium: 3292,
                            installment_order: 2,
                            installment_date: nextDeduction,
                            installment_alert_date: nextDeduction,
                            tax_rate_vat: "0.2",
                            tax_rate_ext: "0.25",
                            sum_insured: "300000",
                            excess_premium: "0",
                            discount_premium: "0",
                            user_id: user_id,
                            partner_id: partner_id,
                            country_code: countryCode,
                            currency_code: currencyCode,
                        };
                        const newPolicy = yield Policy.create(policy);
                        const to = args.phoneNumber.replace("+", "");
                        const message = `PAID KES 3,294 to AAR KENYA for Bronze Cover. Cover Charge KES 0. Bal KES 3,294. TID: 715XXXXXXXX. 
    Date: ${new Date().toLocaleDateString()}.`;
                        // Send SMS to user
                        // const sms = await sendSMS(to, message);
                        menu.con(`Confirm\nDeduct KES 3,294, Next deduction will be on ${policy.policy_end_date}\n` +
                            "\n1.Confirm\n" +
                            "\n0.Back\n00.Main Menu");
                    }
                    catch (error) {
                        console.error("Error in buyForSelf.bronze.yearly.confirm:", error);
                        menu.con("An error occurred. Please try again later.");
                    }
                }),
                next: {
                    "1": "confirmation",
                    "0": "account",
                    "00": "insurance",
                },
            });
            //===============CONFIRMATION=================
            menu.state("confirmation", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const { user_id, phone_number, partner_id } = yield getUser(args.phoneNumber);
                        const policy = yield Policy.findOne({
                            where: {
                                user_id: user_id,
                            },
                        });
                        if (policy) {
                            const policy_deduction_amount = policy.policy_deduction_amount;
                            const day = policy.policy_deduction_day;
                            const policy_id = policy.id;
                            const uuid = (0, uuid_1.v4)();
                            const reference = policy.policy_type + policy_id + user_id + uuid;
                            // Call the airtelMoney function and handle payment status
                            let paymentStatus = 200;
                            //await performPayment(userId, partner_id, policy_id, phone_number, policy_deduction_amount, reference, uuid);
                            if (paymentStatus === 200) {
                                menu.end(`Congratulations, you are now covered.\n` +
                                    `To stay covered KES ${policy_deduction_amount} will be deducted on day ${day} of every month`);
                            }
                            else {
                                menu.end(`Sorry, your payment was not successful.\n` +
                                    "\n0.Back\n00.Main Menu");
                            }
                        }
                        else {
                            menu.end("You do not have an active policy.");
                        }
                    }
                    catch (error) {
                        console.error("confirmation Error:", error);
                        menu.end("An error occurred. Please try again later.");
                    }
                }),
            });
            // ================ BUY FOR OTHERS =================
            //ask for phone number and name of person to buy for
            menu.state("buyForOthers", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Enter full name or phone number of person to buy for");
                }),
                next: {
                    "*[a-zA-Z]+": "buyForOthersOptions",
                },
            });
            menu.state("buyForOthersOptions", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const name = menu.val;
                    console.log("NAME:", name);
                    try {
                        const user = yield User.findOne({
                            where: {
                                phone_number: args.phoneNumber,
                            },
                        });
                        if (user) {
                            // Update user's name
                            user.name = name;
                            yield user.save();
                            menu.con("Buy for others" +
                                "\n1. Bronze – KES 300" +
                                "\n2. Silver – KES 650" +
                                "\n3. Gold – KES 14,000" +
                                "\n0. Back" +
                                "\n00. Main Menu");
                        }
                        else {
                            console.log("User not found");
                            menu.con("User not found. Please try again.");
                        }
                    }
                    catch (error) {
                        console.error("Error:", error);
                        menu.con("An error occurred. Please try again.");
                    }
                }),
                next: {
                    "1": "buyForSelf.bronze",
                    "2": "buyForSelf.silver",
                    "3": "buyForSelf.gold",
                    "0": "account",
                    "00": "insurance",
                },
            });
            //================MY ACCOUNT===================
            menu.state("myAccount", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("My Account " +
                        "\n1. Pay Now" +
                        "\n2. Manage auto-renew" +
                        "\n3. My insurance policy" +
                        "\n4. Update profile" +
                        "\n5. Cancel policy" +
                        "\n6. My Hospital" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "1": "payNow",
                    "2": "manageAutoRenew",
                    "3": "myInsurancePolicy",
                    "4": "updateProfile",
                    "5": "cancelPolicy",
                    "6": "myHospitalOption",
                    "0": "account",
                    "00": "insurance",
                },
            });
            //update profile ( user dob and gender)
            menu.state("updateProfile", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con(`Whats your gender
          1.  Male
          2. Female
          0. Back
          00. Main Menu
           `);
                }),
                next: {
                    "1": "updateGender",
                    "2": "updateGender",
                    "0": "myAccount",
                    "00": "insurance",
                },
            });
            menu.state("updateGender", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const gender = menu.val == "1" ? "M" : "F";
                    const user = yield User.update({
                        gender: gender,
                    }, {
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    console.log("USER: ", user);
                    menu.con(`Enter your date of birth in the format DDMMYYYY
          0. Back
          00. Main Menu
           `);
                }),
                next: {
                    "*[0-9]": "updateDob",
                    "0": "myAccount",
                    "00": "insurance",
                },
            });
            menu.state("updateDob", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let dob = menu.val;
                    console.log("dob", dob);
                    // remove all whitespace and non-numeric characters
                    dob = dob.replace(/\D/g, "");
                    console.log("dob", dob);
                    // convert ddmmyyyy to valid date
                    let day = dob.substring(0, 2);
                    let month = dob.substring(2, 4);
                    let year = dob.substring(4, 8);
                    let date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    console.log("date", date);
                    const user = yield User.update({
                        dob: date,
                    }, {
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    console.log("USER DOB UPDATE: ", user);
                    menu.con(`Your profile has been updated successfully
          0. Back
          00. Main Menu
           `);
                }),
                next: {
                    "0": "myAccount",
                    "00": "insurance",
                },
            });
            //==================PAY NOW===================
            menu.state("payNow", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const benefitsByPolicyType = {
                        bronze: "KES 100,000",
                        silver: "KES 100,000",
                        gold: "KES 100,000",
                    };
                    try {
                        const user = yield User.findOne({
                            where: {
                                phone_number: args.phoneNumber,
                            },
                        });
                        const policies = yield Policy.findAll({
                            where: {
                                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            },
                        });
                        if (policies.length === 0) {
                            menu.con("You have no policies\n" +
                                "1. Buy cover\n" +
                                "0. Back\n" +
                                "00. Main Menu");
                            return;
                        }
                        let policyInfo = "";
                        policies.forEach((policy, index) => {
                            const benefit = benefitsByPolicyType[policy.policy_type] || "Unknown Benefit";
                            policyInfo +=
                                `${index + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
                                    `   Inpatient limit: KES ${policy.sum_insured}\n` +
                                    `   Remaining: KES ${policy.sum_insured}\n` +
                                    `   Maternity Benefit: ${benefit}\n\n`;
                        });
                        menu.con(`Choose policy to pay for\n${policyInfo}\n00. Main Menu`);
                    }
                    catch (error) {
                        console.error("Error:", error);
                        menu.con("An error occurred. Please try again later.");
                    }
                }),
                next: {
                    "*\\d+": "choosePolicy",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("choosePolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let policy = Number(menu.val);
                    let user = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    let policies = yield Policy.findAll({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                        },
                    });
                    policies = policies[policy - 1];
                    console.log("POLICIES: ", policies);
                    let { premium, policy_type, beneficiary } = policies;
                    const payment = 200;
                    if (payment == 200) {
                        //Paid Kes 5,000 for Medical cover. Your next payment will be due on day # of [NEXT MONTH]
                        //     menu.end(`Paid Kes ${amount} for Medical cover.
                        // Your next payment will be due on day ${policy_deduction_day} of ${nextMonth}`)
                        menu.end(`Your request for ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()}, KES ${premium} has been received and will be processed shortly.Please enter your Airtel Money PIN when asked.`);
                    }
                    else {
                        menu.end("Payment failed. Please try again");
                    }
                }),
            });
            //============CANCEL POLICY=================
            menu.state("cancelPolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const user = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    if (user) {
                        const policy = yield Policy.findOne({
                            where: {
                                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            },
                        });
                        console.log("POLICY: ", policy);
                        if (policy) {
                            // 1. Cancel Policy
                            menu.con("Hospital cover of Kes 1M a year(100k per night, max 10 nights)" +
                                "Life cover of Kes 4M Funeral Benefit" +
                                "\n1. Cancel Policy");
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
                    "0": "account",
                    "1": "cancelPolicyPin",
                },
            });
            //cancel policy pin
            menu.state("cancelPolicyPin", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const user = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    const policy = yield Policy.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                        },
                    });
                    let today = new Date();
                    console.log("POLICY: ", policy);
                    menu.con(`By cancelling, you will no longer be covered for ${policy.policy_type.toUpperCase()} Insurance as of ${today}.
            Enter PIN to  Confirm cancellation
            0.Back
            00.Main Menu`);
                }),
                next: {
                    "*[0-9]": "cancelPolicyConfirm",
                },
            });
            //cancel policy confirm
            menu.state("cancelPolicyConfirm", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    //const to = '256' + args.phoneNumber.substring(1);
                    const message = " You CANCELLED your Medical cover cover. Your Policy will expire on DD/MM/YYYY and you will not be covered. Dial *187*7*1# to reactivate.";
                    //const sms = await sendSMS(to, message);
                    let today = new Date();
                    //update policy status to cancelled
                    const user = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    let policy;
                    if (user) {
                        policy = yield Policy.findOne({
                            where: {
                                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                            },
                        });
                    }
                    console.log("POLICY: ", policy);
                    if (policy) {
                        // 1. Cancel Policy
                        policy.policy_status = "cancelled";
                        policy.policy_end_date = today;
                        yield policy.save();
                    }
                    menu.con(`Your policy will expire on ${today}  and will not be renewed. Dial *187*7# to reactivate.
            0.Back     00.Main Menu`);
                }),
                next: {
                    "0": "myAccount",
                    "00": "insurance",
                },
            });
            // ============== MY INSURANCE POLICY ==========================
            menu.state("myInsurancePolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const bronzeLastExpenseBenefit = "KES 1,000,000";
                    const silverLastExpenseBenefit = "KES 1,500,000";
                    const goldLastExpenseBenefit = "KES 2,000,000";
                    const user = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    console.log("USER: ", user);
                    if (!user) {
                        menu.con("User not found");
                        return;
                    }
                    let policies = yield Policy.findAll({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                        },
                    });
                    console.log("POLICIES: ", policies);
                    if (policies.length === 0) {
                        menu.con("You have no policies\n" +
                            "1. Buy cover\n" +
                            "0. Back\n" +
                            "00. Main Menu");
                        return;
                    }
                    let policyInfo = "";
                    for (let i = 0; i < policies.length; i++) {
                        let policy = policies[i];
                        let benefit;
                        if (policy.policy_type == "bronze") {
                            benefit = bronzeLastExpenseBenefit;
                        }
                        else if (policy.policy_type == "silver") {
                            benefit = silverLastExpenseBenefit;
                        }
                        else if (policy.policy_type == "gold") {
                            benefit = goldLastExpenseBenefit;
                        }
                        policyInfo +=
                            `${i + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
                                `   Inpatient limit: KES ${policy.sum_insured}\n` +
                                `   Remaining: KES ${policy.sum_insured}\n` +
                                `   Last Expense Per Person Benefit: ${benefit}\n\n`;
                    }
                    menu.end(`My Insurance Policies:\n\n${policyInfo}`);
                }),
                next: {
                    "1": "account",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("manageAutoRenew", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Manage auto-renew " +
                        "\n1. Activate auto-renew" +
                        "\n2. Deactivate auto-renew" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
            });
            //=============== CLAIMS ===================
            menu.state("makeClaim", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const bronzeLastExpenseBenefit = "KES 1,000,000";
                    const silverLastExpenseBenefit = "KES 1,500,000";
                    const goldLastExpenseBenefit = "KES 2,000,000";
                    let user = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    let policies = yield Policy.findAll({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                        },
                    });
                    console.log("POLICIES: ", policies);
                    if (policies.length === 0) {
                        menu.con("You have no policies\n" +
                            "1. Buy cover\n" +
                            "0. Back\n" +
                            "00. Main Menu");
                        return;
                    }
                    let policyInfo = "";
                    for (let i = 0; i < policies.length; i++) {
                        let policy = policies[i];
                        let benefit;
                        if (policy.policy_type == "bronze") {
                            benefit = bronzeLastExpenseBenefit;
                        }
                        else if (policy.policy_type == "silver") {
                            benefit = silverLastExpenseBenefit;
                        }
                        else if (policy.policy_type == "gold") {
                            benefit = goldLastExpenseBenefit;
                        }
                        policyInfo +=
                            `${i + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
                                `   Inpatient limit: KES ${policy.sum_insured}\n` +
                                `   Remaining: KES ${policy.sum_insured}\n` +
                                `   Last Expense Per Person Benefit: ${benefit}\n\n`;
                    }
                    // menu.end(`My Insurance Policies:\n\n${policyInfo}`);
                    menu.con(`Choose policy to make a claim for
        ${policyInfo}
       
        00.Main Menu`);
                }),
                next: {
                    "*\\d+": "choosePolicyTomakeClaim",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("choosePolicyTomakeClaim", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let policy = Number(menu.val);
                    let user = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    let policies = yield Policy.findAll({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.user_id,
                        },
                    });
                    policies = policies[policy - 1];
                    console.log("POLICIES: ", policies);
                    let { user_id, policy_id, premium, policy_type, beneficiary, sum_insured, } = policies;
                    const claim = yield Claim.create({
                        policy_id: policy_id,
                        user_id: user.user_id,
                        claim_date: new Date(),
                        claim_status: "pending",
                        partner_id: user.partner_id,
                        claim_description: "Admission of Claim",
                        claim_type: "medical claim",
                        claim_amount: sum_insured,
                    });
                    console.log("CLAIM", claim);
                    if (claim) {
                        //Paid Kes 5,000 for Medical cover. Your next payment will be due on day # of [NEXT MONTH]
                        //     menu.end(`Paid Kes ${amount} for Medical cover.
                        // Your next payment will be due on day ${policy_deduction_day} of ${nextMonth}`)
                        menu.end(`Admission Claim - CLAIM ID: ${claim.claim_id},  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} - Premium: KES ${premium}, SUM INSURED: KES ${sum_insured} \nProceed to the reception to verify your details\n0. Back\n00. Main Menu"`);
                    }
                    else {
                        menu.end("Claim failed. Please try again");
                    }
                }),
            });
            //==================CHOOSE HOSPITAL===================
            menu.state("chooseHospital", {
                run: () => {
                    menu.con("Welcome to Hospital Finder!\nPlease enter your Country:");
                },
                next: {
                    "*": "selectCountry",
                },
            });
            menu.state("selectCountry", {
                run: () => {
                    const district = menu.val.toLowerCase(); // Convert district name to lowercase
                    const hospitalCounties = {
                        "Nairobi County": [
                            "Kenyatta National Hospital - Nairobi",
                            "Nairobi Hospital - Nairobi",
                            "Aga Khan University Hospital - Nairobi",
                            "Mater Hospital - Nairobi",
                            "MP Shah Hospital - Nairobi",
                        ],
                        "Mombasa County": [
                            "Coast General Hospital - Mombasa",
                            "Pandya Memorial Hospital - Mombasa",
                            "Aga Khan Hospital - Mombasa",
                        ],
                        "Kisumu County": [
                            "Jaramogi Oginga Odinga Teaching and Referral Hospital - Kisumu",
                            "Aga Khan Hospital - Kisumu",
                            "Avenue Healthcare Kisumu",
                            "Milimani Maternity Hospital - Kisumu",
                        ],
                        "Nakuru County": [
                            "Nakuru Level 5 Hospital - Nakuru",
                            "Coptic Hospital - Nakuru",
                            "Mercy Mission Hospital - Nakuru",
                            "St. Mary's Mission Hospital - Nakuru",
                        ],
                        "Eldoret County": [
                            "Moi Teaching and Referral Hospital - Eldoret",
                            "Eldoret Hospital - Eldoret",
                            "Mediheal Hospital - Eldoret",
                            "St. Luke's Hospital - Eldoret",
                        ],
                        "Kisii County": [
                            "Kisii Teaching and Referral Hospital - Kisii",
                            "Christa Marianne Hospital - Kisii",
                            "Getembe Hospital - Kisii",
                        ],
                        "Nyeri County": [
                            "Nyeri County Referral Hospital - Nyeri",
                            "Outspan Hospital - Nyeri",
                            "Consolata Mathari Mission Hospital - Nyeri",
                        ],
                        "Machakos County": [
                            "Machakos Level 5 Hospital - Machakos",
                            "Shalom Community Hospital - Machakos",
                            "PCEA Kikima Hospital - Machakos",
                        ],
                        "Kakamega County": [
                            "Kakamega County General Hospital - Kakamega",
                            "St. Elizabeth Lwak Girls' High School Hospital - Kakamega",
                            "Shihuli Dispensary - Kakamega",
                        ],
                        "Nandi County": [
                            "Kapsabet County Referral Hospital - Nandi",
                            "Tenwek Hospital - Nandi",
                            "Kabianga Hospital - Nandi",
                        ],
                    };
                    const matchingRegions = Object.keys(hospitalCounties).filter((region) => region.toLowerCase().startsWith(district.substring(0, 2)));
                    if (matchingRegions.length > 0) {
                        let message = "Select a hospital region:\n";
                        matchingRegions.forEach((region, index) => {
                            message += `${index + 1}. ${region}\n`;
                        });
                        message += "0. Back";
                        menu.con(message);
                    }
                    else {
                        menu.con("No hospital regions found with the given prefix. Please try a different prefix:");
                    }
                },
                next: {
                    "*\\d+": "selectHospital",
                    "0": "chooseHospital",
                },
            });
            menu.state("chooseCounties", {
                run: () => {
                    const counties = [];
                    let message = "Select a County:\n";
                    counties.forEach((county, index) => {
                        message += `${index + 1}. ${county}\n`;
                    });
                    message += "0. Back";
                    menu.con(message);
                },
                next: {
                    "*\\d+": "selectRegion",
                    "0": "chooseHospital",
                },
            });
            menu.state("selectHospital", {
                run: () => {
                    const hospitalIndex = parseInt(menu.val) - 1;
                    let district = menu.val;
                    console.log("district", district, hospitalIndex);
                    const hospitalCounties = {
                        "Nairobi County": [
                            "Kenyatta National Hospital - Nairobi",
                            "Nairobi Hospital - Nairobi",
                            "Aga Khan University Hospital - Nairobi",
                            "Mater Hospital - Nairobi",
                            "MP Shah Hospital - Nairobi",
                        ],
                        "Mombasa County": [
                            "Coast General Hospital - Mombasa",
                            "Pandya Memorial Hospital - Mombasa",
                            "Aga Khan Hospital - Mombasa",
                        ],
                        "Kisumu County": [
                            "Jaramogi Oginga Odinga Teaching and Referral Hospital - Kisumu",
                            "Aga Khan Hospital - Kisumu",
                            "Avenue Healthcare Kisumu",
                            "Milimani Maternity Hospital - Kisumu",
                        ],
                        "Nakuru County": [
                            "Nakuru Level 5 Hospital - Nakuru",
                            "Coptic Hospital - Nakuru",
                            "Mercy Mission Hospital - Nakuru",
                            "St. Mary's Mission Hospital - Nakuru",
                        ],
                        "Eldoret County": [
                            "Moi Teaching and Referral Hospital - Eldoret",
                            "Eldoret Hospital - Eldoret",
                            "Mediheal Hospital - Eldoret",
                            "St. Luke's Hospital - Eldoret",
                        ],
                        "Kisii County": [
                            "Kisii Teaching and Referral Hospital - Kisii",
                            "Christa Marianne Hospital - Kisii",
                            "Getembe Hospital - Kisii",
                        ],
                        "Nyeri County": [
                            "Nyeri County Referral Hospital - Nyeri",
                            "Outspan Hospital - Nyeri",
                            "Consolata Mathari Mission Hospital - Nyeri",
                        ],
                        "Machakos County": [
                            "Machakos Level 5 Hospital - Machakos",
                            "Shalom Community Hospital - Machakos",
                            "PCEA Kikima Hospital - Machakos",
                        ],
                        "Kakamega County": [
                            "Kakamega County General Hospital - Kakamega",
                            "St. Elizabeth Lwak Girls' High School Hospital - Kakamega",
                            "Shihuli Dispensary - Kakamega",
                        ],
                        "Nandi County": [
                            "Kapsabet County Referral Hospital - Nandi",
                            "Tenwek Hospital - Nandi",
                            "Kabianga Hospital - Nandi",
                        ],
                    };
                    district = Object.keys(hospitalCounties)[hospitalIndex];
                    const hospitals = hospitalCounties[district];
                    console.log("hospitals", hospitals);
                    if (hospitals) {
                        let message = "Select a hospital:\n";
                        hospitals.forEach((hospital, index) => {
                            message += `${index + 1}. ${hospital}\n`;
                        });
                        message += "0. Back";
                        menu.con(message);
                    }
                    else {
                        menu.con("No hospitals found in the selected district. Please try a different district:");
                    }
                },
                next: {
                    "*\\d+": "hospitalDetails",
                    "0": "selectRegion",
                },
            });
            // ================== HOSPITAL DETAILS ===================
            menu.state("hospitalDetails", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const hospitalIndex = parseInt(menu.val) - 1;
                    let county = menu.val;
                    console.log("county", county, hospitalIndex);
                    const hospitalCounties = {
                        "Nairobi County": [
                            "Kenyatta National Hospital - Nairobi",
                            "Nairobi Hospital - Nairobi",
                            "Aga Khan University Hospital - Nairobi",
                            "Mater Hospital - Nairobi",
                            "MP Shah Hospital - Nairobi",
                        ],
                        "Mombasa County": [
                            "Coast General Hospital - Mombasa",
                            "Pandya Memorial Hospital - Mombasa",
                            "Aga Khan Hospital - Mombasa",
                        ],
                        "Kisumu County": [
                            "Jaramogi Oginga Odinga Teaching and Referral Hospital - Kisumu",
                            "Aga Khan Hospital - Kisumu",
                            "Avenue Healthcare Kisumu",
                            "Milimani Maternity Hospital - Kisumu",
                        ],
                        "Nakuru County": [
                            "Nakuru Level 5 Hospital - Nakuru",
                            "Coptic Hospital - Nakuru",
                            "Mercy Mission Hospital - Nakuru",
                            "St. Mary's Mission Hospital - Nakuru",
                        ],
                        "Eldoret County": [
                            "Moi Teaching and Referral Hospital - Eldoret",
                            "Eldoret Hospital - Eldoret",
                            "Mediheal Hospital - Eldoret",
                            "St. Luke's Hospital - Eldoret",
                        ],
                        "Kisii County": [
                            "Kisii Teaching and Referral Hospital - Kisii",
                            "Christa Marianne Hospital - Kisii",
                            "Getembe Hospital - Kisii",
                        ],
                        "Nyeri County": [
                            "Nyeri County Referral Hospital - Nyeri",
                            "Outspan Hospital - Nyeri",
                            "Consolata Mathari Mission Hospital - Nyeri",
                        ],
                        "Machakos County": [
                            "Machakos Level 5 Hospital - Machakos",
                            "Shalom Community Hospital - Machakos",
                            "PCEA Kikima Hospital - Machakos",
                        ],
                        "Kakamega County": [
                            "Kakamega County General Hospital - Kakamega",
                            "St. Elizabeth Lwak Girls' High School Hospital - Kakamega",
                            "Shihuli Dispensary - Kakamega",
                        ],
                        "Nandi County": [
                            "Kapsabet County Referral Hospital - Nandi",
                            "Tenwek Hospital - Nandi",
                            "Kabianga Hospital - Nandi",
                        ],
                    };
                    county = Object.keys(hospitalCounties)[hospitalIndex];
                    const hospitals = hospitalCounties[county];
                    console.log("hospitals", hospitals);
                    if (hospitals) {
                        const hospitalDetails = {
                            "Kenyatta National Hospital - Nairobi": {
                                address: "P.O Box 20723-00202, Nairobi, Kenya",
                                contact: "+254-20-2726300/9, knhadmin@knh.or.ke",
                            },
                            "Nairobi Hospital - Nairobi": {
                                address: "Argwings Kodhek Road, Nairobi, Kenya",
                                contact: "+254-20-2845000/2846000, customercare@nbihosp.org",
                            },
                            "Aga Khan University Hospital - Nairobi": {
                                address: "3rd Parklands Avenue, Nairobi, Kenya",
                                contact: "+254-20-3662000/3750000, akunairobi@aku.edu",
                            },
                            "Mater Hospital - Nairobi": {
                                address: "Dunga Road South B, Nairobi, Kenya",
                                contact: "+254-20-6531199/6533132, info@materkenya.com",
                            },
                            "MP Shah Hospital - Nairobi": {
                                address: "P.O Box 21613-00200, Nairobi, Kenya",
                                contact: "+254-20-4291000, info@mpshahhosp.org",
                            },
                            "Coast General Hospital - Mombasa": {
                                address: "Mama Ngina Drive, Mombasa, Kenya",
                                contact: "+254-41-2312000, info@coastgeneralhospital.co.ke",
                            },
                            "Pandya Memorial Hospital - Mombasa": {
                                address: "Mama Ngina Drive, Mombasa, Kenya",
                                contact: "+254-41-2313383/2312956, info@pandyahospital.com",
                            },
                            "Aga Khan Hospital - Mombasa": {
                                address: "P.O Box 83013-80100, Mombasa, Kenya",
                                contact: "+254-41-2227710/2227712, akhm@akhst.org",
                            },
                            // More hospitals and their details can be added here
                        };
                        const selectedHospital = hospitals[hospitalIndex];
                        console.log("selectedHospital", selectedHospital);
                        const details = hospitalDetails[selectedHospital];
                        console.log("details", details);
                        if (details) {
                            let user = yield User.findOne({
                                where: {
                                    phone_number: args.phoneNumber,
                                },
                            });
                            let updatePolicy = yield Policy.update({
                                hospital_details: {
                                    hospital_name: selectedHospital,
                                    hospital_address: details.address,
                                    hospital_contact: details.contact,
                                },
                            }, {
                                where: {
                                    user_id: user === null || user === void 0 ? void 0 : user.id,
                                },
                            });
                            console.log("updatePolicy", updatePolicy);
                            menu.end(`Hospital: ${selectedHospital}\nAddress: ${details.address}\nContact: ${details.contact}`);
                        }
                        else {
                            menu.end(`Hospital details not found.`);
                        }
                    }
                    else {
                        menu.end(`Invalid hospital selection.`);
                    }
                }),
            });
            menu.state("myHospitalOption", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    //ask if they want to change hospital or see details
                    menu.con(`1. See Details
          2. Change Hospital

          0. Back
          00. Main Menu`);
                }),
                next: {
                    "1": "myHospital",
                    "2": "chooseHospital",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("myHospital", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let user = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    let policy = yield Policy.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.id,
                        },
                    });
                    const hospitalDetails = policy.hospital_details;
                    console.log("hospitalDetails", hospitalDetails);
                    menu.end(`Hospital: ${hospitalDetails.hospital_name}\nAddress: ${hospitalDetails.hospital_address}\nContact: ${hospitalDetails.hospital_contact}`);
                }),
            });
            //=================BUY FOR FAMILY=================
            menu.state("buyForFamily", {
                run: () => {
                    menu.con("Buy for family " +
                        "\n1. Self  – KES 650" +
                        "\n2. Self + Spouse – KES 1,040" +
                        "\n3. Self + Spouse + 1 Child - KES 1,300" +
                        "\n4. Self + Spouse + 2 children – KES 1,456" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                },
                next: {
                    "1": "buyForFamily.self",
                    "2": "buyForFamily.selfSpouse",
                    "3": "buyForFamily.selfSpouse1Child",
                    "4": "buyForFamily.selfSpouse2Children",
                },
            });
            //buy for family self confirm
            menu.state("buyForFamily.self", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let day = Number(menu.val);
                    let date = new Date();
                    let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
                    const { user_id, partner_id } = yield getUser(args.phoneNumber);
                    let countryCode = partner_id == 2 ? "UGA" : "KEN";
                    let currencyCode = partner_id == 2 ? "UGX" : "KES";
                    //save policy details
                    let policy = {
                        policy_type: "bronze",
                        beneficiary: "self",
                        policy_status: "pending",
                        policy_start_date: new Date(),
                        policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                        policy_deduction_day: day * 1,
                        policy_deduction_amount: 650,
                        policy_next_deduction_date: nextDeduction,
                        premium: 650,
                        installment_order: 1,
                        installment_date: nextDeduction,
                        installment_alert_date: nextDeduction,
                        tax_rate_vat: "0.2",
                        tax_rate_ext: "0.25",
                        sum_insured: "300000",
                        excess_premium: "0",
                        discount_premium: "0",
                        partner_id: partner_id,
                        user_id: user_id,
                        country_code: countryCode,
                        currency_code: currencyCode,
                        product_id: 2,
                    };
                    let newPolicy = yield Policy.create(policy);
                    console.log("NEW POLICY FAMILY SELF", newPolicy);
                    menu.con("Confirm \n" +
                        ` Deduct KES ${policy.premium}, Next deduction will be on ${nextDeduction} \n` +
                        "\n1.Confirm \n" +
                        "\n0.Back " +
                        " 00.Main Menu");
                }),
                next: {
                    "1": "confirmation",
                    "0": "account",
                    "00": "insurance",
                },
            });
            //=============BUY FOR FAMILY SELF SPOUSE================
            menu.state("buyForFamily.selfSpouse", {
                run: () => {
                    //save policy details to db
                    menu.con("\nEnter Spouse name" + "\n0.Back" + "\n00.Main Menu");
                },
                next: {
                    "*[a-zA-Z]+": "buyForFamily.selfSpouse.spouse",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buyForFamily.selfSpouse.spouse
            menu.state("buyForFamily.selfSpouse.spouse", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let spouse = menu.val;
                    const { user_id, partner_id } = yield getUser(args.phoneNumber);
                    let date = new Date();
                    let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);
                    let countryCode = User.partner_id == 2 ? "UGA" : "KEN";
                    let currencyCode = User.partner_id == 2 ? "UGX" : "KES";
                    const policy = {
                        policy_type: "bronze",
                        beneficiary: "selfSpouse",
                        policy_status: "pending",
                        policy_start_date: new Date(),
                        policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                        policy_deduction_amount: 1040,
                        premium: 1040,
                        installment_order: 1,
                        installment_date: nextDeduction,
                        installment_alert_date: nextDeduction,
                        tax_rate_vat: "0.2",
                        tax_rate_ext: "0.25",
                        sum_insured: "300000",
                        excess_premium: "0",
                        discount_premium: "0",
                        partner_id: partner_id,
                        user_id: user_id,
                        country_code: countryCode,
                        currency_code: currencyCode,
                        product_id: 2,
                    };
                    let newPolicy = yield Policy.create(policy).catch((err) => console.log(err));
                    console.log("NEW POLICY FAMILY SELFSPOUSE", newPolicy);
                    let beneficiary = {
                        full_name: spouse,
                        relationship: "spouse",
                        user_id: user_id,
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary 1", newBeneficiary);
                    menu.con("\n Enter Spouse National ID" + "\n0.Back" + "\n00.Main Menu");
                }),
                next: {
                    "*\\d+": "buyForFamily.selfSpouse.spouse.id",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buyForFamily.selfSpouse.spouse.id
            menu.state("buyForFamily.selfSpouse.spouse.id", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let id_number = menu.val;
                    console.log("National id 2", id_number);
                    const { user_id } = yield getUser(args.phoneNumber);
                    //update beneficiary national id
                    let beneficiary = yield Beneficiary.findOne({
                        where: {
                            user_id: user_id,
                        },
                    });
                    console.log("new beneficiary 2", beneficiary);
                    if (beneficiary) {
                        beneficiary.national_id = id_number;
                        beneficiary.save().catch((err) => console.log(err));
                    }
                    else {
                        menu.con("No beneficiary found. \n" + "\n0.Back " + " 00.Main Menu");
                    }
                    menu.con("\nEnter day of the month you want to deduct premium" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "*[0-9]+": "buyForFamily.selfSpouse.confirm",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buyForFamily.selfSpouse.confirm
            menu.state("buyForFamily.selfSpouse.confirm", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const day = Number(menu.val);
                    const date = new Date();
                    const nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
                    const { user_id, partner_id } = yield getUser(args.phoneNumber);
                    let policy = yield Policy.findOne({
                        where: {
                            user_id: user_id,
                        },
                    });
                    console.log("policy", policy);
                    if (policy) {
                        policy.policy_deduction_day = day;
                        policy.policy_next_deduction_date = nextDeduction;
                        policy.save();
                    }
                    menu.con("Confirm \n" +
                        ` Deduct KES 1,040 on day ${day} of each month. Next deduction will be on ${nextDeduction} \n` +
                        "\n1.Confirm \n" +
                        "\n0.Back " +
                        " 00.Main Menu");
                }),
                next: {
                    "1": "confirmation",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //=============BUY FOR FAMILY SELF SPOUSE 1 CHILD================
            menu.state("buyForFamily.selfSpouse1Child", {
                run: () => {
                    menu.con("\nEnter Spouse name" + "\n0.Back" + "\n00.Main Menu");
                },
                next: {
                    "*[a-zA-Z]+": "buyForFamily.selfSpouse1Child.spouse",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buy for family selfSpouse1Child spouse
            menu.state("buyForFamily.selfSpouse1Child.spouse", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let spouse = menu.val;
                    console.log("SPOUSE NAME 1", spouse);
                    const { user_id, partner_id } = yield getUser(args.phoneNumber);
                    let date = new Date();
                    let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);
                    let countryCode = partner_id == 2 ? "UGA" : "KEN";
                    let currencyCode = partner_id == 2 ? "UGX" : "KES";
                    const policy = {
                        policy_type: "bronze",
                        beneficiary: "selfSpouse1Child",
                        policy_status: "pending",
                        policy_start_date: new Date(),
                        policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                        policy_deduction_amount: 1300,
                        policy_deduction_day: 1,
                        policy_next_deduction_date: nextDeduction,
                        premium: 1300,
                        installment_order: 1,
                        installment_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                        installment_alert_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                        tax_rate_vat: "0.2",
                        tax_rate_ext: "0.25",
                        sum_insured: "300000",
                        excess_premium: "0",
                        discount_premium: "0",
                        partner_id: partner_id,
                        user_id: user_id,
                        country_code: countryCode,
                        currency_code: currencyCode,
                        product_id: 2,
                    };
                    let newPolicy = yield Policy.create(policy).catch((err) => console.log(err));
                    console.log("NEW POLICY FAMILY SELFSPOUSE1CHILD", newPolicy);
                    let beneficiary = {
                        full_name: spouse,
                        relationship: "spouse",
                        user_id: user_id,
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary 1", newBeneficiary);
                    menu.con("\n Enter Spouse ID" + "\n0.Back" + "\n00.Main Menu");
                }),
                next: {
                    "*\\d+": "buyForFamily.selfSpouse1Child.spouse.id",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buy for family selfSpouse1Child spouse id
            menu.state("buyForFamily.selfSpouse1Child.spouse.id", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let id_number = menu.val;
                    console.log("National id 2", id_number);
                    const { user_id } = yield getUser(args.phoneNumber);
                    let beneficiary = yield Beneficiary.findOne({
                        where: {
                            user_id: user_id,
                        },
                    });
                    console.log("new beneficiary 2", beneficiary);
                    if (beneficiary) {
                        beneficiary.national_id = id_number;
                        beneficiary.save().catch((err) => console.log(err));
                    }
                    else {
                        menu.con("No beneficiary found. \n" + "\n0.Back " + " 00.Main Menu");
                    }
                    menu.con("\nEnter Child s name" + "\n0.Back" + "\n00.Main Menu");
                }),
                next: {
                    "*[a-zA-Z]+": "buyForFamily.selfSpouse1Child.child1",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buy for family selfSpouse1Child child1
            menu.state("buyForFamily.selfSpouse1Child.child1", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let child1 = menu.val;
                    console.log("CHILD NAME 3", child1);
                    const { user_id } = yield getUser(args.phoneNumber);
                    let beneficiary = {
                        full_name: child1,
                        relationship: "child",
                        user_id: user_id,
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary 3", newBeneficiary);
                    menu.con("\nEnter day of the month you want to deduct premium" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "*[0-9]+": "buyForFamily.selfSpouse1Child.confirm",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buy for family selfSpouse1Child confirm
            menu.state("buyForFamily.selfSpouse1Child.confirm", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let child1 = menu.val;
                    console.log("CHILD NAME 3", child1);
                    const { user_id } = yield getUser(args.phoneNumber);
                    let beneficiary = {
                        full_name: child1,
                        relationship: "child",
                        user_id: user_id,
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary 3", newBeneficiary);
                    const day = Number(menu.val);
                    const date = new Date();
                    const nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
                    let policy = yield Policy.findAll({
                        where: {
                            user_id: user_id,
                        },
                    });
                    policy = policy[policy.length - 1];
                    console.log("policy", policy);
                    if (policy) {
                        policy.policy_deduction_day = day;
                        policy.policy_next_deduction_date = nextDeduction;
                        policy.save();
                    }
                    menu.con("Confirm \n" +
                        ` Deduct KES ${policy.premium}, Next deduction will be on  ${nextDeduction} \n` +
                        "\n1.Confirm \n" +
                        "\n0.Back " +
                        " 00.Main Menu");
                }),
                next: {
                    "1": "confirmation",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //===========BUY FOR FAMILY SELF SPOUSE 2 CHILDREN==================
            menu.state("buyForFamily.selfSpouse2Children", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("\nEnter Spouse name" + "\n0.Back" + "\n00.Main Menu");
                }),
                next: {
                    "*[a-zA-Z]+": "buyForFamily.selfSpouse2Child.spouse",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buyForFamily.selfSpouse2Children spouse
            menu.state("buyForFamily.selfSpouse2Child.spouse", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let spouse = menu.val;
                    console.log("SPOUSE NAME 1", spouse);
                    const { user_id, partner_id } = yield getUser(args.phoneNumber);
                    let countryCode = partner_id == 2 ? "UGA" : "KEN";
                    let currencyCode = partner_id == 2 ? "UGX" : "KES";
                    const policy = {
                        policy_type: "bronze",
                        beneficiary: "selfSpouse2Child",
                        policy_status: "pending",
                        policy_start_date: new Date(),
                        policy_end_date: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
                        policy_deduction_amount: 1456,
                        policy_deduction_day: 1,
                        policy_next_deduction_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                        premium: 1456,
                        installment_order: 1,
                        installment_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                        installment_alert_date: new Date(new Date().getFullYear() + 1, new Date().getMonth() + 1, new Date().getDate()),
                        tax_rate_vat: "0.2",
                        tax_rate_ext: "0.25",
                        sum_insured: "300000",
                        excess_premium: "0",
                        discount_premium: "0",
                        partner_id: partner_id,
                        user_id: user_id,
                        country_code: countryCode,
                        currency_code: currencyCode,
                        product_id: 2,
                    };
                    let newPolicy = yield Policy.create(policy);
                    console.log("NEW POLICY FAMILY SELFSPOUSE2CHILD", newPolicy);
                    let beneficiary = {
                        full_name: spouse,
                        relationship: "spouse",
                        user_id: user_id,
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary 1", newBeneficiary);
                    menu.con("\n Enter Spouse ID" + "\n0.Back" + "\n00.Main Menu");
                }),
                next: {
                    "*\\d+": "buyForFamily.selfSpouse2Child.spouse.id",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buy for family selfSpouse2Child spouse id
            menu.state("buyForFamily.selfSpouse2Child.spouse.id", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let id_number = menu.val;
                    console.log(" spouse National id 2", id_number);
                    //save spouse id to db users collection
                    const { user_id, partner_id } = yield getUser(args.phoneNumber);
                    //update beneficiary national id
                    let beneficiary = yield Beneficiary.findOne({
                        where: {
                            user_id: user_id,
                        },
                    });
                    console.log("new beneficiary 2", beneficiary);
                    if (beneficiary) {
                        beneficiary.national_id = id_number;
                        beneficiary.save();
                    }
                    menu.con("\nEnter Child 1 name" + "\n0.Back" + "\n00.Main Menu");
                }),
                next: {
                    "*[a-zA-Z]+": "buyForFamily.selfSpouse2Child.child1.name",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buyForFamily.selfSpouse2Children child1 name
            menu.state("buyForFamily.selfSpouse2Child.child1.name", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    // use menu.val to access user input value
                    let child1 = menu.val;
                    console.log("child1 3 NAME", child1);
                    //save child1 name to db users collection
                    const { user_id } = yield getUser(args.phoneNumber);
                    //create beneficiary
                    let beneficiary = {
                        full_name: child1,
                        relationship: "child1",
                        user_id: user_id,
                    };
                    let newBeneficiary = yield Beneficiary.create(beneficiary);
                    console.log("new beneficiary 3", newBeneficiary);
                    menu.con("\n Enter Child 2 name" + "\n0.Back" + "\n00.Main Menu");
                }),
                next: {
                    "*[a-zA-Z]+": "buyForFamily.selfSpouse2Child.child2.name",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buyForFamily.selfSpouse2Children child2
            menu.state("buyForFamily.selfSpouse2Child.child2.name", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const child2 = menu.val;
                        const { user_id } = yield getUser(args.phoneNumber);
                        const beneficiary = {
                            full_name: child2,
                            relationship: "child2",
                            user_id: user_id,
                        };
                        const newBeneficiary = yield Beneficiary.create(beneficiary);
                        menu.con(`Pay KES 1,456 deducted monthly.
                    Terms&Conditions - www.airtel.com
                    Enter PIN to Agree and Pay
                    0.Back
                    00.Main Menu`);
                    }
                    catch (error) {
                        console.error("buyForFamily.selfSpouse2Child.child2.name Error:", error);
                        menu.end("An error occurred. Please try again later.");
                    }
                }),
                next: {
                    "*\\d+": "buyForFamily.selfSpouse2Child.pin",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //buyForFamily.selfSpouse2Children pin
            menu.state("buyForFamily.selfSpouse2Child.pin", {
                run: () => {
                    menu.con(`Pay KES 1,456 deducted monthly.
                            Terms&Conditions - www.airtel.com
                            Enter PIN to Agree and Pay
                            n0.Back
                            00.Main Menu`);
                },
                next: {
                    "*\\d+": "buyForFamilySChedule",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            menu.state("buyForFamilyPin", {
                run: () => {
                    console.log("buyForFamilyPin");
                    menu.con(`Pay 1, deducted monthly.
                    Terms&Conditions - www.airtel.com
                    Enter PIN or Membership Number to Agree and Pay
                    n0.Back
                    00.Main Menu`);
                },
                next: {
                    "*\\d+": "confirmation",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            menu.state("buyForFamilySchedule", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const user_pin = Number(menu.val);
                        const { user_id, pin, membership_id } = yield getUser(args.phoneNumber);
                        if (user_pin === pin || user_pin === membership_id) {
                            const policy = yield Policy.findOne({
                                where: {
                                    user_id: user_id,
                                },
                            });
                            const policy_deduction_amount = policy.policy_deduction_amount;
                            menu.con(`SCHEDULE
                        Enter day of month to deduct KES ${policy_deduction_amount} premium monthly (e.g. 1, 2, 3…31)
                        0.Back
                        00.Main Menu`);
                        }
                        else {
                            menu.con("PIN incorrect. Try again");
                        }
                    }
                    catch (error) {
                        console.error("buyForFamilySchedule Error:", error);
                        menu.end("An error occurred. Please try again later.");
                    }
                }),
                next: {
                    "*\\d+": "confirmation",
                    "0": "buyForFamily",
                    "00": "insurance",
                },
            });
            //===================TERMS AND CONDITIONS===================
            menu.state("termsAndConditions", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    //change to kenya phone number format if not make to kenya format
                    // if (!isValidKenyanPhoneNumber(buildInput.phone)) {
                    //     buildInput.phone = `254${buildInput.phone.substring(1)}`;
                    // }
                    const to = `+${args.phoneNumber}`;
                    // console.log(buildIt.phoneNumber, to)
                    const message = "Visit [LINK TBC] to Terms & Conditions. A link will also be sent by SMS";
                    console.log(to);
                    //const sms = await sendSMS(to, message);
                    menu.end("Visit [LINK TBC] to Terms & Conditions. A link will also be sent by SMS");
                }),
            });
            //==================FAQS===================
            menu.state("faqs", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("FAQs " +
                        "\n1. Eligibility" +
                        "\n2. Bronze cover" +
                        "\n3. Silver Cover" +
                        "\n4. Gold cover" +
                        "\n5. Auto-renew" +
                        "\n6. Waiting period" +
                        "\n7. When to make claim" +
                        "\n8. Claim Payment" +
                        "\n9. Change Name" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "1": "eligibility",
                    "2": "bronzeCover",
                    "3": "silverCover",
                    "4": "goldCover",
                    "5": "autoRenew",
                    "6": "waitingPeriod",
                    "7": "whenToMakeClaim",
                    "8": "claimPayment",
                    "9": "changeName",
                },
            });
            menu.state("eligibility", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end("Persons between the age of 18 and 65 are eligible to purchase Medical cover Policy" +
                        "\nTs&Cs apply");
                }),
            });
            menu.state("bronzeCover", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end("Get Free Cover for Bronze Hospitalization cover for 30 nights / year " +
                        "\nPays keys 4,500 per night from 2nd night. Payout for ICU is Kes9,000 for max 10 nights" +
                        "\nTs&Cs apply");
                }),
            });
            menu.state("silverCover", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end("Outpatient limit of Kes 300,000" +
                        "\nMaternity covered up to Kes 100,000" +
                        "\nCan cover up to 6 dependents" +
                        "\nTs&Cs apply");
                }),
            });
            menu.state("goldCover", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end("Outpatient limit of Kes 400,000" +
                        "\nMaternity covered up to Kes 100,000" +
                        "\nCan cover up to 6 dependents" +
                        "\nTs&Cs apply");
                }),
            });
            menu.state("autoRenew", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end("To stay covered, the premium amount will be deducted automatically from your Airtel Money account on the selected day per month" +
                        "\nTs&Cs apply");
                }),
            });
            menu.state("waitingPeriod", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end("This means the days before benefits become fully active. For the first 30 DAYS, only hospitalizations due to ACCIDENT will be covered. " +
                        "\n10 month waiting period for pre-existing conditions." +
                        "\nTs&Cs apply");
                }),
            });
            menu.state("whenToMakeClaim", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end("Make Hospital claim when you spend MORE THAN 1 NIGHT in the hospital. " +
                        "\nA" +
                        "\nTs&Cs apply");
                }),
            });
            menu.state("claimPayment", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end("Claims will be paid to customer’s Airtel  wallet (Bronze) or to the hospital for Silver and Gold" +
                        "\nTs&Cs apply");
                }),
            });
            menu.state("changeName", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.end("Policy will cover person whose name SIM is registered in. To change, visit Airtel Service Center with your National ID to Register this SIM Card in your name" +
                        "\nTs&Cs apply");
                }),
            });
            // RUN THE MENU
            const menuRes = yield menu.run(args);
            // RETURN THE MENU RESPONSE
            resolve(menuRes);
        }
        catch (error) {
            console.error(error);
            // SOMETHING WENT REALLY WRONG
            reject("END " + lang_1.default[configs_1.default.default_lang].generic.fatal_error);
        }
    }));
}
exports.default = handleUssd;
