export function displayAccount(menu: any, args: any, db: any): void {

  menu.state('account', {
    run: async () => {
      const user = await db.users.findOne({
        where: {
          phone_number: args.phoneNumber,
          gender: {
            [db.Sequelize.Op.ne]: null,
          },
        },
      });

      console.log(" ============== USER - ACCOUNT ================ ", user);
      if (user) {
        menu.con('Medical cover ' +
          '\n1. Buy for self' +
          '\n2. Buy (family)' +
          '\n3. Buy (others)' +
          '\n4. Make Claim' +
          '\n5. My Policy' +
          '\n6. View Hospital' +
          '\n7. Terms & Conditions' +
          '\n8. FAQs'
          // '\n00.Main Menu'
        )

      } else {
        menu.con('Medical cover ' +
          '\n0. Update profile(KYC)')

      }
    },
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
      // '00': 'account',
    }
  });

 








}