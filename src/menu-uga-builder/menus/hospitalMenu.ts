import { Op } from "sequelize";
import { v4 as uuidv4 } from 'uuid';
import SMSMessenger from "../../services/sendSMS";

const hospitalMenu = async (args: any, db: any) => {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;

    const trimmedPhoneNumber = phoneNumber.replace("+", "").substring(3);
    const smsPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

    // if (currentStep == 1) {
    //     response = "CON Select Region" +
    //         "\n1. Central" +
    //         "\n2. Western" +
    //         "\n3. Nothern" +
    //         "\n4. Eastern" +
    //         "\n5. West Nile" +
    //         "\n6. Karamoja" + "\n0. Back \n00. Main Menu";
    // } else 
    if (currentStep == 1) {
        response = "CON Type your hospital name to search";
    } else if (currentStep == 2) {
        const userTextLower = userText.toLowerCase();
        console.log("USER TEXT", userTextLower)
        const hospitals = await db.hospitals.findAll({
            where: {

                hospital_name: {
                    [Op.iLike]: `%${userTextLower}%`
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
        } else {
            //list the hospitals
            const hospitalMessages = hospitals?.slice(0, 6).map((hospital: any, index: number) => {
                return `${index + 1}. ${hospital.hospital_name}`
            });
            response = `CON Select your preferred hospital` +
                `\n${hospitalMessages.join("\n")}` + "\n0. Back \n00. Main Menu";
        }


    } else if (currentStep == 3) {

        const userChoice = allSteps[1].toLowerCase();
        console.log("USER CHOICE", userChoice)
        const hospitals = await db.hospitals.findAll({
            where: {

                hospital_name: {
                    [Op.iLike]: `%${userChoice}%`
                },

            },
            order: [
                ['hospital_name', 'ASC'],
            ],
            limit: 10,
        });

        const hospitalSelected = hospitals[parseInt(allSteps[2]) - 1];


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

        let message = `Congratulations, you have selected  ${hospital.hospital_name} as your preferred Hospital. Below are the Hospital details:
        Contact Number:  ${hospital.hospital_contact}
        Location: ${hospital.hospital_address}`

        await SMSMessenger.sendSMS(2,smsPhone, message)

        response = `CON You have selected ${hospital.hospital_name} as your preferred facility.` +
            // `\n${hospital.hospital_name}` +
            `\nContact: ${hospital.hospital_contact}` +
            `\nLocation: ${hospital.hospital_address}` + "\n0. Back \n00. Main Menu";


    }




    return response;
};

export default hospitalMenu;