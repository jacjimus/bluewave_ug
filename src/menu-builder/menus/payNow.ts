import { airtelMoney } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';

export function payNowPremium(menu: any, args: any, db: any): void {
  const User = db.users;
  const Policy = db.policies;


  const findUserByPhoneNumber = async (phoneNumber) => {
    return await User.findOne({
      where: {
        phone_number: phoneNumber,
      },
    });
  };

  

}
