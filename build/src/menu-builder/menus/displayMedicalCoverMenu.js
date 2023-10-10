"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayMedicalCoverMenu = void 0;
function displayMedicalCoverMenu(menu, args, db) {
    menu.startState({
        run: () => __awaiter(this, void 0, void 0, function* () {
            // Check if the user exists
            menu.con('Insurance ' +
                '\n1. Ddwaliro Care'
            // '\n2. Auto Insurance' +
            );
        }),
        next: {
            '1': 'account',
        },
    });
}
exports.displayMedicalCoverMenu = displayMedicalCoverMenu;
