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
exports.createDependant = exports.updatePremium = exports.fetchMemberStatusData = exports.updateMember = exports.renewMember = exports.registerDependant = exports.registerPrincipal = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../models/db");
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
                url: 'http://airtelapi.aar-insurance.ug:82/api/auth/airtel/login',
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
        console.log(user.first_name);
        const userData = {
            surname: user.last_name || `256${user.phone_number}`,
            first_name: user.first_name || `256${user.phone_number}`,
            other_names: "",
            gender: 1,
            dob: "1900-01-01",
            pri_dep: "24",
            family_title: "3",
            tel_no: `256${user.phone_number}`,
            email: user.email || "admin@bluewave.insure",
            next_of_kin: {
                surname: user.last_name,
                first_name: user.first_name,
                other_names: user.middle_name || "",
                tel_no: user.phone_number,
            },
            member_status: "1",
            health_option: "64",
            health_plan: "AIRTEL_" + policy.policy_type,
            corp_id: "758",
            policy_start_date: policy.policy_start_date,
            policy_end_date: policy.policy_end_date,
            unique_profile_id: user.membership_id + '',
            money_transaction_id: policy.airtel_money_id,
        };
        console.log("REGISTER PRINCIPAL AAR", userData);
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
// // Define a function to create the dependent
function createDependant(existingUser, myPolicy) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // const existingUser = await db.users.findOne({
            //   where: {
            //     phone_number:  phoneNumber
            //   }
            // });
            // //  console.log('existingUser', existingUser);
            // if (!existingUser) {
            //   throw new Error("USER NOT FOUND");
            // }
            // let myPolicy = await db.policies.findOne({
            //   where: {
            //     user_id: existingUser.user_id,
            //     policy_status: 'paid',
            //     installment_type: 2
            //   }
            // });
            // if (!myPolicy) {
            //   throw new Error("NO FAMILY OR OTHER POLICY FOUND");
            // }
            let arr_member;
            let dependant;
            let number_of_dependants = parseFloat(myPolicy.total_member_number.split("")[2]);
            console.log("number_of_dependants ", number_of_dependants);
            if (existingUser.arr_member_number == null) {
                console.log("REGISTER PRINCIPAL");
                // Introduce a delay before calling registerPrincipal
                yield new Promise(resolve => {
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        const arr_member = yield registerPrincipal(existingUser, myPolicy);
                        console.log("ARR PRINCIPAL CREATED", arr_member);
                        resolve(true);
                    }), 1000); // Adjust the delay as needed (1 second in this example)
                });
            }
            else {
                // Fetch member status data or register principal based on the condition
                yield new Promise(resolve => {
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        arr_member = yield fetchMemberStatusData({
                            member_no: existingUser.arr_member_number,
                            unique_profile_id: existingUser.membership_id + "",
                        });
                        console.log("AAR MEMBER FOUND", arr_member);
                        if (arr_member.code == 624) {
                            arr_member = yield registerPrincipal(existingUser, myPolicy);
                            console.log("ARR PRINCIPAL CREATED", arr_member);
                            resolve(true);
                        }
                        for (let i = 1; i <= number_of_dependants; i++) {
                            let dependant_first_name = `first_name__${existingUser.membership_id}_${i}`;
                            let dependant_other_names = `other_names__${existingUser.membership_id}_${i}`;
                            let dependant_surname = `surname__${existingUser.membership_id}_${i}`;
                            if (arr_member.policy_no != null && arr_member.code == 200) {
                                // Use a Promise with setTimeout to control the creation
                                yield new Promise(resolve => {
                                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                        dependant = yield registerDependant({
                                            member_no: existingUser.arr_member_number,
                                            surname: dependant_surname,
                                            first_name: dependant_first_name,
                                            other_names: dependant_other_names,
                                            gender: 1,
                                            dob: "1990-01-01",
                                            email: "dependant@bluewave.insure",
                                            pri_dep: "25",
                                            family_title: "25",
                                            tel_no: myPolicy.phone_number,
                                            next_of_kin: {
                                                surname: "",
                                                first_name: "",
                                                other_names: "",
                                                tel_no: "",
                                            },
                                            member_status: "1",
                                            health_option: "64",
                                            health_plan: "AIRTEL_" + (myPolicy === null || myPolicy === void 0 ? void 0 : myPolicy.policy_type),
                                            policy_start_date: myPolicy.policy_start_date,
                                            policy_end_date: myPolicy.policy_end_date,
                                            unique_profile_id: existingUser.membership_id + "",
                                        });
                                        if (dependant.code == 200) {
                                            console.log(`Dependant ${i} created:`, dependant);
                                            myPolicy.arr_policy_number = arr_member === null || arr_member === void 0 ? void 0 : arr_member.policy_no;
                                            dependant.unique_profile_id = existingUser.membership_id + "";
                                            let updateDependantMemberNo = [];
                                            updateDependantMemberNo.push(dependant.member_no);
                                            yield db_1.db.policies.update({ dependant_member_numbers: updateDependantMemberNo }, { where: { policy_id: myPolicy.policy_id } });
                                            let updatePremiumData = yield updatePremium(dependant, myPolicy);
                                            if (updatePremiumData == 200) {
                                                console.log("AAR UPDATE PREMIUM", updatePremiumData);
                                                resolve(true);
                                            }
                                            resolve(true);
                                        }
                                    }), 1000 * i); // Adjust the delay as needed
                                });
                            }
                            else {
                                console.log("NO ARR MEMBER");
                            }
                        }
                    }), 1000); // Adjust the delay as needed (1 second in this example)
                });
            }
        }
        catch (error) {
            console.error('Error:', error.message);
        }
    });
}
exports.createDependant = createDependant;
function updatePremium(user, policy) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('USER DEPENDANTS', user.member_no, user.unique_profile_id);
            const main_benefit_limit = policy.sum_insured;
            const last_expense_limit = policy.last_expense_insured;
            let ultimatePremium = policy.premium;
            const number_of_dependants = parseFloat(policy === null || policy === void 0 ? void 0 : policy.total_member_number.split("")[2]) || 0;
            console.log("Number of dependants:", number_of_dependants);
            if (policy.total_member_number !== "M" && number_of_dependants > 0) {
                const policyPremium = policy.premium;
                const memberSize = (policy.total_member_number).split("")[2];
                console.log(policyPremium, memberSize);
                ultimatePremium = policyPremium / (parseInt(memberSize) + 1);
            }
            const requestData = {
                member_no: user.member_no,
                unique_profile_id: user.unique_profile_id,
                health_plan: "AIRTEL_" + policy.policy_type,
                health_option: "64",
                premium: ultimatePremium,
                premium_type: policy.installment_type,
                premium_installment: policy.renewal_order || 1,
                main_benefit_limit: main_benefit_limit,
                last_expense_limit: last_expense_limit,
                money_transaction_id: policy.airtel_money_id || "123456789",
            };
            console.log("REQUEST DATA AAR UPDATE PREMIUM", requestData);
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
            const response = yield axios_1.default.request(config);
            return response.data;
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
