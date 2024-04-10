
import axios from "axios";
import bcrypt from "bcrypt";
import { db } from "../models/db";
import { v4 as uuidv4 } from "uuid";
import SMSMessenger from "./sendSMS";
import dotenv from "dotenv";
import authTokenByPartner from "./authorization";
import { formatPhoneNumber } from "./utils";

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
      const message = `Dear ${user.first_name}, welcome to Ddwaliro Care. Membership ID: ${user.membership_id}. Dial *185*7*6# to access your account.`;
      await SMSMessenger.sendSMS(2, user.phone_number, message);
      console.log("USER FOR AIRTEL API", user);
    }

    return userData;
  } catch (error) {
    console.error(error);
  }
}


async function getAirtelUser(phoneNumber: string, partnerId: number) {
  try {
    const countryCode = partnerId === 1 ? "KE" : "UG";
    const currencyCode = partnerId === 1 ? "KES" : "UGX";

    const headers = {
      Accept: "*/*",
      "X-Country": countryCode,
      "X-Currency": currencyCode,
      "Content-Type": "application/json",
      Authorization: `Bearer ${await authTokenByPartner(partnerId)}`,
    };

    // Remove leading '+' and country code from phone number
    phoneNumber = phoneNumber.replace("+", "").substring(3);

    const baseUrl = partnerId === 1 ? process.env.KEN_AIRTEL_API_URL : process.env.PROD_AIRTEL_KYC_API_URL;
    const GET_USER_URL = `${baseUrl}/${phoneNumber}`;

    const response = await axios.get(GET_USER_URL, { headers });

    let user: any;

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
    console.error("Error in getAirtelUser:", error.message);
    throw new Error("Failed to get Airtel user. Please try again later.");
  }
}

async function createUserIfNotExists(userResponce: any, phone_number: string, partner_id: number) {
  let membershipId = Math.floor(100000 + Math.random() * 900000);
  
  let fullPhone = await formatPhoneNumber(phone_number,2);

  const user = await User.findOne({
    where: {
      phone_number: phone_number,
      partner_id: partner_id,
    },
  });
  if(user){
    return user;
  }
  const { first_name, last_name } = userResponce;
let full_name =`${ first_name} ${ last_name}`;

if(full_name.includes("FN") || full_name.includes("LN")){
  full_name = "Customer";
}
 const existingUser = await db.users.create({
      user_id: uuidv4(),
      phone_number: phone_number,
      membership_id: membershipId,
      pin: Math.floor(1000 + Math.random() * 9000),
      first_name: first_name,
      last_name: last_name,
      name: full_name ,
      total_member_number: "M",
      partner_id: 2,
      role: "user",
      nationality: "UGANDA",
  });

  const message = `Dear ${full_name}, welcome to Ddwaliro Care. Membership ID: ${membershipId} Dial *185*7*6# to access your account.`;
  console.log("MESSAGE", message);
  await SMSMessenger.sendSMS(2, fullPhone, message);
  return existingUser;
}

function generateMembershipId() {

  while (true) {
    const membershipId = Math.floor(100000 + Math.random() * 900000);

    const user = User.findOne({
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

export { getAirtelUser, getUserByPhoneNumber, createUserIfNotExists };
