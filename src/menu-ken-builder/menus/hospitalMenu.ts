import { Op } from "sequelize";
import { v4 as uuidv4 } from 'uuid';
import SMSMessenger from "../../services/sendSMS";

const hospitalMenu = async (args: any, db: any) => {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;

    const trimmedPhoneNumber = phoneNumber.replace("+", "").substring(3);
    const smsPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

    const user = await db.users.findOne({
        where: {
            phone_number: trimmedPhoneNumber
        },
        limit: 1,
    });


    if (currentStep == 1) {
        response = "CON Type your hospital e.g Nairibi hospital";
    } else if (currentStep == 2) {
        const userText = allSteps[1]
        const userTextLower = userText.toLowerCase();
        const hospitals = await db.hospitals_kenya.findAll({
            where: {
                [Op.or]: [
                    {
                        region: {
                            [Op.iLike]: `%${userTextLower}%`
                        }
                    },
                    {
                        provider_name: {
                            [Op.iLike]: `%${userTextLower}%`
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
        } else {


            const hospitalList = hospitals?.slice(0, 6).map((hospital: any, index: number) => {
                return `${index + 1}. ${hospital.provider_name}`
            }
            );

            response = `CON select hospital` +
                `\n${hospitalList.join("\n")}`;
        }


    } else if (currentStep == 3) {

        const hospitalSelectedIndex = parseInt(allSteps[2]) - 1;
        const userTextLower = allSteps[1].toLowerCase()

        const hospitals = await db.hospitals_kenya.findAll({
            where: {
                region: {
                    [Op.iLike]: `%${userTextLower}%`
                },
                provider_name: {
                    [Op.iLike]: `%${userTextLower}%`
                }
            },
            order: [
                ['provider_name', 'ASC'],
            ],
            limit: 6,
        });

        const hospitalChoosen = hospitals[hospitalSelectedIndex]

        const userHospitalCount = await db.user_hospitals.findAndCountAll({
            where: {
                user_id: user.user_id

            },
            limit: 3
        })

        if (userHospitalCount < 1) {

            await db.user_hospitals.create({
                user_hospital_id: uuidv4(),
                user_id: user.user_id,
                hospital_id: hospitalChoosen.hospital_id
            });
        } else {

            await db.user_hospitals.update(
                { hospital_id: hospitalChoosen.hospital_id },
                {
                    where: { user_id: user.user_id }
                })
        }



        let message = `Congratulations, you have selected  ${hospitalChoosen.provider_name} as your preferred Hospital. Below are the Hospital details:
                        Contact Number:  ${hospitalChoosen.hospital_contact}
                        Location: ${hospitalChoosen.hospital_address}`

        await SMSMessenger.sendSMS(3,smsPhone, message)

        response = `CON You have selected ${hospitalChoosen.provider_name} as your preferred facility.` +
            `\nContact: ${hospitalChoosen.hospital_contact}` +
            `\nLocation: ${hospitalChoosen.hospital_address}` + "\n0. Back \n00. Main Menu";

    }


    return response;
};

export default hospitalMenu;