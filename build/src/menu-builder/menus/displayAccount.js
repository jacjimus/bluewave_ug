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
exports.displayAccount = void 0;
function displayAccount(menu, args, db) {
    const User = db.users;
    const Policy = db.policies;
    const Claim = db.claims;
    menu.state('account', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const user = yield db.users.findOne({
                where: {
                    phone_number: args.phoneNumber,
                    gender: {
                        [db.Sequelize.Op.ne]: null,
                    },
                },
            });
            console.log(" ============== USER ================ ", user);
            if (user) {
                menu.con('Medical cover ' +
                    '\n1. Buy for self' +
                    '\n2. Buy (family)' +
                    '\n3. Buy (others)' +
                    '\n4. Make Claim' +
                    '\n5. My Policy' +
                    '\n6. View Hopital' +
                    '\n7. Terms & Conditions' +
                    '\n8. FAQs' +
                    '\n00.Main Menu');
            }
            else {
                menu.con('Medical cover ' +
                    '\n0. Update profile(KYC)');
            }
        }),
        next: {
            '1': 'buyForSelf',
            '2': 'buyForFamily',
            '3': 'buyForOthers',
            '4': 'makeClaim',
            '5': 'myAccount',
            '6': 'chooseHospital',
            '7': 'termsAndConditions',
            '8': 'faqs',
            '0': 'updateProfile',
            '00': 'insurance',
        }
    });
}
exports.displayAccount = displayAccount;
