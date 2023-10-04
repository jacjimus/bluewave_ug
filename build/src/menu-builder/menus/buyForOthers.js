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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyForOthers = void 0;
const uuid_1 = require("uuid");
function buyForOthers(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
    }
    console.log("ARGS PHONE NUMBER", args.phoneNumber);
    const findUserByPhoneNumber = (phoneNumber) => __awaiter(this, void 0, void 0, function* () {
        return yield User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    });
    const findPaidPolicyByUser = (user) => __awaiter(this, void 0, void 0, function* () {
        return yield Policy.findOne({
            where: {
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                policy_status: 'paid',
            },
        });
    });
    const findPolicyByUser = (user_id) => __awaiter(this, void 0, void 0, function* () {
        return yield Policy.findOne({
            where: {
                user_id: user_id,
            },
        });
    });
    //buyForOthers
    menu.state('buyForOthers', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            const policy = yield findPaidPolicyByUser(user);
            // if (policy) {
            //     menu.end(`You already have an ${policy.policy_type.toUpperCase()} ACTIVE policy`);
            //     return;
            // }
            menu.con('Buy for others ' +
                '\n1. M' +
                '\n2. M+1' +
                '\n3. M+2' +
                '\n4. M+3' +
                '\n5. M+4' +
                '\n6. M+5' +
                '\n7. M+6' +
                '\n0.Back' +
                '\n00.Main Menu');
        }),
        next: {
            '*\\d+': 'buyForOthers.member',
        }
    });
    menu.state('buyForOthers.member', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const member_number = menu.val;
            console.log("MEMBER NUMBER", member_number);
            yield User.update({ total_member_number: member_number }, { where: { phone_number: args.phoneNumber } });
            menu.con(`
                    1. Mini – UGX 20,000
                    2. Midi – UGX 28,000
                    3. Biggie – UGX 35,000
                    0. Back
                    00. Main Menu`);
        }),
        next: {
            '*\\d+': 'buyForOthers.coverType',
            '0': 'account',
            '00': 'insurance'
        }
    });
    //ask for phone number and name of person to buy for
    menu.state('buyForOthers.coverType', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let coverType = menu.val;
            console.log("COVER TYPE", coverType);
            let { user_id, partner_id } = yield findUserByPhoneNumber(args.phoneNumber);
            let date = new Date();
            let day = date.getDate();
            if (coverType == 1) {
                coverType = 'MINI';
            }
            else if (coverType == 2) {
                coverType = 'MIDI';
            }
            else if (coverType == 3) {
                coverType = 'BIGGIE';
            }
            yield Policy.create({
                user_id: user_id,
                policy_id: (0, uuid_1.v4)(),
                policy_type: coverType,
                beneficiary: 'OTHERS',
                policy_status: 'pending',
                policy_start_date: new Date(),
                policy_end_date: new Date(date.getFullYear() + 1, date.getMonth(), day),
                policy_deduction_day: day * 1,
                partner_id: partner_id,
                country_code: "UGA",
                currency_code: "UGX",
                product_id: 'd18424d6-5316-4e12-9826-302b866a380c',
            });
            yield User.update({ cover_type: coverType }, { where: { phone_number: args.phoneNumber } });
            menu.con('Enter Name of Other');
        }),
        next: {
            '*[a-zA-Z]+': 'buyForOthersPhoneNumber',
        }
    });
    menu.state('buyForOthersPhoneNumber', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let name = menu.val;
            let user = yield findUserByPhoneNumber(args.phoneNumber);
            const newBeneficiary = yield db.beneficiaries.create({
                beneficiary_id: (0, uuid_1.v4)(),
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                full_name: name,
                first_name: name.split(" ")[0],
                middle_name: name.split(" ")[1],
                last_name: name.split(" ")[2] || name.split(" ")[1],
            });
            console.log("NEW BENEFICIARY", newBeneficiary);
            menu.con('Enter ID of Other');
        }),
        next: {
            '*\\d+': 'buyForFamily.selfSpouseId',
        }
    });
}
exports.buyForOthers = buyForOthers;
