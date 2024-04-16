
import { generateClaimId } from "../../services/utils";
import SMSMessenger from "../../services/sendSMS";


const claimMenu = async (args, db) => {
    let { response, currentStep, userText, allSteps } = args;
    let user : any = null;
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
                user = await db.users.findOne({
                    where: {
                        phone_number: args.msisdn.replace('+', "")?.substring(3),
                    },
                    limit: 1,
                });
                console.log("USER ID", user.user_id);
                
                response = "END Proceed to the preferred Hospital reception and mention your Airtel Phone number to verify your detail and get service"
                const policy = await db.policies.findAll({
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
