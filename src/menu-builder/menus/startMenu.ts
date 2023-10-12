export function displayMedicalCoverMenu(menu: any, args: any, db: any): void {
  menu.startState({
    run: async () => {
      console.log(" ===========================")
      console.log(" ******** START MENU *******",  args.phoneNumber)
      console.log(" ===========================")
  
      menu.con('Insurance ' +
        '\n1. Ddwaliro Care' 
      );
    },
    next: {
      '1': 'account', 
    },
  });
}
