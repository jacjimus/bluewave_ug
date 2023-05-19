"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMenu = void 0;
function startMenu(menu) {
    menu.startState({
        run: () => {
            menu.con('Welcome. Choose option:' +
                '\n1. Send Money' +
                '\n2. Airtime/Bundles' +
                '\n3. Withdraw Cash' +
                '\n4. Pay Bill' +
                '\n5. Payments' +
                '\n6. School Fees' +
                '\n7. Financial Services' +
                '\n8. Wewole' +
                '\n9. AirtelMoney Pay' +
                '\n10. My account' +
                '\n11. BiZ Wallet');
        },
        next: {
            '7': 'insurance',
        }
    });
}
exports.startMenu = startMenu;
