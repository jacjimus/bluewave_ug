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
const User = db_1.db.users;
function arr_uganda_login() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://airtelapi.aar-insurance.ug:82/api/auth/airtel/login',
                data: {
                    "username": 'airtel',
                    "password": '#$a!rtel$',
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
function refreshToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://airtelapi.aar-insurance.ug:82/api/auth/token_refresh',
                headers: {
                    'Authorization': 'Bearer ' + (yield arr_uganda_login()),
                }
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
// {
//   "surname": "mary",
//   "first_name": "wairimu",
//   "other_names": "ms",
//   "gender": "1",
//   "dob": "1989-01-01",
//   "pri_dep": "24",
//   "family_title": "24",
//   "tel_no": "253701010101",
//   "email": "marydoe@gmail.com",
//   "next_of_kin": {
//       "surname": "jean",
//       "first_name": "mary",
//       "other_names": "doe",
//       "tel_no": "0799999999"
//   },
//   "member_status": "1",
//   "health_option": "63",
//   "health_plan": "MIDI",
//   "policy_start_date": "2022-09-28",
//   "policy_end_date": "2023-09-27",
//   "unique_profile_id": "123455"
// }
function registerPrincipal(user, policy, beneficiary, airtel_money_id) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("i was called register principal");
        // console.log("USER", user);
        // console.log("POLICY", policy);
        // console.log("BENEFICIARY", beneficiary);
        // console.log("AIRTEL MONEY ID", airtel_money_id);
        const userData = {
            surname: user.last_name + "test9",
            first_name: user.first_name + "test9",
            other_names: user.middle_name + "test9",
            gender: user.gender == 'M' ? "1" : "2",
            dob: user.dob,
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
            policy_start_date: policy.policy_start_date,
            policy_end_date: policy.policy_end_date,
            unique_profile_id: user.membership_id + '',
            money_transaction_id: airtel_money_id,
        };
        try {
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/register_principal',
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
                yield User.update({ is_active: true, arr_member_number: response.data.member_no }, { where: { user_id: user.user_id } });
                return Object.assign(Object.assign({}, response.data), userData);
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.registerPrincipal = registerPrincipal;
// Example usage:
const registrationMembData = {
    surname: "james",
    first_name: "Odo",
    other_names: "doe",
    gender: "1",
    dob: "2000-09-09",
    pri_dep: "24",
    family_title: "24",
    tel_no: "0701010101",
    email: "james@gmail.com",
    next_of_kin: {
        surname: "jean",
        first_name: "mary",
        other_names: "doe",
        tel_no: "0799999999",
    },
    member_status: "2",
    health_option: "2",
    health_plan: "BRONZE10",
    policy_start_date: "2000-02-22",
    policy_end_date: "2000-02-01",
    unique_profile_id: "2000",
    money_transaction_id: "2000222",
};
function updatePremium(data, policy, airtel_money_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("i was called update premium");
            console.log("updatePremium DATA", data, policy);
            const main_benefit_limit = policy.installment_type == 1 ? policy.sum_insured : policy.sum_insured / 12;
            const last_expense_limit = policy.installment_type == 1 ? policy.last_expense_insured : policy.last_expense_insured / 12;
            const requestData = {
                member_no: data.arr_member_number,
                unique_profile_id: data.membership_id + "",
                health_plan: "AIRTEL_" + policy.policy_type,
                health_option: "63",
                premium: policy.policy_deduction_amount,
                premium_type: policy.installment_type,
                premium_installment: policy.installment_order,
                main_benefit_limit: main_benefit_limit,
                last_expense_limit: last_expense_limit,
                money_transaction_id: airtel_money_id
            };
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/update_premium',
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
                console.log(" updatePremium RESPONSE", response.data);
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
                url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/register_dependant',
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
                url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/renew_member',
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
                url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/update_member',
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
                url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/member_status_data',
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
