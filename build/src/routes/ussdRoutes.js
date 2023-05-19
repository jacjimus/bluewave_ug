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
const express_1 = __importDefault(require("express"));
const menu_builder_1 = __importDefault(require("../menu-builder"));
const sendSMS_1 = __importDefault(require("../services/sendSMS"));
const db_1 = require("../models/db");
const Transaction = db_1.db.transactions;
const Payment = db_1.db.payments;
const Policy = db_1.db.policies;
const Users = db_1.db.users;
const router = express_1.default.Router();
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    let menu_res;
    try {
        // RUN THE MENU BUILDER
        // PASS REQ BODY AND REDIS CLIENT
        menu_res = yield (0, menu_builder_1.default)(req.body, db_1.db);
    }
    catch (e) {
        console.log("MENU ERROR", e);
        return res.send(e);
    }
    res.send(menu_res);
}));
//call back endpoint
router.post('/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    let { id, status_code, message } = req.body;
    try {
        // transaction: {
        //     "id": "BBZMiscxy",
        //     "message": "Paid UGX 5,000 to TECH LIMITED, Trans ID MP210603.1234.L06941.",
        //     "status_code": "TS",
        //     "airtel_money_id": "MP210603.1234.L06941"
        //   },
        //find the transaction in the database
        yield Transaction.findOne({
            where: {
                transaction_reference: id
            }
        }).then((transaction) => {
            //update the transaction status
            transaction.update({
                status: "paid",
            });
            //get policy details from the transaction
            const policy_id = transaction.policy_id;
            //get user details from the transaction
            const user_id = transaction.user_id;
            // get user and policy details from db
            let user = Users.findOne({
                where: {
                    user_id: user_id
                }
            });
            //get policy details from db
            let policy = Policy.findOne({
                where: {
                    policy_id: policy_id
                }
            });
            //send sms
            const to = '254' + user.phone_number.substring(1);
            const message = `Your monthly auto premium payment of Kes ${policy.policy_deduction_amount} for ${policy.policy_type} Medical cover was SUCCESSFUL. Cover was extended till ${policy.policy_end_date}. Next payment is on DD/MM/YY
                     `;
            (0, sendSMS_1.default)(to, message);
            //create a payment record
            Payment.create({
                payment_amount: transaction.amount,
                payment_type: "airtel ussd payment",
                user_id: transaction.user_id,
                policy_id: transaction.policy_id,
                payment_status: "paid",
                //payment_status_code: status_code,
                payment_description: message,
                payment_date: new Date(),
            })
                .then((payment) => {
                console.log(payment);
            })
                .catch((error) => {
                console.log(error);
            });
        });
    }
    catch (error) {
        console.log(error);
    }
}));
module.exports = router;
