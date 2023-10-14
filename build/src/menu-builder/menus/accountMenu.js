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
const accountMenu = (args, db) => __awaiter(void 0, void 0, void 0, function* () {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;
    const policy = yield db.policies.findOne({
        where: {
            phone_number: phoneNumber
        }
    });
    if (currentStep == 1) {
        response = "My Account" +
            "\n1. Policy Status" +
            "\n2. Pay Now" +
            "\n3. Cancel Policy" +
            "\n4. Add Next of Kin";
    }
    else {
        response = "END on progress";
    }
    return response;
});
