const faqsMenu = async (args) => {

    let { response, currentStep, userText } = args;

    const faqs = [
        {
            question: "Eligibility",
            answer: "Persons between the age of 18 and 65 are eligible to purchase Medical cover Policy"
        },
        {
            question: "Mini cover",
            answer: "Inpatient Cover with 1.5M Inpatient and 1M Funeral Limits per covered person."
        },
        {
            question: "Midi Cover",
            answer: "Inpatient limit of UGX 3M and Funeral Limit of UGX 1.5M per covered person"
        },
        {
            question: "Biggie cover",
            answer: "Inpatient limit of UGX 5,000,000 and Funeral benefit of UGX 2,000,000 per covered person."
        },
        {
            question: "Waiting period",
            answer: "1. No waiting period on Accident cases\n2. (30)-day waiting period on illness hospitalization\n3. 6-months waiting period on chronic illness hospitalizations"
        },
        {
            question: "Waiting period meaning",
            answer: "This refers to a specified period during which you are not eligible for coverage of certain benefits or services."
        },
        {
            question: "When to make claim",
            answer: "Claims will be paid directly to the hospital"
        },
        {
            question: "Claim Payment",
            answer: "Death claims will be paid directly to the next of Kin.\nInpatient Claims within the cover limit will be directly to the hopsital after discharge"
        },
        {
            question: "Renewal",
            answer: "Premiums are either paid monthly or on annual basis. Premium due notices will be send to you via SMS on your Airtel Line."
        },
        {
            question: "Insured Name",
            answer: "The insured is the Person who is registerd on the Airtel Money SIM, their chosen dependents or the persons who the Subscriber has purchased cover for."
        }
    ]

    if (userText === '0' || currentStep === 1) {
        response = "CON FAQs" +
            faqs.map((faq, index) => {
                return `\n${index + 1}. ${faq.question}`
            }).join("")

    }

    else if (currentStep >= 2 && parseInt(userText) > 0) {
        let faq = faqs[parseInt(userText) - 1];
        if (!faq) {
            response = "END Invalid option";
            return response;
        }
        response = `CON ${faq.answer}\n0.Back`
    }

    return response;
}

export default faqsMenu;
