import sendSMS from "../../services/sendSMS";
import { registerDependant, fetchMemberStatusData } from "../../services/aar";
import { v4 as uuidv4 } from 'uuid';

const accountMenu = async (args: any, db: any) => {
    let { phoneNumber, response, currentStep, userText, allSteps } = args;

    const policy = await db.policies.findOne({
        where: {
            phone_number: phoneNumber
        }
    });


    if (currentStep == 1) {
        response = "My Account" +
            "\n1. Policy Status" +
            "\n2. Pay Now" +
            "\n3. Cancel Policy" +
            "\n4. Add Next of Kin" 
    }else{
        response = "END on progress"
    }
   

    return response
}
