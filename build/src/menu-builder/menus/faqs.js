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
    menu.state("faqs", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con("FAQs " +
                "\n1. Eligibility" +
                "\n2. Mini cover" +
                "\n3. Midi Cover" +
                "\n4. Biggie cover" +
                "\n5. Waiting period" +
                '\n6. Waiting period meaning' +
                "\n7. When to make claim" +
                "\n8. Claim Payment" +
                '\n9. Renewal' +
                "\n99. Insured Name" +
                "\n0.Back" +
                "\n00.Main Menu");
        }),
        next: {
            "1": "eligibility",
            "2": "miniCover",
            "3": "midiCover",
            "4": "biggieCover",
            "5": "waitingPeriod",
            "6": "waitingPeriodMeaning",
            "7": "whenToMakeClaim",
            "8": "claimPayment",
            "9": "renewal",
            "0": "account",
            "00": "insurance",
            "99": "insuredName",
        },
    });
    menu.state("eligibility", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con("Persons between the age of 18 and 65 are eligible to purchase Medical cover Policy" +
                "\nTs&Cs apply" +
                "\n0.Back");
        }),
        next: {
            "0": "faqs",
            "00": "insurance"
        },
    });
    menu.state("miniCover", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(` 
      Inpatient Cover with 1.5M Inpatient and 1M Funeral Limits per covered person.
      Ts&Cs apply

      0.Back`);
        }),
        next: {
            "0": "faqs",
            "00": "insurance"
        },
    });
    menu.state("midiCover", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(`
       Inpatient limit of UGX 3M and Funeral Limit of UGX 1.5M per covered person
       Can cover up to 6 dependents
       Ts&Cs apply

      0.Back`);
        }),
        next: {
            "0": "faqs",
            "00": "insurance"
        },
    });
    menu.state("biggieCover", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(`
      Inpatient limit of UGX 5,000,000 and Funeral benefit of UGX 2,000,000 per covered person.
      Can cover up to 6 dependents
      Ts&Cs apply

      0.Back
      `);
        }),
        next: {
            "0": "faqs",
            "00": "insurance"
        },
    });
    menu.state("renewal", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(`Premiums are either paid monthly or on annual basis. Premium due notices will be send to you via SMS on your Airtel Line.

        0.Back`);
        }),
        next: {
            "0": "faqs",
            "00": "insurance"
        },
    });
    menu.state("waitingPeriodMeaning", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(`This refers to a specified period during which you are not eligible for coverage of certain benefits or services.
         Ts&Cs apply

         0.Back`);
        }),
        next: {
            "0": "faqs",
            "00": "insurance"
        },
    });
    menu.state("waitingPeriod", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(` 1. No waiting period on Accident cases
        2. (30)-day waiting period on illness hospitalization
        3. 6-months waiting period on chronic illness hospitalizations
        
        0.Back`);
        }),
        next: {
            "0": "faqs",
            "00": "insurance"
        },
    });
    menu.state("whenToMakeClaim", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(`Claims will be paid directly to the hospital
       Ts&Cs apply

       0.Back`);
        }),
        next: {
            "0": "faqs",
            "00": "insurance"
        },
    });
    menu.state("claimPayment", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(`Death claims will be paid directly to the next of Kin.
        Inpatient Claims within the cover limit will be directly to the hopsital after discharge 

        0.Back`);
        }),
        next: {
            "0": "faqs",
            "00": "insurance"
        },
    });
    menu.state("insuredName", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            menu.con(`The insured is the Person who is registerd on the Airtel Money SIM, their chosen dependents or the persons who the Subscriber has purchased cover for.

        0.Back`);
        }),
        next: {
            "0": "faqs",
            "00": "insurance"
        },
    });
}
exports.displayFaqsMenu = displayFaqsMenu;
