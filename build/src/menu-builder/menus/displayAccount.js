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
exports.displayAccount = void 0;
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
function displayAccount(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    const Claim = db.claims;
    menu.state('account', {
        run: () => {
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
    //==================MAKE CLAIM===================
    menu.state('makeClaim', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            //send sms
            const { phoneNumber: to } = args;
            const messages = [
                `Your medicals details have been confirmed. You are covered for hospital cash of kes 4,500 per night payable from the second night`,
                `An amount of kes100,000 has been paid by AAR towards your hospital bill.: Your cover balanceis Kes 200,000`
            ];
            for (const message of messages) {
                try {
                    const response = yield (0, sendSMS_1.default)(to, message);
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
                console.log("USER claim:", user);
                if (user.id) {
                    const policy = yield Policy.findOne({
                        where: {
                            user_id: user.id,
                        },
                    });
                    console.log("POLICY:", policy);
                    if (policy.id) {
                        const claim = yield Claim.create({
                            policy_id: policy.policy_id,
                            user_id: user.id,
                            claim_date: new Date(),
                            claim_status: "Pending",
                        });
                        console.log("CLAIM:", claim);
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
}
exports.displayAccount = displayAccount;
