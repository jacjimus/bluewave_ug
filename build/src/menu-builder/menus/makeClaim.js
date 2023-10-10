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
exports.makeClaim = void 0;
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const utils_1 = require("../../services/utils");
const uuid_1 = require("uuid");
function makeClaim(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    const Claim = db.claims;
    const Beneficiary = db.beneficiaries;
    if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
    }
    const findUserByPhoneNumber = (phoneNumber) => __awaiter(this, void 0, void 0, function* () {
        return yield User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    });
    //==================MAKE CLAIM===================
    menu.state('makeClaim', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con('Make Claim ' +
                '\n1. Inpatient Claim' +
                '\n2. Death Claim' +
                '\n0. Back' +
                '\n00. Main Menu');
        }),
        next: {
            '1': 'inpatientClaim',
            '2': 'deathClaim',
            '0': 'account',
            '00': 'insurance'
        }
    });
    //==================INPATIENT CLAIM===================
    menu.state('inpatientClaim', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let claim_type = menu.val;
            let user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            });
            console.log("USER", user);
            const { policy_id, policy_type, beneficiary, sum_insured, last_expense_insured } = yield Policy.findOne({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    policy_status: 'paid'
                }
            });
            const claimId = (0, utils_1.generateClaimId)();
            console.log(claimId);
            let claim_amount;
            if (claim_type == 1) {
                claim_type = 'Inpatient Claim';
                claim_amount = sum_insured;
            }
            else {
                claim_type = 'Death Claim';
                claim_amount = last_expense_insured;
            }
            let userClaim = yield Claim.findOne({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    claim_type: claim_type,
                    claim_status: 'paid'
                }
            });
            if (userClaim) {
                menu.end(`Discharge Claim already made for this policy`);
                return;
            }
            const newClaim = yield Claim.create({
                claim_number: claimId,
                policy_id: policy_id,
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                claim_date: new Date(),
                claim_status: 'pending',
                partner_id: user.partner_id,
                claim_description: `${claim_type} ID: ${claimId} for Member ID: ${user.membership_id}  ${policy_type.toUpperCase()} ${beneficiary.toUpperCase()} policy`,
                claim_type: claim_type,
                claim_amount: claim_amount
            });
            console.log("CLAIM", newClaim);
            menu.end(`Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service`);
        }),
        next: {
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('deathClaim', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(`Enter phone of next of Kin `);
        }),
        next: {
            '*\\d+': 'deathClaimPhoneNumber',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('deathClaimPhoneNumber', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const nextOfKinPhoneNumber = menu.val;
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            const nextOfKin = yield Beneficiary.findOne({
                where: {
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                    beneficiary_type: 'NEXTOFKIN'
                }
            });
            const newKin = yield Beneficiary.create({
                beneficiary_id: (0, uuid_1.v4)(),
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                phone_number: nextOfKinPhoneNumber,
                beneficiary_type: 'NEXTOFKIN'
            });
            console.log("NEXT OF KIN PHONE NUMBER", nextOfKinPhoneNumber);
            console.log("NEW KIN", newKin);
            menu.con(`Enter Name of deceased
                      0.Back 00.Main Menu  `);
        }),
        next: {
            "*\\w+": 'deathClaimName',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('deathClaimName', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const deceasedName = menu.val;
            console.log("DECEASED NAME", deceasedName);
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            const firstName = deceasedName.split(" ")[0];
            const middleName = deceasedName.split(" ")[1];
            const lastName = deceasedName.split(" ")[2] || deceasedName.split(" ")[1];
            yield Beneficiary.update({ full_name: deceasedName, first_name: firstName, middle_name: middleName, last_name: lastName }, { where: { user_id: user === null || user === void 0 ? void 0 : user.user_id, beneficiary_type: 'NEXTOFKIN' } });
            menu.con(`Enter your Relationship to the deceased
                     0.Back 00.Main Menu `);
        }),
        next: {
            "*\\w+": 'deathClaimRelationship',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('deathClaimRelationship', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const relationship = menu.val;
            console.log("RELATIONSHIP", relationship);
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            yield Beneficiary.update({ relationship: relationship }, { where: { user_id: user === null || user === void 0 ? void 0 : user.user_id, beneficiary_type: 'NEXTOFKIN' } });
            menu.con(`Enter Date of death in the format DDMMYYYY e.g 01011990"


            0.Back 00.Main Menu
             `);
        }),
        next: {
            "*\\w+": 'deathClaimDate',
            '0': 'account',
            '00': 'insurance'
        }
    });
    menu.state('deathClaimDate', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let dateOfDeath = menu.val;
            console.log("DATE OF DEATH", dateOfDeath);
            // convert ddmmyyyy to valid date
            let day = dateOfDeath.substring(0, 2);
            let month = dateOfDeath.substring(2, 4);
            let year = dateOfDeath.substring(4, 8);
            let date = new Date(year, month - 1, day);
            console.log("date", date);
            let thisYear = new Date().getFullYear();
            dateOfDeath = date.toISOString().split('T')[0];
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            yield Beneficiary.update({ date_of_death: dateOfDeath, age: thisYear - date.getFullYear() }, { where: { user_id: user === null || user === void 0 ? void 0 : user.user_id, beneficiary_type: 'NEXTOFKIN' } });
            menu.con(`Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107
                     0.Back 00.Main Menu
            `);
            const sms = `Your claim have been submitted. Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107 `;
            yield (0, sendSMS_1.default)(args.phoneNumber, sms);
        }),
        next: {
            '0': 'account',
            '00': 'insurance'
        }
    });
}
exports.makeClaim = makeClaim;
