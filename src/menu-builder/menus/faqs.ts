export function displayFaqsMenu(menu: any): void {
  menu.state('faqs', {
    run: async () => {
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
        '\n00.Main Menu'
      )
    },
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
    run: async () => {
      menu.end('Persons between the age of 18 and 65 are eligible to purchase Medical cover Policy' +
        '\nTs&Cs apply'
      )
    },
  });

  
  menu.state('bronzeCover', {
    run: async () => {
      menu.end('Get Free Cover for Bronze Hospitalization cover for 30 nights / year ' +
        '\nPays UGX 4,500 per night from 2nd night. Payout for ICU is UGX 9,000 for max 10 nights' +
        '\nTs&Cs apply'
      )
    },
  });

  menu.state('silverCover', {
    run: async () => {
      menu.end('Outpatient limit of UGX 3,000,000' +
        '\nCan cover up to 6 dependents' +
        '\nTs&Cs apply'
      )
    },
  });


  menu.state('goldCover', {
    run: async () => {
      menu.end('Outpatient limit of Kes 5,000,000' +
        '\nCan cover up to 6 dependents' +
        '\nTs&Cs apply'
      )
    },
  });

  menu.state('autoRenew', {
    run: async () => {
      menu.end('To stay covered, the premium amount will be deducted automatically from your Airtel Money account on the selected day per month' +
        '\nTs&Cs apply'
      )
    },
  });

  menu.state('waitingPeriod', {
    run: async () => {
      menu.end('This means the days before benefits become fully active. For the first 30 DAYS, only hospitalizations due to ACCIDENT will be covered. ' +
        '\n10 month waiting period for pre-existing conditions.' +
        '\nTs&Cs apply'
      )
    },
  });

  menu.state('whenToMakeClaim', {
    run: async () => {
      menu.end('Make Hospital claim when you spend MORE THAN 1 NIGHT in the hospital. ' +
        '\nA' +
        '\nTs&Cs apply'
      )
    },
  });

  menu.state('claimPayment', {
    run: async () => {
      menu.end('Claims will be paid to customer’s Airtel  wallet (Bronze) or to the hospital for Silver and Gold' +
        '\nTs&Cs apply'
      )
    },
  });

  menu.state('changeName', {
    run: async () => {
      menu.end('Policy will cover person whose name SIM is registered in. To change, visit Airtel Service Center with your National ID to Register this SIM Card in your name' +
        '\nTs&Cs apply'
      )
    },
  });
}
