
import { generateClaimId } from "../../services/utils";
import SMSMessenger from "../../services/sendSMS";


const claimMenu = async (args, db) => {
    let { response, currentStep, userText, allSteps } = args;
    let user : any = null;
    user = await db.users.findOne({
                    where: {
                        phone_number: args.msisdn.replace('+', "")?.substring(3),
                    },
                    limit: 1,
                });

    const policy = await db.policies.findOne({
                    where: {
                        user_id: user.user_id,
                        policy_status: "paid",
                    },
                });
     if (!policy) {
        response = "CON You do not have any active policy" + "\n0. Back \n00. Main Menu";
        return response;
     }

    if (currentStep === 1) {
        response = "CON Make Claim " +
            "\n1. Inpatient Claim" +
            "\n2. Hospital Cash" +
            "\n0. Back" +
            "\n00. Main Menu"
    }
    else if (currentStep === 2) {
        const claimId = generateClaimId();

        switch (userText) {

            case "1":

                let claim_type = "Inpatient Claim";

                console.log("USER ID", user.user_id);

                response = "END Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service"


                console.log("POLICY", policy);


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
                break;
            case "2":
                response = `END Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and your clim sorted`
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

                break;
            }
        }


        return response

    }

export default claimMenu;
