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
const userSchema = new mongoose_1.Schema({
    first_name: { type: String, required: true },
    middle_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone_number: { type: String, required: true, unique: true },
    dob: { type: Date },
    gender: { type: String },
    marital_status: { type: String },
    addressline: { type: String },
    nationality: { type: String },
    title: { type: String },
    pinzip: { type: String },
    weight: { type: Number },
    height: { type: Number },
    password: { type: String },
    national_id: { type: String },
    role: { type: String, default: "user" },
    is_active: { type: Boolean, default: true },
    is_verified: { type: Boolean, default: false },
    pin: { type: Number },
    partner_id: { type: Number, required: true },
    biometric: { type: String }
}, { timestamps: true
});
const UserModel = mongoose_1.default.model('User', userSchema);
exports.default = UserModel;
//example of a user object
// {
//   "first_name": "John",
//   "middle_name": "Doe",
//   "last_name": "Doe",
//   "email": "johndoe@gmail",
//   "phone_number": "0700000000",
//   "dob": "1990-01-01",
//   "gender": ""
