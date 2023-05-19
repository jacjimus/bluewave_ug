export function displayMedicalCoverMenu(menu: any): void {
    menu.state('medical_cover', {
      run: () => {
        menu.con('Insurance ' +
          '\n1. Medical cover' +
          '\n2. Auto Insurance' +
          '\n0. Back' +
          '\n00. Main Menu'
        );
      },
      next: {
        '1': 'account',
      }
    });
  }
  