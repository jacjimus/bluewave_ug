"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const policySchema = new mongoose_1.Schema({
    product_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    parner_id: { type: Number, required: true },
    policy_start_date: { type: Date, required: true },
    policy_status: { type: String, required: true },
    beneficiary_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Beneficiary' },
    policy_type: { type: String, required: true },
    policy_end_date: { type: Date, required: true },
    policy_deduction_amount: { type: Number, required: true },
    policy_next_deduction_date: { type: Date, required: true },
    policy_deduction_day: { type: Number, required: true },
    installment_order: { type: Number, required: true },
    installment_date: { type: Date },
    installment_alert_date: { type: Date },
    tax_rate_vat: { type: Number },
    tax_rate_ext: { type: Number },
    premium: { type: Number },
    country_code: { type: String, required: true },
    currency_code: { type: String, required: true },
    sum_insured: { type: Number, required: true },
    excess_premium: { type: Number },
    discount_premium: { type: Number },
}, { timestamps: true });
const PolicyModel = mongoose_1.default.model('Policy', policySchema);
exports.default = PolicyModel;
