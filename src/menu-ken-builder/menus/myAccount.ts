import sendSMS from "../../services/sendSMS";
import { registerDependant, fetchMemberStatusData } from "../../services/aar";
import { v4 as uuidv4 } from 'uuid';

export function myAccount(menu: any, args: any, db: any) {
  const User = db.users;
  const Policy = db.policies;
  const Beneficiary = db.beneficiaries;

  const findUserByPhoneNumber = async (phoneNumber: any) => {
    return await User.findOne({
      where: {
        phone_number: phoneNumber,
      },
    });
  };





}
