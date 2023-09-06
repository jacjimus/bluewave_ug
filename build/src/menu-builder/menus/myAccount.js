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
exports.myAccount = void 0;
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
function myAccount(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    const Beneficiary = db.beneficiaries;
    menu.state('myAccount', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con('My Account ' +
                '\n1. Pay Now' +
                '\n2. Manage auto-renew' +
                '\n3. My insurance policy' +
                '\n4. Update My Profile' +
                // '\n4. Cancel policy' +
                '\n5. Add Beneficiary' +
                '\n6. My Hospital' +
                '\n0.Back' +
                '\n00.Main Menu');
        }),
        next: {
            '1': 'payNow',
            '2': 'manageAutoRenew',
            '3': 'myInsurancePolicy',
            '4': 'updateProfile',
            // '4': 'cancelPolicy',
            '5': 'listBeneficiaries',
            '6': 'myHospitalOption',
            '0': 'account',
            '00': 'insurance',
        }
    });
    //update profile ( user dob and gender)
    menu.state('updateProfile', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(`Whats your gender
            1.  Male
            2. Female
            0. Back
            00. Main Menu
             `);
        }),
        next: {
            '1': 'updateGender',
            '2': 'updateGender',
            '0': 'myAccount',
            '00': 'insurance',
        }
    });
    menu.state('updateGender', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const gender = menu.val == 1 ? "M" : "F";
            const user = yield User.update({
                gender: gender
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
            '*[0-9]': 'updateDob',
            '0': 'myAccount',
            '00': 'insurance',
        }
    });
    menu.state('updateDob', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let dob = menu.val;
            console.log("dob", dob);
            //remove all non numeric characters
            dob = dob.replace(/\D/g, "");
            console.log("dob", dob);
            // convert ddmmyyyy to valid date
            let day = parseInt(dob.substring(0, 2));
            let month = parseInt(dob.substring(2, 4));
            let year = parseInt(dob.substring(4, 8));
            let date = new Date(year, month - 1, day);
            console.log(" dob date", date);
            const user = yield User.update({
                dob: date
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
            '0': 'myAccount',
            '00': 'insurance',
        }
    });
    //update beneficiary
    // menu.state('addBeneficiary', {
    //     run: async () => {
    //         menu.con('Update or add Beneficiary ' +
    //             '\n1. Update Beneficiary' +
    //             '\n2. Add Beneficiary' +
    //             '\n0.Back' +
    //             '\n00.Main Menu'
    //         )
    //     },
    //     next: {
    //         '1': 'listBeneficiaries',
    //         '2': 'addBeneficiaryName',
    //         '0': 'myAccount',
    //         '00': 'insurance',
    //     }
    // })
    menu.state('addBeneficiaryName', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con('Enter full name of beneficiary');
        }),
        next: {
            '*[a-zA-Z]+': 'updateBeneficiaryName',
        }
    });
    //list beneficiaries
    menu.state('listBeneficiaries', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            if (user) {
                const beneficiaries = yield Beneficiary.findAll({
                    where: {
                        user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    },
                });
                console.log("BENEFICIARIES: ", beneficiaries);
                if (beneficiaries.length > 0) {
                    let beneficiaryInfo = '';
                    for (let i = 0; i < beneficiaries.length; i++) {
                        let beneficiary = beneficiaries[i];
                        beneficiaryInfo += `${i + 1}. ${beneficiary.full_name.toUpperCase()}\n`;
                    }
                    menu.con(beneficiaryInfo);
                }
                else {
                    menu.con("You have no beneficiaries\n0 Back");
                }
            }
            else {
                menu.end("User not found");
            }
        }),
        next: {
            '*[0-9]': 'updateBeneficiaryGender',
        }
    });
    menu.state('updateBeneficiaryGender', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con('Enter gender of beneficiary: ' +
                '\n1. Male' +
                '\n2. Female');
        }),
        next: {
            '*[0-9]': 'updateBeneficiaryDob',
        }
    });
    menu.state('updateBeneficiaryDob', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con('Enter your date of birth in the format DDMMYYYY');
        }),
        next: {
            '*[0-9]': 'updateBeneficiaryConfirm',
        }
    });
    menu.state('updateBeneficiaryConfirm', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let dob = menu.val;
            console.log("dob", dob);
            // convert ddmmyyyy to valid date
            let day = dob.substring(0, 2);
            let month = dob.substring(2, 4);
            let year = dob.substring(4, 8);
            let date = new Date(year, month - 1, day);
            console.log("date", date);
            // Fetch the beneficiary ID from the previous step's input value
            const selected = args.text;
            const input = selected.trim();
            const digits = input.split('*').map((digit) => parseInt(digit, 10));
            console.log("digits", digits);
            const beneficiaryId = digits[digits.length - 3];
            console.log("beneficiaryId", beneficiaryId);
            let gender = digits[digits.length - 2] == 1 ? "M" : "F";
            console.log("gender", gender);
            // Assuming you have the beneficiary ID from the previous steps
            const user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            if (user) {
                let beneficiaries = yield Beneficiary.findAll({
                    where: {
                        user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    },
                    attributes: { exclude: [] }, // return all columns
                });
                const selectedBeneficiary = beneficiaries[beneficiaryId - 1];
                console.log("selectedBeneficiary", selectedBeneficiary);
                if (selectedBeneficiary) {
                    // Update the beneficiary's information
                    let thisYear = new Date().getFullYear();
                    selectedBeneficiary.dob = date;
                    selectedBeneficiary.age = thisYear - date.getFullYear();
                    selectedBeneficiary.gender = gender;
                    try {
                        let result = yield selectedBeneficiary.save();
                        console.log("Result after save:", result);
                        menu.end('Beneficiary updated successfully');
                    }
                    catch (error) {
                        console.error("Error saving beneficiary:", error);
                        menu.end('Failed to update beneficiary. Please try again.');
                    }
                }
                else {
                    menu.end('Invalid beneficiary selection');
                }
            }
            else {
                menu.end('User not found');
            }
        }),
    });
    //============CANCEL POLICY=================
    menu.state('cancelPolicy', {
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
                    menu.con('Hospital cover of Kes 1M a year(100k per night, max 10 nights)' +
                        'Life cover of Kes 4M Funeral Benefit' +
                        '\n1. Cancel Policy');
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
            menu.con(`By cancelling, you will no longer be covered for ${(policy.policy_type).toUpperCase()} Insurance as of ${today}.
            '\nEnter PIN or Membership ID to  Confirm cancellation
                0.Back
                00.Main Menu`);
        }),
        next: {
            '*[0-9]': 'cancelPolicyConfirm',
        }
    });
    //cancel policy confirm
    menu.state('cancelPolicyConfirm', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const to = '254' + args.phoneNumber.substring(1);
            const message = ' You CANCELLED your Medical cover cover. Your Policy will expire on DD/MM/YYYY and you will not be covered. Dial *187*7*1# to reactivate.';
            const sms = yield (0, sendSMS_1.default)(to, message);
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
                policy.policy_status = 'cancelled';
                policy.policy_end_date = today;
                yield policy.save();
            }
            menu.con(`Your policy will expire on ${today}  and will not be renewed. Dial *187*7# to reactivate.
                0.Back     00.Main Menu`);
        }),
        next: {
            '0': 'myAccount',
            '00': 'insurance',
        }
    });
    //my insurance policy
    menu.state('myInsurancePolicy', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const bronzeLastExpenseBenefit = "UGX 1,000,000";
            const silverLastExpenseBenefit = "UGX 1,500,000";
            const goldLastExpenseBenefit = "UGX 2,000,000";
            const user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            console.log("USER: ", user);
            if (!user) {
                menu.con('User not found');
                return;
            }
            let policies = yield Policy.findAll({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                },
            });
            console.log("POLICIES: ", policies);
            if (policies.length === 0) {
                menu.con('You have no policies\n' +
                    '1. Buy cover\n' +
                    '0. Back\n' +
                    '00. Main Menu');
                return;
            }
            let policyInfo = '';
            for (let i = 0; i < policies.length; i++) {
                let policy = policies[i];
                let benefit;
                if (policy.policy_type == 'bronze') {
                    benefit = bronzeLastExpenseBenefit;
                }
                else if (policy.policy_type == 'silver') {
                    benefit = silverLastExpenseBenefit;
                }
                else if (policy.policy_type == 'gold') {
                    benefit = goldLastExpenseBenefit;
                }
                policyInfo += `${i + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
                    `   Inpatient limit: UGX ${policy.sum_insured}\n` +
                    `   Remaining: UGX ${policy.sum_insured}\n` +
                    `   Last Expense Per Person Benefit: ${benefit}\n\n`;
            }
            menu.end(`My Insurance Policies:\n\n${policyInfo}`);
        }),
        next: {
            '1': 'account',
            '0': 'account',
            '00': 'insurance',
        }
    });
    menu.state('manageAutoRenew', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con('Manage auto-renew ' +
                '\n1. Activate auto-renew' +
                '\n2. Deactivate auto-renew' +
                '\n0.Back' +
                '\n00.Main Menu');
        })
    });
}
exports.myAccount = myAccount;
