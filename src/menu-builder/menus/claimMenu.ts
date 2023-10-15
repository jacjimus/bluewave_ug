
import { generateClaimId } from "../../services/utils";
import sendSMS from "../../services/sendSMS";



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
                });
                console.log("USER ID", user.user_id);

                const policy = await db.policies.findOne({
                    where: {
                        user_id: user.user_id,
                        policy_status: "paid",
                    },
                });

                console.log("POLICY", policy);

                if (!policy) {
                    response = "CON No policy found" + "\n0. Back \n00. Main Menu";
                    return response;
                }

                const claimId = generateClaimId();

                const newClaim = await db.claims.create({
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
                response = "CON Enter phone of next of Kin e.g 0759608107" 
                break;
        }
    }
    else if (currentStep === 3) {
        response = "CON Enter your Relationship to the deceased"
    }
    else if (currentStep === 4) {
        response = "CON Enter Name of deceased"
    }
    else if (currentStep === 5) {
        response = "CON Enter Date of death in the format DDMMYYYY e.g 01011990"
    }
    else if (currentStep === 6) {
        const deathData = {
            nextOfKinPhoneNumber: allSteps[2].startsWith('0') ? allSteps[2].substring(1) : allSteps[2],
            relationship: allSteps[3],
            deceasedName: allSteps[4],
            dateOfDeath: allSteps[5],
        }
        // fomat date of death as YYYY-MM-DD
        deathData.dateOfDeath = `${deathData.dateOfDeath.substring(4)}-${deathData.dateOfDeath.substring(2, 4)}-${deathData.dateOfDeath.substring(0, 2)}`;

        // CREATE CLAIM
        let claim_type = "Death Claim";
        let user = await db.users.findOne({
            where: {
                phone_number: deathData.nextOfKinPhoneNumber,
            },
        });

        const policy = await db.policies.findOne({
            where: {
                user_id: user.user_id,
                policy_status: "paid",
            },
        });

        if (!policy) {
            response = "CON No policy found" + "\n0. Back \n00. Main Menu";
            return response;
        }

        const claimId = generateClaimId();

        const newClaim = await db.claims.create({
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
            claim_death_date: deathData.dateOfDeath,
        });

        // update beneficiary
        const beneficiary = await db.beneficiaries.findOne({
            where: {
                user_id: user.user_id,
                beneficiary_type: "NEXTOFKIN",
            },
        });

        if (!beneficiary) {
            response = "CON No beneficiary found" + "\n0. Back \n00. Main Menu";
            return response;
        }

        const beneficiaryPhone = beneficiary.phone_number?.startsWith('+') ? beneficiary.phone_number : `+${beneficiary.phone_number}`;
        const userPhone = user.phone_number?.startsWith('+') ? user.phone_number : `+${user.phone_number}`;

        const sms = 'Your claim documents have been received. Your claim is being processed.';
        await sendSMS(beneficiaryPhone || userPhone, sms);

        response = `END Send Death certificate or Burial permit and Next of Kin's ID via Whatsapp No. 0759608107`;
    }



    return response

}

export default claimMenu;
