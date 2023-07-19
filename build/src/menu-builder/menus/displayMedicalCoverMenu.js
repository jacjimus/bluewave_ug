"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayMedicalCoverMenu = void 0;
function displayMedicalCoverMenu(menu) {
    menu.state('medical_cover', {
        run: () => {
            menu.con('Insurance ' +
                '\n1. Medical cover' +
                '\n2. Auto Insurance' +
                '\n0. Back' +
                '\n00. Main Menu');
        },
        next: {
            '1': 'account',
        }
    });
}
exports.displayMedicalCoverMenu = displayMedicalCoverMenu;
