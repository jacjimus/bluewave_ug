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
    const user = yield db.users.findOne({
        where: {
            phone_number: trimmedPhoneNumber
        },
        limit: 1,
    });
    if (currentStep == 1) {
        response = "CON Type your hospital e.g Nairibi hospital";
    }
    else if (currentStep == 2) {
        const userText = allSteps[1];
        const userTextLower = userText.toLowerCase();
        const hospitals = yield db.hospitals_kenya.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    {
                        region: {
                            [sequelize_1.Op.iLike]: `%${userTextLower}%`
                        }
                    },
                    {
                        provider_name: {
                            [sequelize_1.Op.iLike]: `%${userTextLower}%`
                        }
                    },
                    // Add more conditions as needed
                ]
            },
            order: [
                ['provider_name', 'ASC'],
            ],
            limit: 6,
        });
        // if no hospitals are found, return an error message
        if (hospitals.length == 0) {
            response = "CON No hospital found" + "\n0. Back \n00. Main Menu";
        }
        else {
            const hospitalList = hospitals === null || hospitals === void 0 ? void 0 : hospitals.slice(0, 6).map((hospital, index) => {
                return `${index + 1}. ${hospital.provider_name}`;
            });
            response = `CON select hospital` +
                `\n${hospitalList.join("\n")}`;
        }
    }
    else if (currentStep == 3) {
        const hospitalSelectedIndex = parseInt(allSteps[2]) - 1;
        const userTextLower = allSteps[1].toLowerCase();
        const hospitals = yield db.hospitals_kenya.findAll({
            where: {
                region: {
                    [sequelize_1.Op.iLike]: `%${userTextLower}%`
                },
                provider_name: {
                    [sequelize_1.Op.iLike]: `%${userTextLower}%`
                }
            },
            order: [
                ['provider_name', 'ASC'],
            ],
            limit: 6,
        });
        const hospitalChoosen = hospitals[hospitalSelectedIndex];
        const userHospitalCount = yield db.user_hospitals.findAndCountAll({
            where: {
                user_id: user.user_id
            },
            limit: 3
        });
        if (userHospitalCount < 1) {
            yield db.user_hospitals.create({
                user_hospital_id: (0, uuid_1.v4)(),
                user_id: user.user_id,
                hospital_id: hospitalChoosen.hospital_id
            });
        }
        else {
            yield db.user_hospitals.update({ hospital_id: hospitalChoosen.hospital_id }, {
                where: { user_id: user.user_id }
            });
        }
        let message = `Congratulations, you have selected  ${hospitalChoosen.provider_name} as your preferred Hospital. Below are the Hospital details:
                        Contact Number:  ${hospitalChoosen.hospital_contact}
                        Location: ${hospitalChoosen.hospital_address}`;
        yield sendSMS_1.default.sendSMS(3, smsPhone, message);
        response = `CON You have selected ${hospitalChoosen.provider_name} as your preferred facility.` +
            `\nContact: ${hospitalChoosen.hospital_contact}` +
            `\nLocation: ${hospitalChoosen.hospital_address}` + "\n0. Back \n00. Main Menu";
    }
    return response;
});
exports.default = hospitalMenu;
