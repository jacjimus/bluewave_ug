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
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberAndValueOfFailedPayments = exports.getNewPolicies = void 0;
const db_1 = require("../models/db");
const sequelize_1 = require("sequelize");
const getNewPolicies = (partner_id, start_date, end_date) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newPolicies = yield db_1.db.policies.findAll({
            attributes: [
                [sequelize_1.Sequelize.fn('DATE', sequelize_1.Sequelize.col('policy_start_date')), 'policy_start_date'],
                [sequelize_1.Sequelize.fn('COUNT', '*'), 'new_policies']
            ],
            where: {
                policy_status: 'paid',
                partner_id: partner_id,
                policy_start_date: {
                    [sequelize_1.Op.between]: [start_date, end_date]
                }
            },
            group: ['policy_start_date'],
            order: ['policy_start_date']
        });
        console.log(newPolicies);
        return newPolicies;
    }
    catch (error) {
        console.log(error);
    }
});
exports.getNewPolicies = getNewPolicies;
const numberAndValueOfFailedPayments = (partner_id, start_date, end_date) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const failedPayments = yield db_1.db.payments.findAll({
            attributes: [
                [sequelize_1.Sequelize.fn('DATE', sequelize_1.Sequelize.col('payment_date')), 'payment_date'],
                [sequelize_1.Sequelize.fn('COUNT', '*'), 'failed_payments'],
                [sequelize_1.Sequelize.fn('SUM', sequelize_1.Sequelize.col('payment_amount')), 'value_of_failed_payments'],
                'payment_status',
                ['payment_description', 'failure_reason']
            ],
            where: {
                payment_status: ['failed', 'declined', 'error'],
                payment_date: {
                    [sequelize_1.Op.between]: ['2023-01-01', '2024-02-07']
                },
                partner_id: 2
            },
            group: ['payment_date', 'payment_status', 'payment_description'],
            order: ['payment_date', 'payment_status']
        })
            .then(results => {
            console.log(results);
        })
            .catch(error => {
            console.error(error);
        });
        console.log("failedPayments", failedPayments);
        return failedPayments;
    }
    catch (error) {
        console.log(error.message);
    }
});
exports.numberAndValueOfFailedPayments = numberAndValueOfFailedPayments;
/* create list of function to get analytics data */
