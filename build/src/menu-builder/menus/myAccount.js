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
    menu.state('myAccount', {
        run: () => __awaiter(this, void 0, void 0, function* () {
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
                        user_id: user.id,
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
            menu.con('By cancelling, you will no longer be covered for Hospital + Life Insurance as of DD/MM/YYYY.' +
                'Enter PIN to  Confirm cancellation\n' +
                '0.Back\n' +
                '00.Main Menu');
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
                    phone_number: args.phoneNumber,
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
}
exports.myAccount = myAccount;
