export function displayMedicalCoverMenu(menu: any, args: any, db: any): void {
  menu.startState({
    run: async () => {
      // Check if the user exists
    

      menu.con('Insurance ' +
        '\n1. Medical cover' +
        '\n2. Auto Insurance' +
        '\n0. Back' +
        '\n00. Main Menu'
      );
    },
    next: {
      '1': 'account', 
    },
  });
}
