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
exports.updatePremium = exports.fetchMemberStatusData = exports.updateMember = exports.renewMember = exports.registerDependant = exports.registerPrincipal = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../models/db");
const utils_1 = require("./utils");
//const User = db.users;
function randomDateOfBirth() {
    const start = new Date(1950, 0, 1);
    const end = new Date(2000, 0, 1);
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
}
function arr_uganda_login() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://cmsweb.aar.co.ug:82/api/auth/airtel/login',
                data: {
                    "username": process.env.AAR_UGANDA_UAT_USERNAME,
                    "password": process.env.AAR_UGANDA_UAT_PASSWORD,
                }
            };
            console.log("CONFIG", config);
            const response = yield axios_1.default.request(config);
            console.log(JSON.stringify(response.data));
            return response.data.token;
        }
        catch (error) {
            throw error;
        }
    });
}
function registerPrincipal(user, policy) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("REGISTER PRINCIPAL AAR", user, policy);
        const userData = {
            surname: user.last_name,
            first_name: user.first_name,
            other_names: user.middle_name || user.last_name,
            gender: 1,
            dob: randomDateOfBirth(),
            pri_dep: "24",
            family_title: "24",
            tel_no: `256${user.phone_number}`,
            email: user.email || "admin@bluewave.insure",
            next_of_kin: {
                surname: user.last_name,
                first_name: user.first_name,
                other_names: user.middle_name || "",
                tel_no: user.phone_number,
            },
            member_status: "1",
            health_option: "63",
            health_plan: "AIRTEL_" + policy.policy_type,
            corp_id: "758",
            policy_start_date: policy.policy_start_date,
            policy_end_date: policy.policy_end_date,
            unique_profile_id: user.membership_id + '',
            money_transaction_id: policy.airtel_money_id,
        };
        try {
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://cmsweb.aar.co.ug:82/api/airtel/v1/protected/register_principal',
                headers: {
                    'Authorization': 'Bearer ' + (yield arr_uganda_login()),
                    'Content-Type': 'application/json',
                },
                data: userData,
            };
            console.log("CONFIG", config);
            const response = yield axios_1.default.request(config);
            console.log(JSON.stringify(response.data));
            if (response.data.code == 200) {
                yield db_1.db.users.update({ is_active: true, arr_member_number: response.data.member_no }, { where: { user_id: user.user_id } });
                return Object.assign(Object.assign({}, response.data), userData);
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.registerPrincipal = registerPrincipal;
function updatePremium(data, policy) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("UPDATE PREMIUM AAR", data, policy);
            const payments = yield db_1.db.payments.findAll({
                where: {
                    policy_id: policy.policy_id,
                    payment_status: "paid"
                }
            });
            console.log("PAYMENTS", payments.length);
            let proratedPercentage = (0, utils_1.calculateProrationPercentage)(payments.length);
            console.log("PRORATED PERCENTAGE", proratedPercentage);
            const main_benefit_limit = policy.installment_type == 1 ? policy.sum_insured : policy.sum_insured / proratedPercentage;
            const last_expense_limit = policy.installment_type == 1 ? policy.last_expense_insured : policy.last_expense_insured / proratedPercentage;
            console.log("MAIN BENEFIT LIMIT", main_benefit_limit);
            console.log("LAST EXPENSE LIMIT", last_expense_limit);
            let premium_installment = payments.length + 1;
            let ultimatePremium;
            if (policy.beneficiary == "FAMILY" || policy.beneficiary == "OTHER") {
                // spit premium based on memeber family size e.g  M+3  PREMIUM / 4
                if (policy.total_member_number !== "M") {
                    const policyPremium = policy.premium;
                    const memberSize = (policy.total_member_number).split("")[2];
                    console.log(policyPremium, memberSize);
                    ultimatePremium = policyPremium / (parseInt(memberSize) + 1);
                }
                ultimatePremium = policy.premium;
            }
            console.log("ultimatePremium", ultimatePremium);
            const requestData = {
                member_no: data.arr_member_number || data.member_no,
                unique_profile_id: data.membership_id + "",
                health_plan: "AIRTEL_" + policy.policy_type,
                health_option: "63",
                premium: ultimatePremium,
                premium_type: policy.installment_type,
                premium_installment: premium_installment,
                main_benefit_limit: main_benefit_limit,
                last_expense_limit: last_expense_limit,
                money_transaction_id: policy.airtel_money_id
            };
            console.log("REQUEST DATA AAR UPDATE PREMIUM", requestData);
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://cmsweb.aar.co.ug:82/api/airtel/v1/protected/update_premium',
                headers: {
                    'Authorization': 'Bearer ' + (yield arr_uganda_login()),
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(requestData),
            };
            console.log("CONFIG", config);
            const response = yield axios_1.default.request(config);
            console.log(JSON.stringify(response.data));
            if (response.data.code == 200) {
                console.log("UPDATE PREMIUM AAR RESPONSE", response.data);
                return response.data;
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.updatePremium = updatePremium;
function registerDependant(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://cmsweb.aar.co.ug:82/api/airtel/v1/protected/register_dependant',
                headers: {
                    'Authorization': 'Bearer ' + (yield arr_uganda_login()),
                    'Content-Type': 'application/json',
                },
                data,
            };
            console.log("CONFIG", config);
            const response = yield axios_1.default.request(config);
            console.log(JSON.stringify(response.data));
            return response.data;
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.registerDependant = registerDependant;
function renewMember(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://cmsweb.aar.co.ug:82/api/airtel/v1/protected/renew_member',
                headers: {
                    'Authorization': 'Bearer ' + (yield arr_uganda_login()),
                    'Content-Type': 'application/json',
                },
                data,
            };
            console.log("CONFIG", config);
            const response = yield axios_1.default.request(config);
            console.log(JSON.stringify(response.data));
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.renewMember = renewMember;
// Example usage:
const renewalData = {
    member_no: "UG152301-01",
    member_status: "1",
    health_option: "3",
    health_plan: "bronze10",
    policy_start_date: "2023-08-21",
    policy_end_date: "2024-08-22",
};
function updateMember(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://cmsweb.aar.co.ug:82/api/airtel/v1/protected/update_member',
                headers: {
                    'Authorization': 'Bearer ' + (yield arr_uganda_login()),
                },
                data,
            };
            console.log("CONFIG", config);
            const response = yield axios_1.default.request(config);
            console.log(JSON.stringify(response.data));
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.updateMember = updateMember;
function fetchMemberStatusData({ member_no, unique_profile_id }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://cmsweb.aar.co.ug:82/api/airtel/v1/protected/member_status_data',
                headers: {
                    'Authorization': 'Bearer ' + (yield arr_uganda_login()),
                },
                data: {
                    member_no,
                    unique_profile_id
                }
            };
            console.log("CONFIG", config);
            const response = yield axios_1.default.request(config);
            console.log(JSON.stringify(response.data));
            return response.data;
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.fetchMemberStatusData = fetchMemberStatusData;
