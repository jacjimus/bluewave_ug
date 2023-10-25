import { Op } from "sequelize";
import { v4 as uuidv4 } from 'uuid';

const hospitalMenu = async (args: any, db: any) => {
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
    } else if (currentStep == 2) {
        response = "CON Type your district e.g Kampala";
    } else if (currentStep == 3) {
        const userTextLower = userText.toLowerCase(); // Convert user input to lowercase
        const hospitals = await db.hospitals.findAll({
            where: {
                district: {
                    [Op.iLike]: `%${userText}%`
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
        } else {
            // if hospitals are found, return a list of unique districts
            const districts = hospitals.map((hospital: any) => hospital.district);

            const uniqueDistricts = [...new Set(districts)];

            const districtMessages = uniqueDistricts?.slice(0, 6).map((district: any, index: number) => {
                return `${index + 1}. ${district}`
            });


            response = `CON Confirm your district` +
                `\n${districtMessages.join("\n")}`;
        }
    } else if (currentStep == 4) {
        const hospitals = await db.hospitals.findAll({
            where: {
                district: {
                    [Op.iLike]: `%${allSteps[2]}%`
                }
            },
            order: [
                ['district', 'ASC'],
            ],
            limit: 10,
        });

        const districtSelected = hospitals[parseInt(allSteps[3]) - 1];


        response = `CON Type your Hospital to search e.g ${districtSelected.hospital_name}`;
    } else if (currentStep == 5) {
        const districts = await db.hospitals.findAll({
            where: {
                district: {
                    [Op.iLike]: `%${allSteps[2]}%`
                }
            },
            order: [
                ['district', 'ASC'],
            ],
        });

        const districtSelected = districts[parseInt(allSteps[3]) - 1];


        const hospitals = await db.hospitals.findAll({
            where: {
                district: districtSelected.district,
                hospital_name: {
                    [Op.iLike]: `%${userText}%`
                }
            },
            order: [
                ['hospital_name', 'ASC'],
            ],
            limit: 10,
        });

        const hospitalMessages = hospitals?.slice(0, 6).map((hospital: any, index: number) => {
            return `${index + 1}. ${hospital.hospital_name}`
        });

        response = `CON Confirm your hospital` +
            `\n${hospitalMessages.join("\n")}`;

    } else if (currentStep == 6) {
        const districts = await db.hospitals.findAll({
            where: {
                district: {
                    [Op.iLike]: `%${allSteps[2]}%`
                }
            },
            order: [
                ['district', 'ASC'],
            ],
        });

        const districtSelected = districts[parseInt(allSteps[3]) - 1];
        const hospitals = await db.hospitals.findAll({
            where: {
                district: districtSelected.district,
                hospital_name: {
                    [Op.iLike]: `%${allSteps[4]}%`
                }
            },
            order: [
                ['hospital_name', 'ASC'],
            ],
            limit: 10,
        });


        console.log("ALL STEPS", allSteps)

        const hospitalSelected = hospitals[parseInt(allSteps[5]) - 1];

        console.log("HOSPITAL SELECTED", hospitalSelected)

        const hospital = await db.hospitals.findOne({
            where: {
                hospital_id: hospitalSelected.hospital_id
            }
        });

        const user = await db.users.findOne({
            where: {
                phone_number: trimmedPhoneNumber
            },
            limit: 1,
        });

        await db.user_hospitals.create({
            user_hospital_id: uuidv4(),
            user_id: user.user_id,
            hospital_id: hospital.hospital_id
        });

        response = `CON You have selected ${hospital.hospital_name} as your preferred facility.Below are the Hospital details` +
            `\nHospital Name: ${hospital.hospital_name}` +
            `\nContact Number: ${hospital.hospital_contact}` +
            `\nLocation: ${hospital.hospital_address}` + "\n0. Back \n00. Main Menu";


    }




    return response;
};

export default hospitalMenu;