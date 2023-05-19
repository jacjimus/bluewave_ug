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
exports.payNow = void 0;
const payment_1 = __importDefault(require("../../services/payment"));
const uuid_1 = require("uuid");
function payNow(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    //==================PAY NOW===================
    menu.state('payNow', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            });
            const { policy_deduction_amount } = yield Policy.findOne({
                where: {
                    user_id: user.id
                }
            });
            menu.con(`Your outstanding premium is Kes ${policy_deduction_amount} 

                        1. Enter PIN to Pay Now
                        0.Back
                        00.Main Menu`);
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
                    phone_number: args.phoneNumber
                }
            });
            console.log("USER pin: ", user);
            let { id, policy_type, policy_deduction_amount, policy_deduction_day } = yield Policy.findOne({
                where: {
                    user_id: user.id
                }
            });
            let nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1).toLocaleString();
            // check if pin is correct
            if (user.pin == pin) {
                const phoneNumber = args.phoneNumber;
                const amount = policy_deduction_amount;
                const reference = policy_type + id;
                const user_id = user.id;
                const uuid = (0, uuid_1.v4)();
                const payment = yield (0, payment_1.default)(user_id, phoneNumber, amount, reference, uuid);
                if (payment == 200) {
                    //Paid Kes 5,000 for Medical cover. Your next payment will be due on day # of [NEXT MONTH]
                    menu.end(`Paid Kes ${amount} for Medical cover. 
                    Your next payment will be due on day ${policy_deduction_day} of ${nextMonth}`);
                }
                else {
                    menu.end('Payment failed. Please try again');
                }
            }
            else {
                menu.end('Incorrect PIN. Please try again');
            }
        })
    });
}
exports.payNow = payNow;
