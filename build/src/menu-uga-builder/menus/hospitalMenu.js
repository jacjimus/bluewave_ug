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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const hospitalMenu = (args, db) => __awaiter(void 0, void 0, void 0, function* () {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;
    const trimmedPhoneNumber = phoneNumber.replace("+", "").substring(3);
    const smsPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
    if (currentStep == 1) {
        response = "CON " +
            "\n1. Search by hospital name" +
            "\n2. Get full hospitals list" +
            "\n0. Back \n00. Main Menu";
    }
    else if (currentStep == 2) {
        console.log("USER TEXT", userText);
        console.log("ALL STEPS", allSteps);
        if (userText == '1') {
            response = "CON Type hospital name to search" + "\n0. Back \n00. Main Menu";
        }
        else if (userText == '2') {
            const hospital_list_message = 'To view Full hospitals list, visit Ddwaliro Care Ts & Cs https://rb.gy/oeuua5';
            yield sendSMS_1.default.sendSMS(2, smsPhone, hospital_list_message);
            response = 'END Full hospitals list has been sent to your phone number via SMS';
        }
        else {
            response = "CON Invalid option selected. Please try again";
        }
    }
    else if (currentStep == 3) {
        const userTextLower = userText.toLowerCase();
        console.log("USER TEXT", userTextLower);
        const hospitals = yield db.hospitals.findAll({
            where: {
                hospital_name: {
                    [sequelize_1.Op.iLike]: `%${userTextLower}%`
                },
            },
            order: [
                ['hospital_name', 'ASC'],
            ],
            limit: 10,
        });
        // if no hospitals are found, return an error message
        if (hospitals.length == 0) {
            response = "CON No hospital found" + "\n0. Back \n00. Main Menu";
        }
        else {
            //list the hospitals
            const hospitalMessages = hospitals === null || hospitals === void 0 ? void 0 : hospitals.slice(0, 6).map((hospital, index) => {
                return `${index + 1}. ${hospital.hospital_name}`;
            });
            response = `CON Select your preferred hospital` +
                `\n${hospitalMessages.join("\n")}` + "\n0. Back \n00. Main Menu";
        }
    }
    else if (currentStep == 4) {
        const userChoice = allSteps[2].toLowerCase();
        console.log("USER CHOICE", userChoice);
        const hospitals = yield db.hospitals.findAll({
            where: {
                hospital_name: {
                    [sequelize_1.Op.iLike]: `%${userChoice}%`
                },
            },
            order: [
                ['hospital_name', 'ASC'],
            ],
            limit: 10,
        });
        const hospitalSelected = hospitals[parseInt(allSteps[3]) - 1];
        const hospital = yield db.hospitals.findOne({
            where: {
                hospital_id: hospitalSelected.hospital_id
            }
        });
        console.log("HOSPITAL", hospital);
        const user = yield db.users.findOne({
            where: {
                phone_number: trimmedPhoneNumber
            },
            limit: 1,
        });
        yield db.user_hospitals.create({
            user_hospital_id: (0, uuid_1.v4)(),
            user_id: user.user_id,
            hospital_id: hospital.hospital_id
        });
        let message = `Congratulations, you have selected  ${hospital.hospital_name} as your preferred Hospital. Hospital details:` +
            ` \nContact: ${hospital.hospital_contact_person} - ${hospital.hospital_contact}` +
            `\nLocation: ${hospital.hospital_address} - ${hospital.region} `;
        console.log("MESSAGE", message);
        yield sendSMS_1.default.sendSMS(2, smsPhone, message);
        response = `CON You have selected ${hospital.hospital_name} as your preferred facility.` +
            `\nContact: ${hospital.hospital_contact_person} - ${hospital.hospital_contact}` +
            `\nLocation: ${hospital.hospital_address} - ${hospital.region}` + "\n0. Back \n00. Main Menu";
    }
    return response;
});
exports.default = hospitalMenu;
