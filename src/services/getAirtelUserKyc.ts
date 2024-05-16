
import axios from "axios";
import bcrypt from "bcrypt";
import { db } from "../models/db";
import { v4 as uuidv4 } from "uuid";
import SMSMessenger from "./sendSMS";
import dotenv from "dotenv";
import authTokenByPartner from "./authorization";
import { formatPhoneNumber } from "./utils";
import { logger } from "../middleware/loggingMiddleware";

dotenv.config();

const User = db.users;

async function getUserByPhoneNumber(phoneNumber: string, partner_id: number) {
  try {
    let userData = await User.findOne({
      where: {
        phone_number: phoneNumber,
        partner_id: partner_id,
      },
    });

    // if not found, create a new user
    if (!userData) {
      const user = await User.create({
        user_id: uuidv4(),
        membership_id: generateMembershipId(phoneNumber),
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
      const message = `Dear ${user.first_name}, welcome to Ddwaliro Care. Membership ID: ${user.membership_id}. Dial *185*7*6# to access your account.`;
      await SMSMessenger.sendSMS(2, user.phone_number, message);
      console.log("USER FOR AIRTEL API", user);
    }

    return userData;
  } catch (error) {
    logger.error("Error in getUserByPhoneNumber:", error.message);
    throw new Error("Failed to get user. Please try again later.");
  }
}


async function getAirtelUser(phoneNumber: string, partnerId: number) {
  try {
    let result 
    const countryCode = partnerId === 1 ? "KE" : "UG";
    const currencyCode = partnerId === 1 ? "KES" : "UGX";

    const headers = {
      Accept: "*/*",
      "X-Country": countryCode,
      "X-Currency": currencyCode,
      "Content-Type": "application/json",
      Authorization: `Bearer ${await authTokenByPartner(partnerId)}`,
    };

    // Remove  the leading 256 from the phone number if it exists or 0 if it exists  or +256 if it exists
    phoneNumber = phoneNumber.replace(/^(\+256|256|0)/, "");
    const baseUrl = partnerId === 1 ? process.env.UAT_KEN_AIRTEL_KYC_API_URL : process.env.PROD_AIRTEL_KYC_API_URL;
    const GET_USER_URL = `${baseUrl}/${phoneNumber}`;

    console.log("GET_USER_URL", GET_USER_URL, headers);

    const response = await axios.get(GET_USER_URL, { headers });
    console.log("RESULT", response.data);

   
  if(response.data){
    result = {
      first_name: response.data.first_name,
      last_name: response.data.last_name,
    };
  }

    return result;

  } catch (error) {
   console .log("Error in getAirtelUser:", error.message);
  }
}

async function createUserIfNotExists(userResponce: any, phone_number: string, partner_id: number) {
  let membershipId = generateMembershipId(phone_number);

  let fullPhone = await formatPhoneNumber(phone_number, 2);

  const user = await User.findOne({
    where: {
      phone_number: phone_number,
      partner_id: partner_id,
    },
  });
  if (user) {
    return user;
  }
  const { first_name, last_name } = userResponce;
  let full_name = `${first_name} ${last_name}`;

  if (full_name.includes("FN") || full_name.includes("LN")) {
    full_name = "Customer";
  }
  const existingUser = await db.users.create({
    user_id: uuidv4(),
    phone_number: phone_number,
    membership_id: membershipId,
    pin: Math.floor(1000 + Math.random() * 9000),
    first_name: first_name,
    last_name: last_name,
    name: full_name,
    total_member_number: "M",
    partner_id: 2,
    role: "user",
    nationality: "UGANDA",
  });

  const message = `Dear ${full_name}, welcome to Ddwaliro Care. Dial *185*7*6# to access your account.`;
  await SMSMessenger.sendSMS(2, fullPhone, message);
  return existingUser;
}

function generateMembershipId(phoneNumber) {
  let membershipId = phoneNumber.substring(3);

  const user = User.findOne({ where: { membership_id: membershipId } });

  if (!user) {
    membershipId = generateRandomId();
  }

  return membershipId;
}

function generateRandomId() {
  // Generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000);
}



function generatePIN() {
  return Math.floor(1000 + Math.random() * 9000);
}

interface UserData {
  first_name: string;
  last_name: string;
}

async function getAirtelUserKenya(msisdn: string): Promise<UserData> {
  try {
    const headers = {
      Accept: '*/*',
      'X-Country': 'KE',
      'X-Currency': 'KES',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await authTokenByPartner(1)}`,
    };

    const GET_USER_URL = `${process.env.UAT_KEN_AIRTEL_KYC_API_URL}/${msisdn}`;

    console.log('GET_USER_URL', GET_USER_URL);

    const response = await axios.get(GET_USER_URL, { headers });
    console.log('RESULT', response.data);

    const userData: UserData = {
      first_name: response.data.first_name,
      last_name: response.data.last_name,
    };

    return userData;
  } catch (error) {
    logger.error('Error in getAirtelUserKenya:', error.message);
    throw new Error('Failed to get Airtel user. Please try again later.');
  }
}



export { getAirtelUserKenya, getAirtelUser, getUserByPhoneNumber, createUserIfNotExists };
