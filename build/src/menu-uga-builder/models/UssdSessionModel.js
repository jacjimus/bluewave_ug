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
const ussdSessionSchema = new mongoose_1.Schema({
    session_id: { type: String, required: true },
    phone_number: { type: String, required: true },
    user_input: { type: String, required: true },
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    active_state: { type: String },
    serviceCode: { type: String },
    language: { type: String },
    full_input: { type: String },
    masked_input: { type: String },
    hash: { type: String },
}, { timestamps: true });
const UssdSessionModel = mongoose_1.default.model('UssdSession', ussdSessionSchema);
exports.default = UssdSessionModel;
//example of a ussd session object
// {
//   "session_id": "ATUid_1c2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b",
//   "phone_number": "+256782820782",
//   "serviceCode": "*284*1#",
//   "text": "1",
//   "language": "en"
//   "user_id": "5f8f1b3b2b2b2b2b2b2b2b2b",
//   "active_state": "1",
//   "full_input": "*284*1*1#",
//   "masked_input": "*284*1*1#",
//  "user_input": "1",
//   "hash": ""
// }
