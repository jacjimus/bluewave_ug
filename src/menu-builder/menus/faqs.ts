export function displayFaqsMenu(menu: any): void {
  menu.state("faqs", {
    run: async () => {
      console.log(" ======= FAQ =============");
      menu.con(
        "FAQs " +
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
        "\n00.Main Menu"
      );
    },
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
      "00": "account",
      "99": "insuredName",
    },
  });

  menu.state("eligibility", {
    run: async () => {
      menu.con(
        "Persons between the age of 18 and 65 are eligible to purchase Medical cover Policy" +
        "\nTs&Cs apply" +

        "\n0.Back"
      );
    },
    next: {
      "0": "faqs",
      "00": "account"
    },
  });

  menu.state("miniCover", {
    run: async () => {
      menu.con(` 
      Inpatient Cover with 1.5M Inpatient and 1M Funeral Limits per covered person.
      Ts&Cs apply

      0.Back`);
    },
    next: {
      "0": "faqs",
      "00": "account"
    },
  });

  menu.state("midiCover", {
    run: async () => {
      menu.con(`
       Inpatient limit of UGX 3M and Funeral Limit of UGX 1.5M per covered person
       Can cover up to 6 dependents
       Ts&Cs apply

      0.Back`);
    },
    next: {
      "0": "faqs",
      "00": "account"
    },
  });

  menu.state("biggieCover", {
    run: async () => {
      menu.con(`
      Inpatient limit of UGX 5,000,000 and Funeral benefit of UGX 2,000,000 per covered person.
      Can cover up to 6 dependents
      Ts&Cs apply

      0.Back
      `);
    },
    next: {
      "0": "faqs",
      "00": "account"
    },
  });

  menu.state("renewal", {
    run: async () => {
      menu.con(
        `Premiums are either paid monthly or on annual basis. Premium due notices will be send to you via SMS on your Airtel Line.

        0.Back`
      );
    },
    next: {
      "0": "faqs",
      "00": "account"
    },
  });

  menu.state("waitingPeriodMeaning", {
    run: async () => {
      menu.con(
        `This refers to a specified period during which you are not eligible for coverage of certain benefits or services.
         Ts&Cs apply

         0.Back`
      );
    },
    next: {
      "0": "faqs",
      "00": "account"
    },
  });

  menu.state("waitingPeriod", {
    run: async () => {
      menu.con(
        ` 1. No waiting period on Accident cases
        2. (30)-day waiting period on illness hospitalization
        3. 6-months waiting period on chronic illness hospitalizations
        
        0.Back`
      );
    },
    next: {
      "0": "faqs",
      "00": "account"
    },
  });


  menu.state("whenToMakeClaim", {
    run: async () => {
      menu.con(
        `Claims will be paid directly to the hospital
       Ts&Cs apply

       0.Back`
      );
    },
    next: {
      "0": "faqs",
      "00": "account"
    },
  });

  menu.state("claimPayment", {
    run: async () => {
      menu.con(
        `Death claims will be paid directly to the next of Kin.
        Inpatient Claims within the cover limit will be directly to the hopsital after discharge 

        0.Back`
      );
    },
    next: {
      "0": "faqs",
      "00": "account"
    },
  });

  menu.state("insuredName", {
    run: async () => {
      menu.con(
        `The insured is the Person who is registerd on the Airtel Money SIM, their chosen dependents or the persons who the Subscriber has purchased cover for.

        0.Back`
      );
    },
    next: {
      "0": "faqs",
      "00": "account"
    },
  });
}
