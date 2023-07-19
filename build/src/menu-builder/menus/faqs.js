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
exports.displayFaqsMenu = void 0;
function displayFaqsMenu(menu) {
    menu.state('faqs', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con('FAQs ' +
                '\n1. Eligibility' +
                '\n2. Bronze cover' +
                '\n3. Silver Cover' +
                '\n4. Gold cover' +
                '\n5. Auto-renew' +
                '\n6. Waiting period' +
                '\n7. When to make claim' +
                '\n8. Claim Payment' +
                '\n9. Change Name' +
                '\n0.Back' +
                '\n00.Main Menu');
        }),
        next: {
            '1': 'eligibility',
            '2': 'bronzeCover',
            '3': 'silverCover',
            '4': 'goldCover',
            '5': 'autoRenew',
            '6': 'waitingPeriod',
            '7': 'whenToMakeClaim',
            '8': 'claimPayment',
            '9': 'changeName',
        }
    });
    menu.state('eligibility', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.end('Persons between the age of 18 and 65 are eligible to purchase Medical cover Policy' +
                '\nTs&Cs apply');
        }),
    });
    menu.state('bronzeCover', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.end('Get Free Cover for Bronze Hospitalization cover for 30 nights / year ' +
                '\nPays keys 4,500 per night from 2nd night. Payout for ICU is Kes9,000 for max 10 nights' +
                '\nTs&Cs apply');
        }),
    });
    menu.state('silverCover', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.end('Outpatient limit of Kes 300,000' +
                '\nMaternity covered up to Kes 100,000' +
                '\nCan cover up to 6 dependents' +
                '\nTs&Cs apply');
        }),
    });
    menu.state('goldCover', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.end('Outpatient limit of Kes 400,000' +
                '\nMaternity covered up to Kes 100,000' +
                '\nCan cover up to 6 dependents' +
                '\nTs&Cs apply');
        }),
    });
    menu.state('autoRenew', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.end('To stay covered, the premium amount will be deducted automatically from your Airtel Money account on the selected day per month' +
                '\nTs&Cs apply');
        }),
    });
    menu.state('waitingPeriod', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.end('This means the days before benefits become fully active. For the first 30 DAYS, only hospitalizations due to ACCIDENT will be covered. ' +
                '\n10 month waiting period for pre-existing conditions.' +
                '\nTs&Cs apply');
        }),
    });
    menu.state('whenToMakeClaim', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.end('Make Hospital claim when you spend MORE THAN 1 NIGHT in the hospital. ' +
                '\nA' +
                '\nTs&Cs apply');
        }),
    });
    menu.state('claimPayment', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.end('Claims will be paid to customer’s Airtel  wallet (Bronze) or to the hospital for Silver and Gold' +
                '\nTs&Cs apply');
        }),
    });
    menu.state('changeName', {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.end('Policy will cover person whose name SIM is registered in. To change, visit Airtel Service Center with your National ID to Register this SIM Card in your name' +
                '\nTs&Cs apply');
        }),
    });
}
exports.displayFaqsMenu = displayFaqsMenu;
