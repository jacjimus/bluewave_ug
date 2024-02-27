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
const faqsMenu = (args) => __awaiter(void 0, void 0, void 0, function* () {
    let { response, currentStep, userText } = args;
    const faqs = [
        {
            question: "Eligibility",
            answer: " Persons between the ages of 18 and 65 are eligible to purchase Medical cover Policy."
        },
        {
            question: "Bamba cover",
            answer: " You get KShs 4,500 / night of hospitalisation up to a Maximum of 30 days after one day of being hospitalized. "
        },
        {
            question: "AfyaShua Zidi Cover",
            answer: "You get Inpatient for KShs 300,000 and Maternity for KShs 100,000 Can cover up to 6 dependents."
        },
        {
            question: "AfyaShua Smarta cover",
            answer: "You get Inpatient for KShs 400,000, Outpatient for 30,000 and Maternity for Kshs 100,0000. Can cover up to 6 dependents."
        },
        {
            question: "Waiting period",
            answer: "1. No waiting period on Accident cases 2.  (30)-day waiting period on illness treatment 3. 10-months waiting period on maternity and pre-existing conditions"
        },
        {
            question: "Waiting period meaning",
            answer: "This refers to a specified period during which you are not eligible for coverage of certain benefits or services."
        },
        {
            question: "When to make claim",
            answer: "Admission and treatment claims will be paid directly to the hospital "
        },
        {
            question: "Treatment Claim",
            answer: "Admission and treatment claims will be paid directly to the hospital"
        },
        {
            question: "Hospital Cash Claim",
            answer: "Hospital cash benefits will be paid to the insured upon discharge from the hospitall"
        },
        {
            question: "Renewal",
            answer: "Premiums are either paid monthly or on annual basis. Premium due notices will be send to you via SMS on your Airtel Line.."
        },
        {
            question: "Insured Name",
            answer: "The insured is the Person who is registerd on the Airtel Money SIM, their chosen dependents or the persons who the Subscriber has purchased cover for.."
        }
    ];
    if (userText === '0' || currentStep === 1) {
        response = "CON FAQs" +
            faqs.map((faq, index) => {
                return `\n${index + 1}. ${faq.question}  `;
            }).join("") +
            "\n0. Back" +
            "\n00. Main Menu";
    }
    else if (currentStep >= 2 && parseInt(userText) > 0) {
        let faq = faqs[parseInt(userText) - 1];
        if (!faq) {
            response = "END Invalid option";
            return response;
        }
        response = `CON ${faq.answer + ' Ts&Cs apply'}\n0.Back`;
    }
    return response;
});
exports.default = faqsMenu;
