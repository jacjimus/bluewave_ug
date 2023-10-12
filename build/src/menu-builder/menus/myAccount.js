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
exports.myAccount = void 0;
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const aar_1 = require("../../services/aar");
const uuid_1 = require("uuid");
function myAccount(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    const Beneficiary = db.beneficiaries;
    const findUserByPhoneNumber = (phoneNumber) => __awaiter(this, void 0, void 0, function* () {
        return yield User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    });
    menu.state("myAccount", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            console.log("* MY ACCOUNT ", args.phoneNumber);
            menu.con("My Account " +
                "\n1. Policy Status" +
                "\n2. Pay Now" +
                "\n3. Renew Policy" +
                "\n4. Update My Profile(KYC)" +
                "\n5. Cancel policy" +
                "\n6. Add Dependant" +
                // "\n7. Update Beneficiary" +
                "\n7. My Hospital" +
                "\n0.Back" +
                "\n00.Main Menu");
        }),
        next: {
            "1": "myInsurancePolicy",
            "2": "payNow",
            "3": "renewPolicy",
            "4": "updateProfile",
            "5": "cancelPolicy",
            "6": "addDependant",
            // "7": "listBeneficiaries",
            "7": "myHospitalOption",
            "0": "account",
            "00": "account",
        },
    });
    //update profile ( user dob and gender)
    menu.state("updateProfile", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(`Whats our gender
            1. Male
            2. Female
            0. Back
            00. Main Menu
             `);
        }),
        next: {
            "1": "updateGender",
            "2": "updateGender",
            "0": "myAccount",
            "00": "account",
        },
    });
    menu.state("updateGender", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const gender = menu.val == 1 ? "M" : "F";
            const user = yield User.update({
                gender: gender,
            }, {
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            console.log("USER: ", user);
            menu.con(`Enter your date of birth in the format DDMMYYYY e.g 01011990
            0. Back
            00. Main Menu
             `);
        }),
        next: {
            "*[0-9]": "updateDob",
            "0": "myAccount",
            "00": "account",
        },
    });
    menu.state("updateDob", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let dob = menu.val;
            console.log("dob", dob);
            //remove all non numeric characters
            dob = dob.replace(/\D/g, "");
            console.log("dob", dob);
            // convert ddmmyyyy to valid date
            let day = parseInt(dob.substring(0, 2));
            let month = parseInt(dob.substring(2, 4));
            let year = parseInt(dob.substring(4, 8));
            let date = new Date(year, month - 1, day);
            console.log(" dob date", date);
            const user = yield User.update({
                dob: date,
            }, {
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            console.log("USER DOB UPDATE: ", user);
            menu.con(`Enter your marital status
            1. Single
            2. Married
            3. Divorced
            4. Widowed
            0. Back
            00. Main Menu
              `);
        }),
        next: {
            "*[0-9]": "updateMaritalStatus",
            "0": "myAccount",
            "00": "account",
        },
    });
    menu.state("updateMaritalStatus", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const { gender } = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            let title = "";
            let ben_marital_status = menu.val;
            if (ben_marital_status == 1) {
                ben_marital_status = "single";
                gender == "M" ? title = "Mr" : title = "Ms";
            }
            else if (ben_marital_status == 2) {
                ben_marital_status = "married";
                gender == "M" ? title = "Mr" : title = "Mrs";
            }
            else if (ben_marital_status == 3) {
                ben_marital_status = "divorced";
                gender == "M" ? title = "Mr" : title = "Ms";
            }
            else if (ben_marital_status == 4) {
                ben_marital_status = "widowed";
                gender == "M" ? title = "Mr" : title = "Mrs";
            }
            console.log("ben_marital_status", ben_marital_status);
            const user = yield User.update({
                marital_status: ben_marital_status,
                title: title
            }, {
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            // send sms
            const message = `Dear ${title} ${user.first_name}, your profile has been updated successfully`;
            yield (0, sendSMS_1.default)(args.phoneNumber, message);
            menu.con(`Your profile has been updated successfully
            0. Back
            00. Main Menu
             `);
        }),
        next: {
            "0": "myAccount",
            "00": "account",
        },
    });
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
            const gender = menu.val == 1 ? "M" : "F";
            console.log("GENDER", gender);
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            let beneficiary = yield Beneficiary.findOne({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    relationship: "SPOUSE",
                },
            });
            if (!beneficiary) {
                return menu.end("You have not added a spouse, please buy family cover first");
            }
            console.log("BENEFICIARY: ", beneficiary);
            beneficiary.gender = gender;
            yield beneficiary.save();
            console.log("USER: ", user);
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
            // convert ddmmyyyy to valid date
            // convert ddmmyyyy to valid date
            let day = spouse_dob.substring(0, 2);
            let month = spouse_dob.substring(2, 4);
            let year = spouse_dob.substring(4, 8);
            let date = new Date(year, month - 1, day);
            console.log("DATE OF BIRTH", date);
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            let beneficiary = yield Beneficiary.findOne({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    relationship: "SPOUSE",
                },
            });
            beneficiary.dob = date;
            beneficiary.age = new Date().getFullYear() - date.getFullYear();
            yield beneficiary.save();
            console.log("BENEFICIARY: ", beneficiary);
            const policy = yield Policy.findOne({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    beneficiary: 'FAMILY',
                },
            });
            console.log("POLICY: ", policy);
            let arr_member = yield (0, aar_1.fetchMemberStatusData)({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
            console.log("arr_member", arr_member);
            if (arr_member.code == 200) {
                yield (0, aar_1.registerDependant)({
                    member_no: user.arr_member_number,
                    surname: beneficiary.last_name,
                    first_name: beneficiary.first_name,
                    other_names: beneficiary.middle_name || beneficiary.last_name,
                    gender: beneficiary.gender == "M" ? "1" : "2",
                    dob: date.toISOString().split('T')[0],
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
                    unique_profile_id: user.membership_id + "-01",
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
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            let beneficiary = yield Beneficiary.findAll({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    relationship: "CHILD",
                },
            });
            console.log("BENEFICIARY CHILD GENDER: ", beneficiary);
            let newChildDep = yield Beneficiary.create({
                beneficiary_id: (0, uuid_1.v4)(),
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
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
            const gender = menu.val == 1 ? "M" : "F";
            console.log("GENDER", gender);
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            let beneficiary = yield Beneficiary.findAll({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
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
            console.log("USER: ", user);
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
            let date = new Date(year, month - 1, day);
            console.log("DATE OF BIRTH", date);
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            let beneficiary = yield Beneficiary.findAll({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
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
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    beneficiary: 'FAMILY',
                },
            });
            console.log("POLICY: ", policy);
            let arr_member = yield (0, aar_1.fetchMemberStatusData)({ member_no: user.arr_member_number, unique_profile_id: user.membership_id + "" });
            console.log("arr_member", arr_member);
            let arr_dep_reg;
            if (arr_member.code == 200) {
                arr_dep_reg = yield (0, aar_1.registerDependant)({
                    member_no: user.arr_member_number,
                    surname: beneficiary.last_name,
                    first_name: beneficiary.first_name,
                    other_names: beneficiary.middle_name || beneficiary.last_name,
                    gender: beneficiary.gender == "M" ? "1" : "2",
                    dob: date.toISOString().split('T')[0],
                    email: "dependant@bluewave.insure",
                    pri_dep: "25",
                    family_title: "25",
                    tel_no: user.phone_number,
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
                    unique_profile_id: user.membership_id + "-02",
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
            const user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            if (user) {
                const policy = yield Policy.findOne({
                    where: {
                        user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    },
                });
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
            const user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            const policy = yield Policy.findOne({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
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
            //update policy status to cancelled
            const user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            let policy;
            if (user) {
                policy = yield Policy.findOne({
                    where: {
                        user_id: user === null || user === void 0 ? void 0 : user.user_id,
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
            const sms = yield (0, sendSMS_1.default)(to, message);
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
            // const bronzeLastExpenseBenefit = "UGX 1,000,000";
            // const silverLastExpenseBenefit = "UGX 1,500,000";
            // const goldLastExpenseBenefit = "UGX 2,000,000";
            const user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            console.log("USER: ", user);
            if (!user) {
                menu.con("User not found");
                return;
            }
            let policies = yield Policy.findAll({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                },
            });
            console.log("====USER ===  ", user === null || user === void 0 ? void 0 : user.user_id);
            let otherPolicies = yield Policy.findAll({
                where: {
                    bought_for: user === null || user === void 0 ? void 0 : user.user_id,
                },
            });
            console.log("OTHER POLICIES: ", otherPolicies);
            policies = policies.concat(otherPolicies);
            console.log("POLICIES: ", policies);
            function formatNumberToM(value) {
                return (value / 1000000).toFixed(1) + 'M';
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
                    const dd = String(date.getDate()).padStart(2, '0');
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
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
            // get policy
            const user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber,
                },
            });
            console.log("USER: ", user);
            const policy = yield Policy.findOne({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
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
}
exports.myAccount = myAccount;
