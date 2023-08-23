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
const uuid_1 = require("uuid");
const paymentSchema = new mongoose_1.Schema({
    payment_id: {
        type: mongoose_1.Schema.Types.UUID,
        required: true,
        index: true,
        unique: true,
        default: () => {
            return (0, uuid_1.v4)();
        },
    },
    claim_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Claim', required: false },
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    policy_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Policy', required: true },
    partner_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Partner', required: true },
    payment_date: { type: Date, required: true },
    payment_amount: { type: Number, required: true },
    payment_metadata: { type: mongoose_1.Schema.Types.Mixed, required: false },
    payment_type: { type: String, required: true },
    payment_status: { type: String, required: true },
    payment_description: { type: String, required: true },
}, { timestamps: true });
const PaymentModel = mongoose_1.default.model('Payment', paymentSchema);
exports.default = PaymentModel;
