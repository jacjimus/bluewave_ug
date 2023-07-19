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
const claimSchema = new mongoose_1.Schema({
    policy_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Policy', required: true },
    claim_date: { type: Date },
    claim_status: { type: String },
    claim_amount: { type: Number },
    claim_description: { type: String },
    claim_type: { type: String },
    claim_documents: { type: [String], default: [] },
    claim_comments: { type: String },
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    parner_id: { type: Number, required: true },
}, { timestamps: true });
const ClaimModel = mongoose_1.default.model('Claim', claimSchema);
exports.default = ClaimModel;
