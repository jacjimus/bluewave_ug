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
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const hospitalMenu = (args, db) => __awaiter(void 0, void 0, void 0, function* () {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;
    const trimmedPhoneNumber = phoneNumber.replace("+", "").substring(3);
    const smsPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
    if (currentStep == 1) {
        response = "CON Select Region" +
            "\n1. Central" +
            "\n2. Western" +
            "\n3. Nothern" +
            "\n4. Eastern" +
            "\n5. West Nile" +
            "\n6. Karamoja" + "\n0. Back \n00. Main Menu";
    }
    else if (currentStep == 2) {
        response = "CON Type your district e.g Kampala";
    }
    else if (currentStep == 3) {
        const userTextLower = userText.toLowerCase(); // Convert user input to lowercase
        const hospitals = yield db.hospitals.findAll({
            where: {
                district: {
                    [sequelize_1.Op.eq]: userTextLower, // Use equality check
                }
            },
            order: [
                ['district', 'ASC'],
            ],
            limit: 10,
        });
        // if no hospitals are found, return an error message
        if (hospitals.length == 0) {
            response = "CON No district found" + "\n0. Back \n00. Main Menu";
        }
        else {
            // if hospitals are found, return a list of unique districts
            const districts = hospitals.map((hospital) => hospital.district);
            const uniqueDistricts = [...new Set(districts)];
            const districtMessages = uniqueDistricts === null || uniqueDistricts === void 0 ? void 0 : uniqueDistricts.slice(0, 6).map((district, index) => {
                return `${index + 1}. ${district}`;
            });
            response = `CON Confirm your district` +
                `\n${districtMessages.join("\n")}`;
        }
    }
    else if (currentStep == 4) {
        const hospitals = yield db.hospitals.findAll({
            where: {
                district: {
                    [sequelize_1.Op.iLike]: `%${allSteps[2]}%`
                }
            },
            order: [
                ['district', 'ASC'],
            ],
        });
        const districtSelected = hospitals[parseInt(allSteps[3]) - 1];
        response = `CON Type your Hospital to search e.g ${districtSelected.hospital_name}`;
    }
    else if (currentStep == 5) {
        const districts = yield db.hospitals.findAll({
            where: {
                district: {
                    [sequelize_1.Op.iLike]: `%${allSteps[2]}%`
                }
            },
            order: [
                ['district', 'ASC'],
            ],
        });
        const districtSelected = districts[parseInt(allSteps[3]) - 1];
        const hospitals = yield db.hospitals.findAll({
            where: {
                district: districtSelected.district,
                hospital_name: {
                    [sequelize_1.Op.iLike]: `%${userText}%`
                }
            },
            order: [
                ['hospital_name', 'ASC'],
            ],
        });
        const hospitalMessages = hospitals === null || hospitals === void 0 ? void 0 : hospitals.slice(0, 6).map((hospital, index) => {
            return `${index + 1}. ${hospital.hospital_name}`;
        });
        response = `CON Confirm your hospital` +
            `\n${hospitalMessages.join("\n")}`;
    }
    else if (currentStep == 6) {
        const districts = yield db.hospitals.findAll({
            where: {
                district: {
                    [sequelize_1.Op.iLike]: `%${allSteps[2]}%`
                }
            },
            order: [
                ['district', 'ASC'],
            ],
        });
        const districtSelected = districts[parseInt(allSteps[3]) - 1];
        const hospitals = yield db.hospitals.findAll({
            where: {
                district: districtSelected.district,
                hospital_name: {
                    [sequelize_1.Op.iLike]: `%${allSteps[4]}%`
                }
            },
            order: [
                ['hospital_name', 'ASC'],
            ],
        });
        console.log("ALL STEPS", allSteps);
        const hospitalSelected = hospitals[parseInt(allSteps[5]) - 1];
        console.log("HOSPITAL SELECTED", hospitalSelected);
        const hospital = yield db.hospitals.findOne({
            where: {
                hospital_id: hospitalSelected.hospital_id
            }
        });
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
        response = `CON You have selected ${hospital.hospital_name} as your preferred facility.Below are the Hospital details` +
            `\nHospital Name: ${hospital.hospital_name}` +
            `\nContact Number: ${hospital.hospital_contact}` +
            `\nLocation: ${hospital.hospital_address}` + "\n0. Back \n00. Main Menu";
    }
    return response;
});
exports.default = hospitalMenu;
