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
exports.buyForFamily = void 0;
const payment_1 = __importDefault(require("../../services/payment"));
const uuid_1 = require("uuid");
function buyForFamily(menu, args, db) {
    const Policy = db.policies;
    const Beneficiary = db.beneficiaries;
    const User = db.users;
    if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
    }
    function getUser(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield User.findOne({
                where: {
                    phone_number: phoneNumber
                }
            });
        });
    }
    //============  BUY FOR FAMILY ===================
    //Buy for family
    menu.state('buyForFamily', {
        run: () => {
            menu.con('Buy for family ' +
                '\n1. Self  – UGX 10,000' +
                '\n2. Self + Spouse – UGX 20,000' +
                '\n3. Self + Spouse + 1 Child - UGX 30,000' +
                '\n4. Self + Spouse + 2 children – UGX 40,000' +
                '\n0.Back' +
                '\n00.Main Menu');
        },
        next: {
            '1': 'buyForFamily.self.confirm',
            '2': 'buyForFamily.selfSpouse',
            '3': 'buyForFamily.selfSpouse1Child',
            '4': 'buyForFamily.selfSpouse2Children',
        }
    });
    //================BUY FOR FAMILY SELF=================
    //buy for family self confirm
    menu.state('buyForFamily.self.confirm', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            // use menu.val to access user input value
            let day = Number(menu.val);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, day);
            const { user_id, partner_id } = yield getUser(args.phoneNumber);
            let countryCode = 'UGA';
            let currencyCode = 'UGX';
            //save policy details
            let policy = {
                policy_d: (0, uuid_1.v4)(),
                policy_type: 'bronze',
                beneficiary: 'self',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                policy_deduction_amount: 10000,
                policy_next_deduction_date: nextDeduction,
                premium: 10000,
                policy_pending_premium: 10000,
                installment_order: 1,
                installment_date: nextDeduction,
                installment_alert_date: nextDeduction,
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: user_id,
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            };
            let newPolicy = yield Policy.create(policy);
            console.log("NEW POLICY FAMILY SELF", newPolicy);
            const allPolicy = yield Policy.findAll({
                where: {
                    user_id: user_id
                }
            });
            let numberOfPolicies = allPolicy.length;
            console.log("NUMBER OF POLICIES", numberOfPolicies);
            yield User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });
            menu.con('Confirm \n' +
                ` Deduct UGX ${policy.premium}, Next deduction will be on ${nextDeduction} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu');
        }),
        next: {
            '1': 'confirmation',
            '0': 'account',
            '00': 'insurance'
        }
    });
    //=============BUY FOR FAMILY SELF SPOUSE================
    menu.state('buyForFamily.selfSpouse', {
        run: () => {
            menu.con('\nEnter Spouse name' +
                '\n0.Back' +
                '\n00.Main Menu');
        },
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouse.spouse',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });
    //buyForFamily.selfSpouse.spouse
    menu.state('buyForFamily.selfSpouse.spouse', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let spouse = menu.val;
            const { user_id, partner_id } = yield getUser(args.phoneNumber);
            let date = new Date();
            // the day today
            let day = date.getDate();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            let countryCode = 'UGA';
            let currencyCode = 'UGX';
            const policy = {
                policy_d: (0, uuid_1.v4)(),
                policy_type: 'bronze',
                beneficiary: 'selfSpouse',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                policy_next_deduction_date: nextDeduction,
                policy_deduction_day: day * 1,
                policy_deduction_amount: 20000,
                premium: 20000,
                policy_pending_premium: 20000,
                installment_order: 1,
                installment_date: nextDeduction,
                installment_alert_date: nextDeduction,
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: user_id,
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            };
            let newPolicy = yield Policy.create(policy);
            console.log("NEW POLICY FAMILY SELFSPOUSE", newPolicy);
            const allPolicy = yield Policy.findAll({
                where: {
                    user_id: user_id
                }
            });
            let numberOfPolicies = allPolicy.length;
            console.log("NUMBER OF POLICIES", numberOfPolicies);
            yield User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });
            let beneficiary = {
                beneficiary_id: (0, uuid_1.v4)(),
                full_name: spouse,
                relationship: 'spouse',
                user_id: user_id
            };
            let newBeneficiary = yield Beneficiary.create(beneficiary);
            console.log("new beneficiary 1", newBeneficiary);
            menu.con('Confirm \n' +
                ` Deduct UGX 20,000, Next deduction will be on ${nextDeduction} \n` +
                '\n1.Confirm \n' +
                '\n0.Back ' + ' 00.Main Menu');
        }),
        next: {
            '1': 'confirmation',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });
    //=============BUY FOR FAMILY SELF SPOUSE 1 CHILD================
    menu.state('buyForFamily.selfSpouse1Child', {
        run: () => {
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
            let spouse = menu.val;
            console.log("SPOUSE NAME 1", spouse);
            //save spouse name to db users collection
            const { user_id, partner_id } = yield getUser(args.phoneNumber);
            let date = new Date();
            let nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            let countryCode = 'UGA';
            let currencyCode = 'UGX';
            let day = date.getDate();
            const policy = {
                policy_d: (0, uuid_1.v4)(),
                policy_type: 'bronze',
                beneficiary: 'selfSpouse1Child',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()),
                policy_next_deduction_date: nextDeduction,
                policy_deduction_day: day * 1,
                policy_deduction_amount: 30000,
                premium: 30000,
                policy_pending_premium: 30000,
                installment_order: 1,
                installment_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                installment_alert_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: user_id,
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            };
            let newPolicy = yield Policy.create(policy).catch(err => console.log(err));
            console.log("NEW POLICY FAMILY SELFSPOUSE1CHILD", newPolicy);
            const allPolicy = yield Policy.findAll({
                where: {
                    user_id: user_id
                }
            });
            let numberOfPolicies = allPolicy.length;
            console.log("NUMBER OF POLICIES", numberOfPolicies);
            yield User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });
            let beneficiary = {
                beneficiary_id: (0, uuid_1.v4)(),
                full_name: spouse,
                relationship: 'spouse',
                user_id: user_id
            };
            let newBeneficiary = yield Beneficiary.create(beneficiary);
            console.log("new beneficiary 1", newBeneficiary);
            menu.con('\nEnter Child s name' +
                '\n0.Back' +
                '\n00.Main Menu');
        }),
        next: {
            '*[a-zA-Z]+': 'buyForFamily.selfSpouse1Child.confirm',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });
    //buyForFamily.selfSpouse1Child.confirm
    menu.state('buyForFamily.selfSpouse1Child.confirm', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            try {
                const childName = menu.val;
                console.log("CHILD NAME", childName);
                const { user_id } = yield getUser(args.phoneNumber);
                const beneficiary = {
                    beneficiary_id: (0, uuid_1.v4)(),
                    full_name: childName,
                    relationship: 'child',
                    user_id: user_id,
                };
                const newBeneficiary = yield Beneficiary.create(beneficiary);
                console.log("New Beneficiary", newBeneficiary);
                const selectedDay = new Date().getDate();
                const date = new Date();
                const nextDeduction = new Date(date.getFullYear(), date.getMonth() + 1, selectedDay);
                menu.con('Confirm \n' +
                    ` Deduct UGX 30,000, Next deduction will be on ${nextDeduction} \n` +
                    '\n1. Confirm \n' +
                    '\n0. Back\n' +
                    '00. Main Menu');
            }
            catch (error) {
                console.error('Error:', error);
                menu.end('An error occurred while processing the confirmation');
            }
        }),
        next: {
            '1': 'confirmation',
            '0': 'buyForFamily',
            '00': 'insurance',
        },
    });
    //===========BUY FOR FAMILY SELF SPOUSE 2 CHILDREN==================
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
            let spouse = menu.val;
            console.log("SPOUSE NAME 1", spouse);
            const { user_id, partner_id } = yield getUser(args.phoneNumber);
            let countryCode = 'UGA';
            let currencyCode = 'UGX';
            const policy = {
                policy_d: (0, uuid_1.v4)(),
                policy_type: 'bronze',
                beneficiary: 'selfSpouse2Child',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
                policy_deduction_amount: 40000,
                policy_deduction_day: new Date().getDate() * 1,
                policy_next_deduction_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                premium: 40000,
                policy_pending_premium: 40000,
                installment_order: 1,
                installment_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
                installment_alert_date: new Date(new Date().getFullYear() + 1, new Date().getMonth() + 1, new Date().getDate()),
                tax_rate_vat: '0.2',
                tax_rate_ext: '0.25',
                sum_insured: '1500000',
                excess_premium: '0',
                discount_premium: '0',
                partner_id: partner_id,
                user_id: user_id,
                country_code: countryCode,
                currency_code: currencyCode,
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            };
            let newPolicy = yield Policy.create(policy);
            console.log("NEW POLICY FAMILY SELFSPOUSE2CHILD", newPolicy);
            const allPolicy = yield Policy.findAll({
                where: {
                    user_id: user_id
                }
            });
            let numberOfPolicies = allPolicy.length;
            console.log("NUMBER OF POLICIES", numberOfPolicies);
            yield User.update({ number_of_policies: numberOfPolicies }, { where: { user_id: user_id } });
            let beneficiary = {
                beneficiary_id: (0, uuid_1.v4)(),
                full_name: spouse,
                relationship: 'spouse',
                user_id: user_id
            };
            let newBeneficiary = yield Beneficiary.create(beneficiary);
            console.log("new beneficiary 1", newBeneficiary);
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
            let child1 = menu.val;
            console.log("child1 3 NAME", child1);
            //save child1 name to db users collection
            const { user_id } = yield getUser(args.phoneNumber);
            //create beneficiary
            let beneficiary = {
                beneficiary_id: (0, uuid_1.v4)(),
                full_name: child1,
                relationship: 'child1',
                user_id: user_id
            };
            let newBeneficiary = yield Beneficiary.create(beneficiary);
            console.log("new beneficiary 3", newBeneficiary);
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
            let child2 = menu.val;
            //save child2 name to db users collection
            const { user_id } = yield getUser(args.phoneNumber);
            //create beneficiary
            let beneficiary = {
                beneficiary_id: (0, uuid_1.v4)(),
                full_name: child2,
                relationship: 'child2',
                user_id: user_id
            };
            let newBeneficiary = yield Beneficiary.create(beneficiary);
            console.log("new beneficiary 4", newBeneficiary);
            menu.con(`Pay UGX 40000 deducted monthly.
                    Terms&Conditions - www.airtel.com
                    '\nEnter PIN or Membership ID to Agree and Pay' +
                    n0.Back
                    00.Main Menu`);
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
            let premium = 40000;
            menu.con(`Pay UGX ${premium} deducted monthly.
                            Terms&Conditions - www.airtel.com
                            '\nEnter PIN or Membership ID to Agree and Pay' +
                            n0.Back
                            00.Main Menu`);
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
            menu.con(`Pay UGX 40,000 deducted monthly.
                    Terms&Conditions - www.airtel.com
                    '\nEnter PIN or Membership ID to Agree and Pay' +
                    n0.Back
                    00.Main Menu`);
        },
        next: {
            '*\\d+': 'confirmation',
            '0': 'buyForFamily',
            '00': 'insurance'
        }
    });
    //===============CONFIRMATION=================
    menu.state('confirmation', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            try {
                const { user_id, phone_number, partner_id, membership_id } = yield getUser(args.phoneNumber);
                const policy = yield Policy.findAll({
                    where: {
                        user_id
                    }
                });
                //latest policy
                let newPolicy = policy[policy.length - 1];
                console.log("============ NewPolicy =============", newPolicy);
                if (newPolicy) {
                    const policy_deduction_amount = newPolicy.policy_deduction_amount;
                    const day = newPolicy.policy_deduction_day;
                    const amount = policy_deduction_amount;
                    const reference = membership_id;
                    const policy_id = newPolicy.policy_id;
                    let period = 'monthly'; // Default period
                    if (newPolicy.installment_order === 12) {
                        period = 'yearly';
                    }
                    console.log(user_id, partner_id, policy_id, phone_number, amount, reference);
                    let paymentStatus = yield (0, payment_1.default)(user_id, partner_id, policy_id, phone_number, amount, reference);
                    console.log(paymentStatus);
                    if (paymentStatus.code === 200) {
                        menu.end(`Congratulations! You are now covered. 
                        To stay covered, UGX ${policy_deduction_amount} will be deducted on day ${day} of every ${period}`);
                    }
                    else {
                        menu.end(`Sorry, your payment was not successful. 
                        \n0. Back \n00. Main Menu`);
                    }
                }
                else {
                    menu.end('You do not have an active policy.');
                }
            }
            catch (error) {
                console.error('Confirmation Error:', error);
                menu.end('An error occurred. Please try again later.');
            }
        })
    });
}
exports.buyForFamily = buyForFamily;
