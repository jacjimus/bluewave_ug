
import { generateClaimId } from "../../services/utils";
import SMSMessenger from "../../services/sendSMS";


const claimMenu = async (args, db) => {
    let { response, currentStep, userText, allSteps } = args;

    if (currentStep === 1) {
        response = "CON Make Claim " +
            "\n1. Inpatient Claim" +
            "\n2. Death Claim" +
            "\n0. Back" +
            "\n00. Main Menu"
    }
    else if (currentStep === 2) {
        switch (userText) {
            case "1":
                // CREATE CLAIM
                let claim_type = "Inpatient Claim";
                let user = await db.users.findOne({
                    where: {
                        phone_number: args.phoneNumber.replace('+', "")?.substring(3),
                    },
                    limit: 1,
                });
                console.log("USER ID", user.user_id);


                const policy = await db.policies.findOne({
                    where: {
                        user_id: user?.user_id,
                        policy_status: "paid",
                    },
                });

                console.log("POLICY", policy);

                if (!policy || !user) {
                    response = "CON You have no paid policy found" + "\n0. Back \n00. Main Menu";
                    return response;
                }

                const claimId = generateClaimId();

                 await db.claims.create({
                    claim_number: claimId,
                    policy_id: policy.policy_id,
                    user_id: user.user_id,
                    claim_date: new Date(),
                    claim_status: "pending",
                    partner_id: user.partner_id,
                    claim_description: `${claim_type} ID: ${claimId} for Member ID: ${user.membership_id
                        }  ${policy.policy_type.toUpperCase()} ${policy.beneficiary.toUpperCase()} policy`,
                    claim_type: claim_type,
                    claim_amount: policy.sum_insured,
                });
                response = "END Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service"
                break;
            case "2":
                response = "CON Enter phone of next of Kin e.g 07XXXXXXXX"
                break;
            default:
                response = "END Invalid option"
                break;
        }
    }
    else if (currentStep === 3) {
        response = "CON Enter your Relationship to the deceased"
    }
    else if (currentStep === 4) {
        response = "CON Enter Full Name of deceased"
    }
    else if (currentStep === 5) {
        response = "CON Enter Date of Death in the format DDMMYYYY e.g 01/01/1990"
    }
    else if (currentStep === 6) {
        const deathData = {
            nextOfKinPhoneNumber: allSteps[2].startsWith('0') ? allSteps[2].substring(1) : allSteps[2],
            relationship: allSteps[3],
            deceasedName: allSteps[4],
            dateOfDeath: allSteps[5],
        }

        console.log("deathData", deathData);

        // CREATE CLAIM
        
        let user = await db.users.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { phone_number: deathData.nextOfKinPhoneNumber },
                    { phone_number: args.phoneNumber.replace('+', "")?.substring(3) },
                ]
            },
            limit: 1,
        });
        //console.log("USER CLAIM ", user.user_id, user.first_name, user.last_name);

        if (!user) {
            response = "CON Sorry no customer found with that phone number" + "\n0. Back \n00. Main Menu";
            return response;
        }

        let policy = await db.policies.findAll({
            where: {
                user_id: user.user_id,
                policy_status: "paid",
            },
        });
    
        
        if (policy.length == 0) {
            response = "CON Sorry you cant make a claim" + "\n0. Back \n00. Main Menu";
            return response;
        }
        
        const sms = `Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107`
        await SMSMessenger.sendSMS(`+256${user.phone_number}`, sms);

        response = `END Your claim documents have been received. Your claim is being processed.`;
        const claimId = generateClaimId();

         await db.claims.create({
            claim_number: claimId,
            policy_id: policy[policy.length - 1].policy_id,
            user_id: user.user_id,
            claim_date: new Date(),
            claim_status: "pending",
            partner_id: user.partner_id,
            claim_description: `Death Claim ID: ${claimId} for AAR Memberr Numbe: ${user.arr_membership_number
                }  ${policy.policy_type.toUpperCase()} ${policy.beneficiary.toUpperCase()} policy`,
            claim_type: "Death Claim",
            claim_amount: policy.sum_insured,
            claim_death_date: new Date(deathData.dateOfDeath) ? new Date(deathData.dateOfDeath) : "2021-01-01",
        });

    }



    return response

}

export default claimMenu;
