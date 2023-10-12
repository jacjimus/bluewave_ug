import sendSMS from "../../services/sendSMS";
import { generateClaimId } from "../../services/utils";
import { v4 as uuidv4 } from 'uuid';

export function makeClaim(menu: any, args: any, db: any): void {

    const User = db.users;
    const Policy = db.policies;
    const Claim = db.claims;
    const Beneficiary = db.beneficiaries;

    if (args.phoneNumber.charAt(0) == "+") {

        args.phoneNumber = args.phoneNumber.substring(1);
    }


    const findUserByPhoneNumber = async (phoneNumber: any) => {
        return await User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    }
   

}