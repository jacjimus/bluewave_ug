export function displayInsuranceMenu(menu: any): void {
    menu.state('insurance', {
      run: () => {
        menu.con('Financial Services' +
          '\n1. Banks' +
          '\n2. Group Collections' +
          '\n3. M-SACCO' +
          '\n4. ATM Withdraw' +
          '\n5. NSSF Savings' +
          '\n6. Insurance' +
          '\n7. Yassako Loans' +
          '\n8. SACCO' +
          '\n9. AirtelMoney MasterCard' +
          '\n10. Loans' +
          '\n11. Savings' +
          '\nn  Next'
        );
      },
      next: {
        '6': 'medical_cover',
      }
    });
  }
  