export function displayMedicalCoverMenu(menu: any, args: any, db: any): void {
  menu.startState({
    run: async () => {
      // Check if the user exists
    

      menu.con('Insurance ' +
        '\n1. Ddwaliro Care' 
        // '\n2. Auto Insurance' +
      );
    },
    next: {
      '1': 'account', 
    },
  });
}
