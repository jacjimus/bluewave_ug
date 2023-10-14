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
const lang_1 = __importDefault(require("./lang"));
const configs_1 = __importDefault(require("./configs"));
const ussd_menu_builder_1 = __importDefault(require("ussd-menu-builder"));
const sendSMS_1 = __importDefault(require("../services/sendSMS"));
const uuid_1 = require("uuid");
const utils_1 = require("../services/utils");
const aar_1 = require("../services/aar");
const myAccount_1 = require("./menus/myAccount");
const termsAndConditions_1 = require("./menus/termsAndConditions");
const faqs_1 = require("./menus/faqs");
const buyForSelf_1 = require("./menus/buyForSelf");
const buyForFamily_1 = require("./menus/buyForFamily");
const payment_1 = require("../services/payment");
const db_1 = require("../models/db");
const buyForOthers_1 = require("./menus/buyForOthers");
require("dotenv").config();
const Session = db_1.db.sessions;
const User = db_1.db.users;
const Policy = db_1.db.policies;
const Beneficiary = db_1.db.beneficiaries;
const Hospitals = db_1.db.hospitals;
const Claim = db_1.db.claims;
const UserHospital = db_1.db.user_hospitals;
const findPolicyByUser = (phone_number) => __awaiter(void 0, void 0, void 0, function* () {
    let policies = yield db_1.db.policies.findAll({
        where: {
            phone_number: phone_number
        },
    });
    return policies[policies.length - 1];
});
const findPendingPolicyByUser = (existingUser) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.db.polices.findOne({
        where: {
            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
            policy_status: "pending",
        },
    });
});
let sessions = {};
let menu = new ussd_menu_builder_1.default();
menu.sessionConfig({
    start: (sessionId, callback) => {
        // initialize current session if it doesn't exist
        // this is called by menu.run()
        if (!(sessionId in sessions))
            sessions[sessionId] = {};
        callback();
    },
    end: (sessionId, callback) => {
        // clear current session
        // this is called by menu.end()
        delete sessions[sessionId];
        callback();
    },
    set: (sessionId, key, value, callback) => {
        // store key-value pair in current session
        sessions[sessionId][key] = value;
        callback();
    },
    get: (sessionId, key, callback) => {
        // retrieve value by key in current session
        let value = sessions[sessionId][key];
        callback(null, value);
    }
});
function default_1(args, db) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (args.phoneNumber.charAt(0) == "+") {
                args.phoneNumber = args.phoneNumber.substring(1);
            }
            // if (args.phoneNumber.length > 9) {
            //   args.phoneNumber = args.phoneNumber.substring(3);
            // }
            function findUserByPhoneNumber(phoneNumber) {
                return __awaiter(this, void 0, void 0, function* () {
                    let existingUser = yield db.users.findOne({
                        where: {
                            phone_number: phoneNumber,
                        },
                    });
                    if (!existingUser) {
                        existingUser = yield db.users.create({
                            user_id: (0, uuid_1.v4)(),
                            phone_number: phoneNumber,
                            membership_id: Math.floor(100000 + Math.random() * 900000),
                            pin: Math.floor(1000 + Math.random() * 9000),
                            first_name: "",
                            middle_name: "",
                            last_name: "",
                            name: "",
                            partner_id: 2,
                            role: "user",
                        });
                    }
                    return existingUser;
                });
            }
            const buildInput = {
                current_input: args.text,
                full_input: args.text,
                masked_input: args.text,
                active_state: configs_1.default.start_state,
                sid: configs_1.default.session_prefix + args.sessionId,
                language: configs_1.default.default_lang,
                phone_number: args.phoneNumber,
                hash: "",
                partner_id: 2,
            };
            // // Check if session exists
            // let session = await Session.findOne({
            //   where: {
            //     sid: buildInput.sid,
            //   },
            // });
            // if (!session) {
            //   // Create new session
            //   session = await Session.create(buildInput);
            // } else {
            //   // Update existing session
            //   await Session.update(buildInput, {
            //     where: {
            //       sid: buildInput.sid,
            //     },
            //   });
            // }
            // ===============SET MENU STATES============
            // user = await getUserByPhoneNumber( args.phoneNumber, 2);
            // userHospital = await UserHospital.findOne({
            //   where: {
            //     user_id: user.user_id,
            //   },
            // });
            //hospitalList = await Hospitals.findAll();
            // pending_policy = findPendingPolicyByUser(user);
            menu.startState({
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log(" ===========================");
                    console.log(" ******** START MENU *******");
                    console.log(" ===========================");
                    menu.con("Ddwaliro Care" +
                        "\n1. Buy for self" +
                        "\n2. Buy (family)" +
                        "\n3. Buy (others)" +
                        "\n4. Make Claim" +
                        "\n5. My Policy" +
                        "\n6. View Hospital" +
                        "\n7. Terms & Conditions" +
                        "\n8. FAQs");
                }),
                next: {
                    "1": "buyforself",
                    "2": "buyForFamily",
                    "3": "buyForOthers",
                    "4": "makeClaim",
                    "5": "myAccount",
                    "6": "chooseHospital",
                    "7": "termsAndConditions",
                    "8": "faqs",
                },
            });
            menu.state("account", {
                run: () => {
                    menu.con("Ddwaliro Care" +
                        "\n1. Buy for self" +
                        "\n2. Buy (family)" +
                        "\n3. Buy (others)" +
                        "\n4. Make Claim" +
                        "\n5. My Policy" +
                        "\n6. View Hospital" +
                        "\n7. Terms & Conditions" +
                        "\n8. FAQs");
                },
                next: {
                    "1": "buyforself",
                    "2": "buyForFamily",
                    "3": "buyForOthers",
                    "4": "makeClaim",
                    "5": "myAccount",
                    "6": "chooseHospital",
                    "7": "termsAndConditions",
                    "8": "faqs",
                },
            });
            //=================BUY FOR SELF=================
            (0, buyForSelf_1.buyForSelf)(menu, args, db);
            //============  BUY FOR FAMILY ===================
            (0, buyForFamily_1.buyForFamily)(menu, args, db);
            //=================BUY FOR OTHERS=================
            (0, buyForOthers_1.buyForOthers)(menu, args, db);
            //================MY ACCOUNT===================
            (0, myAccount_1.myAccount)(menu, args, db);
            menu.state("myAccount", {
                run: () => {
                    console.log("* MY ACCOUNT ");
                    menu.con("My Account" +
                        "\n1. Policy Status" +
                        "\n2. Pay Now" +
                        "\n3. Renew Policy" +
                        "\n4. Update My Profile (KYC)" +
                        "\n5. Cancel Policy" +
                        "\n6. Add Dependant" +
                        "\n7. My Hospital" +
                        "\n0. Back" +
                        "\n00. Main Menu");
                },
                next: {
                    "1": "myInsurancePolicy",
                    "2": "payNow",
                    "3": "renewPolicy",
                    "4": "updateProfile",
                    "5": "cancelPolicy",
                    "6": "addDependant",
                    "7": "myHospitalOption",
                    "0": "account",
                    "00": "account",
                },
            });
            //update profile ( user dob and gender)
            menu.state("updateProfile", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log("Update Profile");
                    menu.con(`What's your gender?
        1. Male
        2. Female
        0. Back
        00. Main Menu`);
                }),
                next: {
                    "1": "updateGender",
                    "2": "updateGender",
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("updateGender", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const gender = menu.val === "1" ? "M" : "F";
                    const user = yield User.update({ gender }, { where: { phone_number: args.phoneNumber } });
                    console.log("Updated user:", user);
                    menu.con(`Enter your date of birth in the format DDMMYYYY (e.g., 01011990):
  0. Back
  00. Main Menu`);
                }),
                next: {
                    "*\\d{8}": "updateDob",
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("updateDob", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let dob = menu.val;
                    console.log("Input Date of Birth:", dob);
                    // Remove all non-numeric characters
                    dob = dob.replace(/\D/g, "");
                    console.log("Cleaned Date of Birth:", dob);
                    // Convert DDMMYYYY to a valid date
                    let day = parseInt(dob.substring(0, 2));
                    let month = parseInt(dob.substring(2, 4));
                    let year = parseInt(dob.substring(4, 8));
                    let date = new Date(year, month - 1, day);
                    console.log("Parsed Date of Birth:", date);
                    const user = yield User.update({
                        dob: date,
                    }, {
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    console.log("User DOB Update:", user);
                    menu.con(`Enter your marital status
        1. Single
        2. Married
        3. Divorced
        4. Widowed
        0. Back
        00. Main Menu`);
                }),
                next: {
                    "*[0-9]": "updateMaritalStatus",
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("updateMaritalStatus", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const { gender, first_name } = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    const ben_marital_status = getMenuOption(menu.val);
                    const title = getTitle(ben_marital_status, gender);
                    console.log("ben_marital_status", ben_marital_status);
                    const user = yield User.update({
                        marital_status: ben_marital_status,
                        title: title,
                    }, {
                        where: {
                            phone_number: args.phoneNumber,
                        },
                    });
                    console.log("User Marital Status Update:", user);
                    // Send SMS
                    const message = `Dear ${title} ${first_name}, your profile has been updated successfully`;
                    yield (0, sendSMS_1.default)(args.phoneNumber, message);
                    menu.con(`Your profile has been updated successfully
        0. Back
        00. Main Menu`);
                }),
                next: {
                    "0": "account",
                    "00": "account",
                },
            });
            function getMenuOption(val) {
                const options = {
                    "1": "single",
                    "2": "married",
                    "3": "divorced",
                    "4": "widowed",
                };
                return options[val] || "";
            }
            function getTitle(maritalStatus, gender) {
                let title = gender === "M" ? "Mr" : "Ms";
                if (maritalStatus === "married") {
                    title = gender === "M" ? "Mr" : "Mrs";
                }
                return title;
            }
            // ======= ADD SPOUSE DEPENDANT =========
            menu.state("addDependant", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Add Dependant " +
                        "\n1. Update Spouse" +
                        "\n2. Add Child" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
                next: {
                    "1": "updateSpouse",
                    "2": "addChild",
                    "0": "myAccount",
                    "00": "account",
                },
            });
            menu.state("updateSpouse", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Enter gender of spouse: " + "\n1. Male" + "\n2. Female");
                }),
                next: {
                    "*[0-9]": "updateBeneficiaryGender",
                },
            });
            menu.state("updateBeneficiaryGender", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const gender = menu.val.toString() == "1" ? "M" : "F";
                    console.log("GENDER", gender);
                    let existingUser = yield findUserByPhoneNumber(args.phoneNumber);
                    menu.session.set('user', existingUser);
                    console.log("USER DATA SESSION", existingUser);
                    let beneficiary = yield Beneficiary.findOne({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            relationship: "SPOUSE",
                        },
                    });
                    if (!beneficiary) {
                        return menu.end("You have not added a spouse, please buy family cover first");
                    }
                    console.log("BENEFICIARY: ", beneficiary);
                    beneficiary.gender = gender;
                    yield beneficiary.save();
                    menu.con(`Enter your spouse's date of birth in the format DDMMYYYY e.g 01011990
            0. Back
            00. Main Menu
             `);
                }),
                next: {
                    "*[0-9]": "updateBeneficiaryDob",
                    "0": "myAccount",
                    "00": "account",
                },
            });
            menu.state("updateBeneficiaryDob", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const spouse_dob = menu.val;
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    // convert ddmmyyyy to valid date
                    let day = spouse_dob.substring(0, 2);
                    let month = spouse_dob.substring(2, 4);
                    let year = spouse_dob.substring(4, 8);
                    let date = new Date(Number(year), Number(month) - 1, Number(day));
                    console.log("DATE OF BIRTH", date);
                    let beneficiary = yield Beneficiary.findOne({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            relationship: "SPOUSE",
                        },
                    });
                    beneficiary.dob = date;
                    beneficiary.age = new Date().getFullYear() - date.getFullYear();
                    yield beneficiary.save();
                    console.log("BENEFICIARY: ", beneficiary);
                    const policy = yield Policy.findOne({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            beneficiary: "FAMILY",
                        },
                    });
                    console.log("POLICY: ", policy);
                    let arr_member = yield (0, aar_1.fetchMemberStatusData)({
                        member_no: existingUser.arr_member_number,
                        unique_profile_id: existingUser.membership_id + "",
                    });
                    console.log("arr_member", arr_member);
                    if (arr_member.code == 200) {
                        yield (0, aar_1.registerDependant)({
                            member_no: existingUser.arr_member_number,
                            surname: beneficiary.last_name,
                            first_name: beneficiary.first_name,
                            other_names: beneficiary.middle_name || beneficiary.last_name,
                            gender: beneficiary.gender == "M" ? "1" : "2",
                            dob: date.toISOString().split("T")[0],
                            email: "dependant@bluewave.insure",
                            pri_dep: "25",
                            family_title: "4",
                            tel_no: beneficiary.phone_number,
                            next_of_kin: {
                                surname: "",
                                first_name: "",
                                other_names: "",
                                tel_no: "",
                            },
                            member_status: "1",
                            health_option: "63",
                            health_plan: "AIRTEL_" + (policy === null || policy === void 0 ? void 0 : policy.policy_type),
                            policy_start_date: policy.policy_start_date,
                            policy_end_date: policy.policy_end_date,
                            unique_profile_id: existingUser.membership_id + "-01",
                        });
                    }
                    menu.con(`Your spouse ${beneficiary.full_name} profile has been updated successfully
                0. Back
                00. Main Menu
                 `);
                }),
                next: {
                    "0": "myAccount",
                    "00": "account",
                },
            });
            // ======= ADD CHILD DEPENDANT =========
            menu.state("addChild", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Enter child's name: ");
                }),
                next: {
                    "*[a-zA-Z]": "addChildGender",
                },
            });
            menu.state("addChildGender", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let child_name = menu.val;
                    console.log("CHILD NAME", child_name);
                    let existingUser = yield findUserByPhoneNumber(args.phoneNumber);
                    menu.session.set('user', existingUser);
                    console.log("USER DATA SESSION", existingUser);
                    let beneficiary = yield Beneficiary.findAll({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            relationship: "CHILD",
                        },
                    });
                    console.log("BENEFICIARY CHILD GENDER: ", beneficiary);
                    let newChildDep = yield Beneficiary.create({
                        beneficiary_id: (0, uuid_1.v4)(),
                        user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                        full_name: child_name,
                        first_name: child_name.split(" ")[0],
                        middle_name: child_name.split(" ")[1],
                        last_name: child_name.split(" ")[2] || child_name.split(" ")[1],
                        relationship: "CHILD",
                    });
                    console.log("NEW CHILD BENEFICIARY: ", newChildDep);
                    menu.con("Enter gender of child: " + "\n1. Male" + "\n2. Female");
                }),
                next: {
                    "*[0-9]": "updateChildGender",
                },
            });
            menu.state("updateChildGender", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const gender = menu.val.toString() == "1" ? "M" : "F";
                    console.log("GENDER", gender);
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    let beneficiary = yield Beneficiary.findAll({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            relationship: "CHILD",
                        },
                    });
                    beneficiary = beneficiary[beneficiary.length - 1];
                    if (!beneficiary) {
                        return menu.end("You have not added a spouse, please buy family cover first");
                    }
                    console.log("BENEFICIARY: ", beneficiary);
                    beneficiary.gender = gender;
                    yield beneficiary.save();
                    menu.con(`Enter child's date of birth in the format DDMMYYYY e.g 01011990`);
                }),
                next: {
                    "*[0-9]": "addChildDob",
                    "0": "myAccount",
                    "00": "account",
                },
            });
            menu.state("addChildDob", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let child_dob = menu.val;
                    console.log("CHILD DOB", child_dob);
                    // convert ddmmyyyy to valid date
                    let day = child_dob.substring(0, 2);
                    let month = child_dob.substring(2, 4);
                    let year = child_dob.substring(4, 8);
                    let date = new Date(Number(year), Number(month) - 1, Number(day));
                    console.log("DATE OF BIRTH", date);
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    let beneficiary = yield Beneficiary.findAll({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            relationship: "CHILD",
                        },
                    });
                    console.log("CHILD DOB BENEFICIARY: ", beneficiary);
                    beneficiary = beneficiary[beneficiary.length - 1];
                    beneficiary.dob = date;
                    beneficiary.age = new Date().getFullYear() - date.getFullYear();
                    yield beneficiary.save();
                    console.log("BENEFICIARY: ", beneficiary);
                    const policy = yield Policy.findOne({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            beneficiary: "FAMILY",
                        },
                    });
                    console.log("POLICY: ", policy);
                    let arr_member = yield (0, aar_1.fetchMemberStatusData)({
                        member_no: existingUser.arr_member_number,
                        unique_profile_id: existingUser.membership_id + "",
                    });
                    console.log("arr_member", arr_member);
                    let arr_dep_reg;
                    if (arr_member.code == 200) {
                        arr_dep_reg = yield (0, aar_1.registerDependant)({
                            member_no: existingUser.arr_member_number,
                            surname: beneficiary.last_name,
                            first_name: beneficiary.first_name,
                            other_names: beneficiary.middle_name || beneficiary.last_name,
                            gender: beneficiary.gender == "M" ? "1" : "2",
                            dob: date.toISOString().split("T")[0],
                            email: "dependant@bluewave.insure",
                            pri_dep: "25",
                            family_title: "25",
                            tel_no: existingUser.phone_number,
                            next_of_kin: {
                                surname: "",
                                first_name: "",
                                other_names: "",
                                tel_no: "",
                            },
                            member_status: "1",
                            health_option: "63",
                            health_plan: "AIRTEL_" + (policy === null || policy === void 0 ? void 0 : policy.policy_type),
                            policy_start_date: policy.policy_start_date,
                            policy_end_date: policy.policy_end_date,
                            unique_profile_id: existingUser.membership_id + "-02",
                        });
                        beneficiary.dependant_member_number = arr_dep_reg.member_no;
                        yield beneficiary.save();
                    }
                    menu.con(`Your child ${beneficiary.full_name} profile has been updated successfully
                0. Back
                00. Main Menu
                 `);
                }),
                next: {
                    "0": "myAccount",
                    "00": "account",
                },
            });
            //============CANCEL POLICY=================
            menu.state("cancelPolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let existingUser = yield findUserByPhoneNumber(args.phoneNumber);
                    menu.session.set('user', existingUser);
                    console.log("USER DATA SESSION", existingUser);
                    if (existingUser) {
                        const policy = yield findPolicyByUser(existingUser.user_id);
                        console.log("POLICY: ", policy);
                        if (policy) {
                            // 1. Cancel Policy
                            menu.con(`Hospital cover ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n` +
                                // `   Inpatient limit: UGX ${policy.sum_insured}\n` +
                                // `   Remaining: UGX ${policy.sum_insured}\n` +
                                // `   Last Expense Per Person Benefit: ${policy.last_expense_insured}\n\n` +
                                "\n1. Cancel Policy");
                        }
                        else {
                            menu.con("Your policy is INACTIVE\n0 Buy cover");
                        }
                    }
                    else {
                        menu.end("User not found");
                    }
                }),
                next: {
                    "0": "account",
                    "1": "cancelPolicyPin",
                },
            });
            //cancel policy pin
            menu.state("cancelPolicyPin", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    const policy = yield Policy.findOne({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                        },
                    });
                    let today = new Date();
                    console.log("POLICY: ", policy);
                    menu.con(`By cancelling, you will no longer be covered for ${policy.policy_type.toUpperCase()} Insurance as of ${today}.
            '\nEnter PIN or Membership ID to  Confirm cancellation
                0.Back
                00.Main Menu`);
                }),
                next: {
                    "*[0-9]": "cancelPolicyConfirm",
                },
            });
            //cancel policy confirm
            menu.state("cancelPolicyConfirm", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const to = args.phoneNumber;
                    let today = new Date();
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    let policy;
                    if (existingUser) {
                        policy = yield Policy.findOne({
                            where: {
                                user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            },
                        });
                    }
                    console.log("POLICY: ", policy);
                    if (policy) {
                        // 1. Cancel Policy
                        policy.policy_status = "cancelled";
                        policy.policy_end_date = today;
                        yield policy.save();
                    }
                    const message = `You CANCELLED your Medical cover cover. Your Policy will expire on ${today} and you will not be covered. Dial *187*7*1# to reactivate.`;
                    yield (0, sendSMS_1.default)(to, message);
                    menu.con(`Your policy will expire on ${today}  and will not be renewed. Dial *185*7*6# to reactivate.
            0.Back     00.Main Menu`);
                }),
                next: {
                    "0": "myAccount",
                    "00": "account",
                },
            });
            //my insurance policy
            menu.state("myInsurancePolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let existingUser = yield findUserByPhoneNumber(args.phoneNumber);
                    menu.session.set('user', existingUser);
                    console.log("USER DATA SESSION", existingUser);
                    let policies = yield Policy.findAll({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                        },
                    });
                    let otherPolicies = yield Policy.findAll({
                        where: {
                            bought_for: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                        },
                    });
                    console.log("OTHER POLICIES: ", otherPolicies);
                    policies = policies.concat(otherPolicies);
                    console.log("POLICIES: ", policies);
                    function formatNumberToM(value) {
                        return (value / 1000000).toFixed(1) + "M";
                    }
                    if (policies.length === 0) {
                        menu.con("You have no policies\n" +
                            "1. Buy cover\n" +
                            "0. Back\n" +
                            "00. Main Menu");
                        return;
                    }
                    let policyInfo = "";
                    for (let i = 0; i < policies.length; i++) {
                        let policy = policies[i];
                        //         Bronze cover ACTIVE up to DD/MM/YYYY
                        // Inpatient limit L: UGX 3,000,000. Balance remaining UGX 2,300,000
                        //format date to dd/mm/yyyy
                        let formatDate = (date) => {
                            const dd = String(date.getDate()).padStart(2, "0");
                            const mm = String(date.getMonth() + 1).padStart(2, "0");
                            const yyyy = date.getFullYear();
                            return `${dd}/${mm}/${yyyy}`;
                        };
                        policy.policy_end_date = formatDate(policy.policy_end_date);
                        policyInfo += ` Dwaliro Inpatient UGX ${formatNumberToM(policy.sum_insured)} and Funeral benefit UGX ${formatNumberToM(policy.last_expense_insured)} is active and paid to ${policy.policy_end_date.toDateString()}.
        `;
                    }
                    policyInfo += "Dial *185*7*6# to renew";
                    policyInfo += "\n0. Back\n00. Main Menu";
                    menu.end(`My Insurance Policies:\n\n${policyInfo}`);
                }),
                next: {
                    "1": "account",
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("manageAutoRenew", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con("Manage auto-renew " +
                        "\n1. Activate auto-renew" +
                        "\n2. Deactivate auto-renew" +
                        "\n0.Back" +
                        "\n00.Main Menu");
                }),
            });
            //renewPolicy
            menu.state("renewPolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    const policy = yield Policy.findOne({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            installment: "2",
                        },
                    });
                    console.log("POLICY: ", policy);
                    if (!policy) {
                        menu.con("You have no policy to renew\n1. Buy cover\n0. Back\n00. Main Menu");
                        return;
                    }
                    menu.con(`Your ${policy.policy_type.toUpperCase()} cover expires on ${policy.policy_end_date.toDateString()}.\n` +
                        `   Pending amount : UGX ${policy.policy_pending_premium}\n` +
                        "\n1. Renew Policy");
                }),
                next: {
                    "1": "renewPolicyPin",
                    "0": "myAccount",
                    "00": "account",
                },
            });
            //================== MAKE CLAIM ===================
            menu.state("makeClaim", {
                run: () => {
                    console.log("* MAKE CLAIM");
                    menu.con("Make Claim " +
                        "\n1. Inpatient Claim" +
                        "\n2. Death Claim" +
                        "\n0. Back" +
                        "\n00. Main Menu");
                },
                next: {
                    "1": "inpatientClaim",
                    "2": "deathClaim",
                    "0": "account",
                    "00": "insurance",
                },
            });
            //==================INPATIENT CLAIM===================
            menu.state("inpatientClaim", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let claim_type = menu.val.toString();
                    let existingUser = yield findUserByPhoneNumber(args.phoneNumber);
                    menu.session.set('user', existingUser);
                    console.log("USER DATA SESSION", existingUser);
                    const { policy_id, policy_type, beneficiary, sum_insured, last_expense_insured, } = yield Policy.findOne({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            policy_status: "paid",
                        },
                    });
                    const claimId = (0, utils_1.generateClaimId)();
                    console.log(claimId);
                    let claim_amount;
                    if (claim_type == "1") {
                        claim_type = "Inpatient Claim";
                        claim_amount = sum_insured;
                    }
                    else {
                        claim_type = "Death Claim";
                        claim_amount = last_expense_insured;
                    }
                    let userClaim = yield Claim.findOne({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            claim_type: claim_type,
                            claim_status: "paid",
                        },
                    });
                    if (userClaim) {
                        menu.end(`Discharge Claim already made for this policy`);
                        return;
                    }
                    const newClaim = yield Claim.create({
                        claim_number: claimId,
                        policy_id: policy_id,
                        user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                        claim_date: new Date(),
                        claim_status: "pending",
                        partner_id: existingUser.partner_id,
                        claim_description: `${claim_type} ID: ${claimId} for Member ID: ${existingUser.membership_id}  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} policy`,
                        claim_type: claim_type,
                        claim_amount: claim_amount,
                    });
                    console.log("CLAIM", newClaim);
                    menu.end(`Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service`);
                }),
                next: {
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("deathClaim", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    menu.con(`Enter phone of next of Kin `);
                }),
                next: {
                    "*\\d+": "deathClaimPhoneNumber",
                    "0": "inpatientClaim",
                    "00": "account",
                },
            });
            menu.state("deathClaimPhoneNumber", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    const nextOfKinPhoneNumber = menu.val;
                    yield Beneficiary.findOne({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            beneficiary_type: "NEXTOFKIN",
                        },
                    });
                    const newKin = yield Beneficiary.create({
                        beneficiary_id: (0, uuid_1.v4)(),
                        user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                        phone_number: nextOfKinPhoneNumber,
                        beneficiary_type: "NEXTOFKIN",
                    });
                    console.log("NEXT OF KIN PHONE NUMBER", nextOfKinPhoneNumber);
                    console.log("NEW KIN", newKin);
                    menu.con(`Enter Name of deceased
                    0.Back 00.Main Menu  `);
                }),
                next: {
                    "*\\w+": "deathClaimName",
                    "0": "deathClaim",
                    "00": "account",
                },
            });
            menu.state("deathClaimName", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    const deceasedName = menu.val;
                    console.log("DECEASED NAME", deceasedName);
                    const firstName = deceasedName.split(" ")[0];
                    const middleName = deceasedName.split(" ")[1];
                    const lastName = deceasedName.split(" ")[2] || deceasedName.split(" ")[1];
                    yield Beneficiary.update({
                        full_name: deceasedName,
                        first_name: firstName,
                        middle_name: middleName,
                        last_name: lastName,
                    }, { where: { user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id, beneficiary_type: "NEXTOFKIN" } });
                    menu.con(`Enter your Relationship to the deceased
                   0.Back 00.Main Menu `);
                }),
                next: {
                    "*\\w+": "deathClaimRelationship",
                    "0": "deathClaimName",
                    "00": "insurance",
                },
            });
            menu.state("deathClaimRelationship", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const relationship = menu.val;
                    console.log("RELATIONSHIP", relationship);
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    yield Beneficiary.update({ relationship: relationship }, { where: { user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id, beneficiary_type: "NEXTOFKIN" } });
                    menu.con(`Enter Date of death in the format DDMMYYYY e.g 01011990"


          0.Back 00.Main Menu
           `);
                }),
                next: {
                    "*\\w+": "deathClaimDate",
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("deathClaimDate", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let dateOfDeath = menu.val;
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    // convert ddmmyyyy to valid date
                    let day = dateOfDeath.substring(0, 2);
                    let month = dateOfDeath.substring(2, 4);
                    let year = dateOfDeath.substring(4, 8);
                    let date = new Date(Number(year), Number(month) - 1, Number(day));
                    console.log("date", date);
                    let thisYear = new Date().getFullYear();
                    dateOfDeath = date.toISOString().split("T")[0];
                    yield Beneficiary.update({ date_of_death: dateOfDeath, age: thisYear - date.getFullYear() }, { where: { user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id, beneficiary_type: "NEXTOFKIN" } });
                    menu.con(`Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107
                   0.Back 00.Main Menu
          `);
                    const sms = `Your claim have been submitted. Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107 `;
                    yield (0, sendSMS_1.default)(existingUser.phone_number, sms);
                }),
                next: {
                    "0": "deathClaimRelationship",
                    "00": "account",
                },
            });
            //==================PAY NOW===================
            menu.state("payNow", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    console.log("* PAY NOW");
                    let existingUser = yield findUserByPhoneNumber(args.phoneNumber);
                    menu.session.set('user', existingUser);
                    console.log("USER DATA SESSION", existingUser);
                    if (!existingUser) {
                        menu.end("User not found");
                        return;
                    }
                    const policy = yield findPendingPolicyByUser(existingUser);
                    if (!policy) {
                        menu.end("You have no pending policies");
                        return;
                    }
                    const outstandingPremiumMessage = `Your outstanding premium is UGX ${policy.policy_pending_premium}`;
                    const enterPinMessage = "Enter PIN to Pay Now\n0. Back\n00. Main Menu";
                    menu.con(`${outstandingPremiumMessage}\n${enterPinMessage}`);
                }),
                next: {
                    "*\\d+": "payNowPremiumPin",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("payNowPremiumPin", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const pin = parseInt(menu.val);
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    if (isNaN(pin)) {
                        menu.end("Invalid PIN");
                        return;
                    }
                    const selectedPolicy = yield findPendingPolicyByUser(existingUser);
                    if (!selectedPolicy) {
                        menu.end("You have no pending policies");
                        return;
                    }
                    const { user_id, phone_number, partner_id, policy_id, policy_deduction_amount, membership_id, } = yield Policy.findOne({
                        where: {
                            user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                        },
                    });
                    let paymentStatus = yield (0, payment_1.airtelMoney)(user_id, partner_id, selectedPolicy.policy_id, phone_number, selectedPolicy.premium, membership_id, "UG", "UGX");
                    if (paymentStatus.code === 200) {
                        const message = `Paid UGX ${selectedPolicy.policy_deduction_amount} for ${selectedPolicy.policy_type.toUpperCase()} cover. Your next payment will be due on ${selectedPolicy.policy_end_date.toDateString()}`;
                        menu.end(message);
                    }
                    else {
                        menu.end("Payment failed. Please try again");
                    }
                }),
            });
            menu.state("renewPolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const bronzeLastExpenseBenefit = "UGX 1,000,000";
                    const silverLastExpenseBenefit = "UGX 1,500,000";
                    const goldLastExpenseBenefit = "UGX 2,000,000";
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    try {
                        if (existingUser) {
                            const policies = yield Policy.findAll({
                                where: {
                                    user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                                },
                            });
                            if (policies.length === 0) {
                                menu.con("You have no policies\n" +
                                    "1. Buy cover\n" +
                                    "0. Back\n" +
                                    "00. Main Menu");
                                return;
                            }
                            let policyInfo = "";
                            for (let i = 0; i < policies.length; i++) {
                                let policy = policies[i];
                                let benefit;
                                switch (policy.policy_type) {
                                    case "MINI":
                                        benefit = bronzeLastExpenseBenefit;
                                        break;
                                    case "MIDI":
                                        benefit = silverLastExpenseBenefit;
                                        break;
                                    case "BIGGIE":
                                        benefit = goldLastExpenseBenefit;
                                        break;
                                    default:
                                        break;
                                }
                                policyInfo += `${i + 1}. ${policy.policy_type.toUpperCase()} ${policy.policy_status.toUpperCase()} to ${policy.policy_end_date}\n`;
                                // `   Inpatient limit: UGX ${policy.sum_insured}\n` +
                                // `   Remaining: UGX ${policy.sum_insured}\n` +
                                // `   Last Expense Per Person Benefit: ${benefit}\n\n`;
                            }
                            menu.con(`Choose policy to pay for
          ${policyInfo}
          00.Main Menu`);
                        }
                    }
                    catch (error) {
                        console.error("Error:", error);
                        menu.end("An error occurred while fetching policies");
                    }
                }),
                next: {
                    "*\\d+": "choosePolicy",
                    "0": "account",
                    "00": "insurance",
                },
            });
            menu.state("choosePolicy", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const policyIndex = Number(menu.val) - 1;
                    try {
                        let existingUser = yield menu.session.get('user');
                        console.log("USER DATA SESSION", existingUser);
                        const policies = yield findPolicyByUser(existingUser.user_id);
                        const selectedPolicy = policies[policyIndex];
                        if (!selectedPolicy) {
                            throw new Error("Invalid policy selection");
                        }
                        if (selectedPolicy.policy_status === "paid") {
                            console.log("Policy already paid for");
                            console.log("Policy", selectedPolicy, selectedPolicy.policy_paid_amount, selectedPolicy.premium, selectedPolicy.policy_paid_amount == selectedPolicy.premium);
                            if (selectedPolicy.policy_paid_amount == selectedPolicy.sum_insured) {
                                menu.end(`Your ${selectedPolicy.policy_type.toUpperCase()} cover is already paid for`);
                            }
                        }
                        selectedPolicy.policy_pending_premium =
                            selectedPolicy.premium - selectedPolicy.policy_paid_amount;
                        const updatedPolicy = yield selectedPolicy.save();
                        if (!updatedPolicy) {
                            menu.end("Failed to update policy");
                        }
                        const userId = existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id;
                        const phoneNumber = existingUser.phone_number;
                        const partner_id = existingUser.partner_id;
                        const policy_id = selectedPolicy.policy_id;
                        const amount = selectedPolicy.policy_deduction_amount;
                        const reference = existingUser.membership_id;
                        const payment = yield (0, payment_1.airtelMoney)(userId, partner_id, policy_id, phoneNumber, amount, reference, "UG", "UGX");
                        if (payment.code === 200) {
                            const message = `Your request for ${selectedPolicy.policy_type.toUpperCase()} ${selectedPolicy.beneficiary.toUpperCase()}, UGX ${selectedPolicy.premium} has been received and will be processed shortly. Please enter your Airtel Money PIN when asked.`;
                            menu.end(message);
                        }
                        else {
                            menu.end("Payment failed. Please try again");
                        }
                    }
                    catch (error) {
                        console.error("Error:", error);
                        menu.end("An error occurred while processing the payment");
                    }
                }),
            });
            //==================FAQS===================
            (0, faqs_1.displayFaqsMenu)(menu);
            //===================TERMS AND CONDITIONS===================
            (0, termsAndConditions_1.termsAndConditions)(menu, args);
            //===================CHOOSE HOSPITAL===================
            menu.state("chooseHospital", {
                run: () => {
                    console.log("* CHOOSE HOSPITAL");
                    const regions = [
                        "Central Region",
                        "Western Region",
                        "Eastern Region",
                        "Karamoja Region",
                        "West Nile Region",
                        "Northern Region",
                    ];
                    let message = "Select Region\n";
                    regions.forEach((region, index) => {
                        message += `${index + 1}. ${region}\n`;
                    });
                    message += "0. Back";
                    menu.con(message);
                },
                next: {
                    "*\\d+": "chooseHospital.distict",
                    "0": "chooseHospital",
                },
            });
            menu.state("chooseHospital.distict", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const region = parseInt(menu.val);
                    const regions = [
                        "Central Region",
                        "Western Region",
                        "Eastern Region",
                        "Karamoja Region",
                        "West Nile Region",
                        "Northern Region",
                    ];
                    console.log("USER");
                    let existingUser = yield findUserByPhoneNumber(args.phoneNumber);
                    menu.session.set('user', existingUser);
                    console.log("USER DATA SESSION", existingUser);
                    console.log("REGION", region, regions[region - 1]);
                    const userHospital = yield UserHospital.findOne({
                        where: {
                            user_id: existingUser.user_id,
                        },
                    });
                    console.log("USER HOSPITAL", userHospital);
                    if (userHospital) {
                        yield UserHospital.update({
                            hospital_region: regions[region - 1],
                        }, {
                            where: {
                                user_id: existingUser.user_id,
                            },
                        });
                    }
                    else {
                        yield UserHospital.create({
                            user_hospital_id: (0, uuid_1.v4)(),
                            user_id: existingUser.user_id,
                            hospital_region: regions[region - 1],
                        });
                    }
                    const user_hospital_region = userHospital.hospital_region;
                    const hospitalListByRegion = yield Hospitals.findAll({
                        where: {
                            region: user_hospital_region,
                        },
                    }, { raw: true });
                    console.log("HOSPITAL LIST BY REGION", hospitalListByRegion);
                    // const hospitalListByRegion = hospitalList.filter(
                    //   (hospital) => hospital.region === user_hospital_region
                    // );
                    console.log("HOSPITAL LIST BY REGION", hospitalListByRegion);
                    // if district exists, list district for user to choose
                    let districtList = hospitalListByRegion.map((hospital) => hospital.district);
                    districtList = [...new Set(districtList)];
                    //randomize district list
                    districtList.sort(() => Math.random() - 0.5);
                    menu.con(`Type your District to search e.g ${districtList[0]}
         0.Back 00.Main Menu`);
                }),
                next: {
                    "*\\w+": "chooseHospital.search",
                    "0": "chooseHospital",
                },
            });
            menu.state("chooseHospital.search", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const district = menu.val;
                    console.log("DISTRICT val", district);
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    const userHospital = yield UserHospital.findOne({
                        where: {
                            user_id: existingUser.user_id,
                        },
                    });
                    const user_hospital_region = userHospital.hospital_region;
                    const hospitalList = yield Hospitals.findAll();
                    const hospitalListByRegion = hospitalList.filter((hospital) => hospital.region
                        .toLowerCase()
                        .includes(user_hospital_region.toLowerCase()));
                    //console.log("HOSPITAL LIST BY REGION", hospitalListByRegion)
                    // check if district exists in hospitalListByRegion
                    const hospitalListByDistrict = hospitalListByRegion.filter((hospital) => hospital.district.toLowerCase().includes(district.toLowerCase()));
                    //console.log("HOSPITAL LIST BY DISTRICT", hospitalListByDistrict)
                    if (hospitalListByDistrict.length === 0) {
                        menu.con("No hospital found in this district. Please try again.");
                    }
                    // if district exists, list district for user to choose
                    let districtList = hospitalListByDistrict.map((hospital) => hospital.district);
                    districtList = [...new Set(districtList)];
                    menu.con(`Confirm your District
${districtList.map((district, index) => `${district}`).join("\n")}

   0.Back 00.Main Menu`);
                }),
                next: {
                    "*\\w+": "searchHospital.hospital",
                    "0": "chooseHospital",
                },
            });
            menu.state("searchHospital.hospital", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const distictInput = menu.val;
                    console.log("DISTRICT INPUT", distictInput);
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    const userHospital = yield UserHospital.findOne({
                        where: {
                            user_id: existingUser.user_id,
                        },
                    });
                    const user_hospital_region = userHospital.hospital_region;
                    console.log("USER HOSPITAL REGION", user_hospital_region);
                    // SAVE DISTRICT TO DATABASE
                    userHospital.hospital_district = distictInput;
                    yield userHospital.save();
                    const user_hospital_district = userHospital.hospital_district;
                    const hospitalList = yield Hospitals.findAll();
                    const hospitalsByRegion = hospitalList.filter((hospital) => hospital.region.toLowerCase() ===
                        user_hospital_region.toLowerCase());
                    console.log("hospitalsByRegion", hospitalsByRegion);
                    const hospitalsByDistrict = hospitalsByRegion.filter((hospital) => hospital.district.toLowerCase() ===
                        user_hospital_district.toLowerCase());
                    console.log("hospitalsByDistrict", hospitalsByDistrict);
                    // RANDOM HOSPITAL
                    const randomHospital = hospitalsByDistrict[Math.floor(Math.random() * hospitalsByDistrict.length)];
                    menu.con(`Type your Hospital to search e.g ${randomHospital.hospital_name}`);
                }),
                next: {
                    "*[a-zA-Z]+": "selectHospital.search",
                    "0": "selectRegion",
                },
            });
            menu.state("selectHospital.search", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const hospitalName = menu.val;
                    let existingUser = yield menu.session.get('user');
                    console.log("USER DATA SESSION", existingUser);
                    const userHospital = yield UserHospital.findOne({
                        where: {
                            user_id: existingUser.user_id,
                        },
                    });
                    const user_hospital_region = userHospital.hospital_region;
                    const user_hospital_district = userHospital.hospital_district;
                    const hospitalList = yield Hospitals.findAll();
                    const hospitalsByRegion = hospitalList.filter((hospital) => hospital.region.toLowerCase() ===
                        user_hospital_region.toLowerCase());
                    //console.log('hospitalsByRegion', hospitalsByRegion);
                    const hospitalsByDistrict = hospitalsByRegion.filter((hospital) => hospital.district.toLowerCase() ===
                        user_hospital_district.toLowerCase());
                    console.log("hospitalsByDistrict", hospitalsByDistrict);
                    const hospitalSearchList = hospitalsByDistrict.find((hospital) => hospital.hospital_name
                        .toLowerCase()
                        .includes(hospitalName.toLowerCase()));
                    console.log("hospitalSearchList", hospitalSearchList);
                    if (typeof hospitalSearchList === "undefined") {
                        return menu.end("Sorry, we could not find a hospital with that name. Please try again.");
                    }
                    console.log(typeof hospitalSearchList === "undefined");
                    const { hospital_name, hospital_address, hospital_contact_person, hospital_contact, } = hospitalSearchList;
                    userHospital.hospital_name = hospital_name;
                    userHospital.hospital_address = hospital_address;
                    userHospital.hospital_contact_person = hospital_contact_person;
                    userHospital.hospital_contact = hospital_contact;
                    yield userHospital.save();
                    const hospitalInfo = `
          You have selected ${hospital_name}\n as your preferred facility.Below are the Hospital details
          \nAddress: ${hospital_address}\nContact Person: ${hospital_contact_person}\nContact: ${hospital_contact}`;
                    menu.con(hospitalInfo);
                }),
                next: {
                    "00": "account",
                },
            });
            menu.state("myHospitalOption", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    //ask if they want to change hospital or see details
                    menu.con(`1. See Details
                    2. Change Hospital
                    0. Back  00. Main Menu`);
                }),
                next: {
                    "1": "myHospital",
                    "2": "chooseHospital",
                    "0": "account",
                    "00": "account",
                },
            });
            menu.state("myHospital", {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    if (!UserHospital) {
                        menu.end(`Sorry, you have not selected a hospital yet.
                      \nPlease select a hospital first.
                      \n1. Select Hospital`);
                    }
                    console.log("hospitalDetails", UserHospital);
                    const { hospital_name, hospital_address, hospital_contact_person, hospital_contact, } = UserHospital;
                    const hospitalInfo = `Hospital: ${hospital_name}\nAddress: ${hospital_address}\nContact Person: ${hospital_contact_person}\nContact: ${hospital_contact}`;
                    const message = `Congratulations, you have selected ${hospital_name} as your preferred Inpatient Hospital. Below are the Hospital details:
                        Hospital Name: ${hospital_name}
                        Contact Number: ${hospital_contact}
                        Location: ${hospital_address}
                        Contact Person: ${hospital_contact_person}
                        `;
                    yield (0, sendSMS_1.default)(args.phoneNumber, message);
                    menu.end(hospitalInfo);
                }),
                next: {
                    "1": "chooseHospital",
                    "00": "account",
                },
            });
            // RUN THE MENU
            let menu_res = yield menu.run(args);
            // RETURN THE MENU RESPONSE
            resolve(menu_res);
            return;
        }
        catch (e) {
            console.log(e);
            // SOMETHING WENT REALLY WRONG
            reject("END " + lang_1.default[configs_1.default.default_lang].generic.fatal_error);
            return;
        }
    }));
}
exports.default = default_1;
