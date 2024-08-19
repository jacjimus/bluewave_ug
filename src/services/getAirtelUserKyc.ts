
import axios from "axios";
import bcrypt from "bcrypt";
import { db } from "../models/db";
import { v4 as uuidv4 } from "uuid";
import SMSMessenger from "./sendSMS";
import dotenv from "dotenv";
import authTokenByPartner from "./authorization";
import { formatPhoneNumber, generateNextMembershipId } from "./utils";
import { logger } from "../middleware/loggingMiddleware";
import moment from "moment";

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
        membership_id: await generateNextMembershipId(),
        name: `${userData.first_name} ${userData.last_name}`,
        first_name: userData.first_name,
        last_name: userData.last_name,
        nationality: partner_id == 1 ? "KENYA" : "UGANDA",
        phone_number: userData.msisdn,
        password: await bcrypt.hash(
          `${userData.first_name}${userData.last_name}`,
          10
        ),
        createdAt: moment().toDate(),
        updatedAt: moment().toDate(),
        pin: generatePIN(),
        role: "user",
        status: "active",
        partner_id: partner_id,
        unique_profile_id: await generateNextMembershipId(),

      });

      // WELCOME SMS
      const message = `Dear Customer, welcome to Ddwaliro Care. Dial *185*7*6# to access your account.`;
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
    const countryCode = "UG";
    const currencyCode =  "UGX";

    const headers = {
      Accept: "*/*",
      "X-Country": countryCode,
      "X-Currency": currencyCode,
      "Content-Type": "application/json",
      Authorization: `Bearer ${await authTokenByPartner(partnerId)}`,
    };

    // Remove  the leading 256 from the phone number if it exists or 0 if it exists  or +256 if it exists
    phoneNumber = phoneNumber.replace(/^(\+256|256|0)/, "");

    const baseUrl = process.env.IS_UAT == '1' ? process.env.UAT_KEN_AIRTEL_KYC_API_URL : process.env.PROD_AIRTEL_KYC_API_URL;
    const GET_USER_URL = `${baseUrl}/${phoneNumber}`;

    console.log("GET_USER_URL", GET_USER_URL, headers);

    const response = await axios.get(GET_USER_URL, { headers });
    console.log("RESULT", response.data);

    let user: any;
    console.log("response:", response.data.status.success, response.data.status.code);
    if (response.data.status.success === false || response.data.status.code !== "200") {
      // If user is not found, create a dummy user with phone number
      const userData = {
        first_name: "FN" + phoneNumber,
        last_name: "LN" + phoneNumber,
        msisdn: phoneNumber
      };
      user = await createUserIfNotExists(userData, phoneNumber, partnerId);

      console.log("User not found. Dummy user created:", user);
    } else {
      // If user is found, extract user data and create if not exists
      const userData = response.data.data;
      user = await createUserIfNotExists(userData, phoneNumber, partnerId);
      console.log("User found:", user);
    }

    return user;

  } catch (error) {
    logger.error("Error in getAirtelUser:", error.message);
    throw new Error("Failed to get Airtel user. Please try again later. " +  error.message);
  }
}

async function createUserIfNotExists(userResponse: any, phone_number: string, partner_id: number) {
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
  const { first_name, last_name } = userResponse;
  let full_name = `${first_name} ${last_name}`;

  if (full_name.includes("FN") || full_name.includes("LN")) {
    full_name = "Customer";
  }
  const existingUser = await db.users.create({
    user_id: uuidv4(),
    phone_number: phone_number,
    membership_id: await generateNextMembershipId(),
    pin: Math.floor(1000 + Math.random() * 9000),
    first_name: first_name,
    last_name: last_name,
    name: full_name,
    total_member_number: "M",
    partner_id: 2,
    role: "user",
    nationality: "UGANDA",
    unique_profile_id: await generateNextMembershipId(),
  });

  const message = `Dear Customer, welcome to Ddwaliro Care. Dial *185*7*6# to access your account.`;
  await SMSMessenger.sendSMS(2, fullPhone, message);
  return existingUser;
}

function generateMembershipId(phoneNumber: string) {
  let membershipId = phoneNumber.substring(3);

  const user = User.findOne({ where: { membership_id: membershipId } });

  if (!user) {
    // @ts-ignore
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
  code: number;
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

    if (response.data.status.success === false || response.data.status.code !== '200') {
      throw new Error('User not found');
    }

    return response.data.data;
  } catch (error) {
    logger.error('Error in getAirtelUserKenya:', error.message);
    //throw new Error('Failed to get Airtel user. Please try again later.');
  }
}



export { getAirtelUserKenya, getAirtelUser, getUserByPhoneNumber, createUserIfNotExists };
