import { airtelMoney } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';
import sendSMS from "../../services/sendSMS";
import {getAirtelUser} from '../../services/getAirtelUser';


export function buyForFamily(menu: any, args: any, db: any): void {

    const Policy = db.policies;
    const Beneficiary = db.beneficiaries;
    const User = db.users;

    if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
    }


    const findUserByPhoneNumber = async (phoneNumber: any) => {
        return await User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    };

    const findPaidPolicyByUser = async (user: any) => {
        let policies = await Policy.findAll({
            where: {
                user_id: user.user_id,
                policy_status: 'paid'
            },
        });
        return policies[policies.length - 1];
    };

    const findPolicyByUser = async (user_id: any) => {
        let policies = await Policy.findAll({
            where: {
                user_id: user_id,
            },
        });

        return policies[policies.length - 1];
    }



}