
import axios from "axios";
import authToken from "./auth";
import bcrypt from "bcrypt";
import { db } from "../models/db";
import { v4 as uuidv4 } from "uuid";
import sendSMS from "./sendSMS";

const User = db.users;

async function getAirtelUser(
  phoneNumber: string,
  country: string,
  currency: string,
  partner_id: number
) {
  try {
    
    const userExists = await User.findOne({
      where: {
        phone_number: phoneNumber,
        partner_id: partner_id,
      },
    });

    if (userExists) {
      console.log("User exists");
      return userExists;
    }

    // Making an API call only if the user doesn't exist
    const token = await authToken(partner_id);
    const headers = {
      Accept: "*/*",
      "X-Country": country,
      "X-Currency": currency,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const AIRTEL_KYC_API_URL = process.env.AIRTEL_KYC_API_URL;
    const GET_USER_URL = `${AIRTEL_KYC_API_URL}/${phoneNumber}`;

    console.log("GET_USER_URL", GET_USER_URL);

    const response = await axios.get(GET_USER_URL, { headers });
    console.log("RESPONSE KYC", response.data);

    if (response && response.data) {
      const userData = response.data.data;

      const user = await User.create({
        user_id: uuidv4(),
        membership_id: generateMembershipId(),
        name: `${userData.first_name} ${userData.last_name}`,
        first_name: userData.first_name,
        last_name: userData.last_name,
        nationality: partner_id == 1 ? "KENYA" : "UGANDA",
        phone_number: userData.msisdn,
        password: await bcrypt.hash(
          `${userData.first_name}${userData.last_name}`,
          10
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
        pin: generatePIN(),
        role: "user",
        status: "active",
        partner_id: partner_id,
      });

      // WELCOME SMS
      const message = `Dear ${user.first_name}, welcome to Ddwaliro Care. Membership ID: ${user.membership_id} and Ddwaliro PIN: ${user.pin}. Dial *185*4*4# to access your account.`;
      await sendSMS(user.phone_number, message);

      console.log("USER FOR AIRTEL API", user);
      return user ? user : null;
    } else {
      console.error("User data not found in response");
    }
  } catch (error) {
    console.error(error);
  }
}


function generateMembershipId() {
 
    while (true) {
      const membershipId = Math.floor(100000 + Math.random() * 900000);

    
      const user =  User.findOne({
        where: {
          membership_id: membershipId,
        },
      });

      if (!user) {
        return membershipId; 
      }
    }
  
}

function generatePIN() {
  return Math.floor(1000 + Math.random() * 9000);
}

export default getAirtelUser;
