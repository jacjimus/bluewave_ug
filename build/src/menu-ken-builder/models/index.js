"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiaryModel = exports.PartnerModel = exports.TransactionModel = exports.ProductModel = exports.PaymentModel = exports.ClaimModel = exports.PolicyModel = exports.UssdSessionModel = exports.UserModel = void 0;
//import all the models
const UserModel_1 = __importDefault(require("./UserModel"));
exports.UserModel = UserModel_1.default;
const UssdSessionModel_1 = __importDefault(require("./UssdSessionModel"));
exports.UssdSessionModel = UssdSessionModel_1.default;
const PolicyModel_1 = __importDefault(require("./PolicyModel"));
exports.PolicyModel = PolicyModel_1.default;
const ClaimModel_1 = __importDefault(require("./ClaimModel"));
exports.ClaimModel = ClaimModel_1.default;
const PaymentModel_1 = __importDefault(require("./PaymentModel"));
exports.PaymentModel = PaymentModel_1.default;
const ProductModel_1 = __importDefault(require("./ProductModel"));
exports.ProductModel = ProductModel_1.default;
const TransactionModel_1 = __importDefault(require("./TransactionModel"));
exports.TransactionModel = TransactionModel_1.default;
const PartnerModel_1 = __importDefault(require("./PartnerModel"));
exports.PartnerModel = PartnerModel_1.default;
const BeneficiaryModel_1 = __importDefault(require("./BeneficiaryModel"));
exports.BeneficiaryModel = BeneficiaryModel_1.default;
