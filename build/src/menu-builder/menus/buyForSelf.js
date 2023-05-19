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
exports.buyForSelf = void 0;
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const payment_1 = __importDefault(require("../../services/payment"));
const uuid_1 = require("uuid");
function buyForSelf(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    //const Claim = db.claims;
    //const Session = db.sessions;
    //const Beneficiary = db.beneficiaries;
    //const Transaction = db.transactions;
    if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
    }
    console.log("ARGS PHONE NUMBER", args.phoneNumber);
    function getUser(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield User.findOne({
                where: {
                    phone_number: phoneNumber
                }
            });
        });
    }
    menu.state('buyForSelf', {
        run: () => {
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
    //}
    //================= BUY FOR SELF BRONZE =================
    //export function buyForSelfBronze(menu: any,  args:any, User:any): void {
    menu.state('buyForSelf.bronze', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const { id, name } = yield getUser(args.phoneNumber);
            let user_name = name === null || name === void 0 ? void 0 : name.split(' ')[0];
            //capitalize first letter of name
            user_name = user_name.charAt(0).toUpperCase() + user_name.slice(1);
            menu.con(`Hospital cover for ${user_name}, ${args.phone} Kes 1M a year 
                    PAY
                    1. Kes 300 deducted monthly
                    2. Kes 3,294 yearly
                    0. Back
                    00. Main Menu`);
        }),
        next: {
            '1': 'buyForSelf.bronze.pay',
            '2': 'buyForSelf.bronze.pay.yearly',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.bronze.pay', {
        run: () => {
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
    menu.state('buyForSelf.bronze.pay.yearly', {
        run: () => {
            menu.con('Pay Kes 3,294 deducted yearly.' +
                '\nTerms&Conditions - www.airtel.com' +
                '\nEnter PIN to Agree and Pay' +
                '\n0.Back' +
                '\n00.Main Menu');
        },
        next: {
            '*\\d+': 'buyForSelf.bronze.yearly.pin',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.bronze.pin', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            // use menu.val to access user input value
            let user_pin = Number(menu.val);
            const { pin } = yield getUser(args.phoneNumber);
            // check if pin is correct
            if (user_pin == pin) {
                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct Kes 300 premium monthly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu');
            }
            else {
                menu.con('PIN incorrect. Try again');
            }
        }),
        next: {
            '*\\d+': 'buyForSelf.bronze.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.bronze.yearly.pin', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            // use menu.val to access user input value
            let user_pin = Number(menu.val);
            const { pin } = yield getUser(args.phoneNumber);
            // check if pin is correct
            if (user_pin == pin) {
                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct Kes 3,294 premium yearly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu');
            }
            else {
                menu.con('PIN incorrect. Try again');
            }
        }),
        next: {
            '*\\d+': 'buyForSelf.bronze.yearly.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.bronze.confirm', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            // use menu.val to access user input value
            let day = Number(menu.val);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
            //nextDeduction to be formatted to MM/DD/YYYY
            //update user details in db
            const { id } = yield getUser(args.phoneNumber);
            // policy that is active
            let activePolicy = yield Policy.findOne({
                where: {
                    user_id: id,
                    policy_status: 'active'
                }
            });
            if (id && !activePolicy) {
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
                    user_id: id
                };
                let newPolicy = yield Policy.create(policy);
                console.log(newPolicy);
                console.log("NEW POLICY BRONZE SELF", newPolicy);
            }
            else {
                menu.con('You already have an active policy. \n' +
                    '\n0.Back ' + ' 00.Main Menu');
            }
            //SEND SMS TO USER
            //  '+2547xxxxxxxx';
            //const to = args.phoneNumber + "".replace('+', '');
            const to = '254' + args.phoneNumber.substring(1);
            const message = `PAID KES 300 to AAR Kenya for Bronze Cover Cover Charge Kes 0. Bal Kes 10,000. TID: 715XXXXXXXX. 
        Date: ${new Date().toLocaleDateString()}. `;
            //send SMS
            const sms = yield (0, sendSMS_1.default)(to, message);
            menu.con('Confirm \n' +
                ` Deduct Kes 300  on day ${day} each month. Next deduction will be on ${nextDeduction} 
             1.Confirm 
             0.Back 
             00.Main Menu`);
        }),
        next: {
            '1': 'confirmation',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.bronze.yearly.confirm', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            // use menu.val to access user input value
            let day = Number(menu.val);
            let date = new Date();
            //next deductin next year
            let nextDeduction = new Date(date.getFullYear() + 1, date.getMonth(), day);
            const month = nextDeduction.toLocaleString('default', { month: 'long' });
            //nextDeduction to be formatted to MM/DD/YYYY
            const { id } = yield getUser(args.phoneNumber);
            let activePolicy = yield Policy.findOne({
                where: {
                    user_id: id,
                    policy_status: 'active'
                }
            });
            if (id && !activePolicy) {
                //save policy details
                let policy = {
                    policy_type: 'bronze',
                    beneficiary: 'self',
                    policy_status: 'active',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 3294,
                    policy_next_deduction_date: nextDeduction,
                    user_id: id
                };
                let newPolicy = yield Policy.create(policy);
                console.log(newPolicy);
                console.log("NEW POLICY BRONZE SELF", newPolicy);
            }
            else {
                menu.con('You already have an active policy. \n' +
                    '\n0.Back ' + ' 00.Main Menu');
            }
            //SEND SMS TO USER
            //  '+2547xxxxxxxx';
            const to = args.phoneNumber + "".replace('+', ''); //  '+2547xxxxxxxx';
            console.log("TO: ", to);
            const message = `PAID Kes 3,294 to AAR Kenya for Bronze Cover Cover Charge Kes 0. Bal Kes 10,000. TID: 715XXXXXXXX. 
        Date: ${new Date().toLocaleDateString()}. `;
            const sms = yield (0, sendSMS_1.default)(to, message);
            menu.con('Confirm \n' +
                ` Deduct Kes 3,294  on day ${day}, ${month} each year. Next deduction will be on ${nextDeduction} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu');
        }),
        next: {
            '1': 'confirmation',
            '0': 'account',
            '00': 'insurance'
        }
    });
    //================= BUY FOR SELF SILVER =================
    menu.state('buyForSelf.silver', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const { name } = yield getUser(args.phoneNumber);
            let user_name = name.split(' ')[0];
            //capitalize first letter of name
            user_name = user_name.charAt(0).toUpperCase() + user_name.slice(1);
            menu.con(`Hospital cover for ${user_name}, ${args.phoneNumber} Kes 1M a year 
                    PAY' +
                    1. Kes 650 deducted monthly 
                    2. Kes 7,650 yearly
                    0.Back
                    00.Main Menu`);
        }),
        next: {
            '1': 'buyForSelf.silver.pay',
            '2': 'buyForSelf.silver.yearly.pay',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.silver.pay', {
        run: () => {
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
    menu.state('buyForSelf.silver.yearly.pay', {
        run: () => {
            menu.con('Pay Kes 7,650  deducted yearly.' +
                '\nTerms&Conditions - www.airtel.com' +
                '\nEnter PIN to Agree and Pay' +
                '\n0.Back' +
                '\n00.Main Menu');
        },
        next: {
            '*\\d+': 'buyForSelf.silver.yearly.pin',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.silver.pin', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let user_pin = Number(menu.val);
            const { pin } = yield getUser(args.phoneNumber);
            // check if pin is correct
            if (user_pin == pin) {
                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct Kes 650 premium monthly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu');
            }
            else {
                menu.con('PIN incorrect. Try again');
            }
        }),
        next: {
            '*\\d+': 'buyForSelf.silver.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.silver.yearly.pin', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let user_pin = Number(menu.val);
            const { pin } = yield getUser(args.phoneNumber);
            // check if pin is correct
            if (user_pin == pin) {
                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct Kes 7,650 premium yearly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu');
            }
            else {
                menu.con('PIN incorrect. Try again');
            }
        }),
        next: {
            '*\\d+': 'buyForSelf.silver.yearly.confirm',
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
            const { id } = yield getUser(args.phoneNumber);
            // policy that is active
            let activePolicy = yield Policy.findOne({
                where: {
                    user_id: id,
                    policy_status: 'active'
                }
            });
            if (id && !activePolicy) {
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
                    user_id: id
                };
                let newPolicy = yield Policy.create(policy);
                console.log(newPolicy);
                console.log("NEW POLICY SILVER SELF", newPolicy);
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
    menu.state('buyForSelf.silver.yearly.confirm', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let day = Number(menu.val);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear() + 1, date.getMonth(), day);
            //get month from nextDeduction
            const month = nextDeduction.toLocaleString('default', { month: 'long' });
            //nextDeduction to be formatted to MM/DD/YYYY
            //update user details in db
            const { id } = yield getUser(args.phoneNumber);
            let activePolicy = yield Policy.findOne({
                where: {
                    user_id: id,
                    policy_status: 'active'
                }
            });
            if (id && !activePolicy) {
                //save policy details
                let policy = {
                    policy_type: 'silver',
                    beneficiary: 'self',
                    policy_status: 'active',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 7650,
                    policy_next_deduction_date: nextDeduction,
                    user_id: id
                };
                let newPolicy = yield Policy.create(policy);
                console.log(newPolicy);
                console.log("NEW POLICY SILVER SELF", newPolicy);
            }
            else {
                menu.con('You already have an active policy. \n' +
                    '\n0.Back ' + ' 00.Main Menu');
            }
            menu.con('Confirm \n' +
                ` Deduct Kes 7,650  on day ${day}, ${month} each year. Next deduction will be on ${nextDeduction} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu');
        }),
        next: {
            '1': 'confirmation',
            '0': 'account',
            '00': 'insurance'
        }
    });
    //================= BUY FOR SELF GOLD =================
    menu.state('buyForSelf.gold', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            });
            console.log("USER: ", user);
            let user_name = user === null || user === void 0 ? void 0 : user.name.split(' ')[0];
            //capitalize first letter of name
            let name = user_name.charAt(0).toUpperCase() + user_name.slice(1);
            menu.con(`Hospital cover for ${name}, ${args.phoneNumber} Kes 1M a year 
                        PAY
                        1. Kes 1400 deducted monthly 
                        2. Kes 16,800 yearly
                        0.Back
                        00.Main Menu`);
        }),
        next: {
            '1': 'buyForSelf.gold.pay',
            '2': 'buyForSelf.gold.yearly.pay',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.gold.pay', {
        run: () => {
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
    menu.state('buyForSelf.gold.pin', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            // use menu.val to access user input value
            let pin = Number(menu.val);
            // check if pin is correct
            let user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            });
            console.log("USER: ", user); // check if pin is correct
            if (user && user.pin == pin) {
                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct Kes 1400 premium monthly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu');
            }
            else {
                menu.con('PIN incorrect. Try again');
            }
        }),
        next: {
            '*\\d+': 'buyForSelf.gold.confirm',
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
                    phone_number: args.phoneNumber
                }
            });
            console.log("USER: ", user); // policy that is active
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
                console.log("NEW POLICY GOLD SELF", newPolicy);
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
    menu.state('buyForSelf.gold.yearly.pay', {
        run: () => {
            menu.con('Pay Kes 16,800  deducted yearly.' +
                '\nTerms&Conditions - www.airtel.com' +
                '\nEnter PIN to Agree and Pay' +
                '\n0.Back' +
                '\n00.Main Menu');
        },
        next: {
            '*\\d+': 'buyForSelf.gold.yearly.pin',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.gold.yearly.pin', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let user_pin = Number(menu.val);
            const { pin } = yield getUser(args.phoneNumber);
            // check if pin is correct
            if (user_pin == pin) {
                menu.con('SCHEDULE' +
                    '\n Enter day of month to deduct Kes 16,800 premium yearly (e.g. 1, 2, 3…31)' +
                    '\n0.Back' +
                    '\n00.Main Menu');
            }
            else {
                menu.con('PIN incorrect. Try again');
            }
        }),
        next: {
            '*\\d+': 'buyForSelf.gold.yearly.confirm',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('buyForSelf.gold.yearly.confirm', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            // use menu.val to access user input value
            let day = Number(menu.val);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear() + 1, date.getMonth(), day);
            //get month from nextDeduction
            const month = nextDeduction.toLocaleString('default', { month: 'long' });
            //nextDeduction to be formatted to MM/DD/YYYY
            const { id } = yield getUser(args.phoneNumber);
            let activePolicy = yield Policy.findOne({
                where: {
                    user_id: id,
                    policy_status: 'active'
                }
            });
            if (id && !activePolicy) {
                //save policy details
                let policy = {
                    policy_type: 'gold',
                    beneficiary: 'self',
                    policy_status: 'active',
                    policy_start_date: new Date(),
                    policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                    policy_deduction_day: day * 1,
                    policy_deduction_amount: 16800,
                    policy_next_deduction_date: nextDeduction,
                    user_id: id
                };
                let newPolicy = yield Policy.create(policy);
                console.log("NEW POLICY GOLD SELF", newPolicy);
            }
            else {
                menu.con('You already have an active policy. \n' +
                    '\n0.Back ' + ' 00.Main Menu');
            }
            menu.con('Confirm \n' +
                ` Deduct Kes 16,800  on day ${day}, ${month} each year. Next deduction will be on ${nextDeduction} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu');
        }),
        next: {
            '1': 'confirmation',
            '0': 'account',
            '00': 'insurance'
        }
    });
    //===============CONFIRMATION=================
    menu.state('confirmation', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            // get policy details kes 300 
            const { id } = yield getUser(args.phoneNumber);
            const policy = yield Policy.findOne({
                where: {
                    user_id: id
                }
            });
            console.log("XXXXXX POLICY XXXXXX", policy);
            //BOUGHT Family Medical cover for 07XXXXXXXX [FIRST NAME] [LAST NAME]. Inpatient  cover for 300,000  
            if (policy.policy_status == 'active') {
                const policy_deduction_amount = policy.policy_deduction_amount;
                const day = policy.policy_deduction_day;
                const phoneNumber = args.phoneNumber;
                const amount = policy_deduction_amount;
                const reference = policy.policy_type + policy.id;
                const user_id = id;
                const uuid = (0, uuid_1.v4)();
                let payment = yield (0, payment_1.default)(user_id, phoneNumber, amount, reference, uuid);
                if (payment == 200) {
                    menu.end('Congratulations you are now covered. \n' +
                        `To stay covered Kes ${policy_deduction_amount} will be deducted on day ${day} of every month`);
                }
                else {
                    menu.end('Sorry your payment was not successful. \n' +
                        '\n0.Back ' + ' 00.Main Menu');
                }
            }
            else {
                menu.end('You do not have an active policy.');
            }
        })
    });
}
exports.buyForSelf = buyForSelf;
