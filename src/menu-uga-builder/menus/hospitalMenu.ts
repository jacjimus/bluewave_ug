import { Op } from "sequelize";
import { v4 as uuidv4 } from 'uuid';
import SMSMessenger from "../../services/sendSMS";

const hospitalMenu = async (args: any, db: any) => {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;

    const trimmedPhoneNumber = phoneNumber.replace("+", "").substring(3);
    const smsPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

    if (currentStep == 1) {
        response = "CON " +
            "\n1. Search by hospital name" +
            "\n2. Get full hospitals list" +
            "\n0. Back \n00. Main Menu";
    } else if (currentStep == 2) {
        
        if(userText == '1'){
            response = "CON Type hospital name to search" + "\n0. Back \n00. Main Menu";
        }else if(userText == '2'){
            const hospital_list_message =  'To view Full hospitals list, visit Ddwaliro Care Ts & Cs https://rb.gy/oeuua5';
            await SMSMessenger.sendSMS(2,smsPhone, hospital_list_message)
            response = 'END Full hospitals list has been sent to your phone number via SMS'
        }else{
            response = "CON Invalid option selected. Please try again";
        }
      


    } else if (currentStep == 3) {
        const userTextLower = userText.toLowerCase();
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


    } else if (currentStep == 4) {

        const userChoice = allSteps[2].toLowerCase();
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

        const hospitalSelected = hospitals[parseInt(allSteps[3]) - 1];


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


        let message = `Congratulations, you have selected  ${hospital.hospital_name} as your preferred Hospital. Hospital details:` +
       ` \nContact: ${hospital.hospital_contact_person} - ${hospital.hospital_contact}` +
        `\nLocation: ${hospital.hospital_address} - ${hospital.region} `

        await SMSMessenger.sendSMS(2,smsPhone, message)

        response = `CON You have selected ${hospital.hospital_name} as your preferred facility.` +
            `\nContact: ${hospital.hospital_contact_person} - ${hospital.hospital_contact}` +
            `\nLocation: ${hospital.hospital_address} - ${hospital.region}` + "\n0. Back \n00. Main Menu";
    }




    return response;
};

export default hospitalMenu;