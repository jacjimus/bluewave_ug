
import axios from "axios";
import bcrypt from "bcrypt";
import { db } from "../models/db";
import { v4 as uuidv4 } from "uuid";
import SMSMessenger from "./sendSMS";
import dotenv from "dotenv";
import authTokenByPartner from "./auth";
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
      await SMSMessenger.sendSMS(2,user.phone_number, message);
      console.log("USER FOR AIRTEL API", user);
    }

    return userData;
  } catch (error) {
    console.error(error);
  }
}


async function getAirtelUser(
  phoneNumber: string,
  country: string,
  currency: string,
  partner_id: number
) {
  try {

    const token = await authTokenByPartner(partner_id);

    const headers = {
      Accept: "*/*",
      "X-Country": country,
      "X-Currency": currency,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    phoneNumber = phoneNumber.replace("+", "").substring(3);
    
    // process.env.ENVIROMENT == 'PROD' ? process.env.PROD_AIRTEL_AUTH_TOKEN_URL:   process.env.AIRTEL_AUTH_TOKEN_URL;
    const GET_USER_URL = `${process.env.PROD_AIRTEL_KYC_API_URL}/${phoneNumber}`;

    const { data } = await axios.get(GET_USER_URL, { headers });
    console.log("RESPONSE KYC", data.data);
    return data?.data;
  } catch (error) {
    console.error(error);
  }
}


async function getAirtelKenyaUser(
  phoneNumber: string,
) {
  try {

    const token = await authTokenByPartner(1);
    console.log("TOKEN I AM GETTING", token);
    const headers = {
      Accept: "*/*",
      "X-Country": 'KE',
      "X-Currency": 'KES',
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    phoneNumber = phoneNumber.replace("+", "").substring(3);

    const GET_USER_URL = `${process.env.AIRTEL_KYC_API_URL}/${phoneNumber}`;

    console.log("GET_USER_URL", GET_USER_URL);

    const { data } = await axios.get(GET_USER_URL, { headers });
    console.log("RESPONSE KYC", data.data);
    return data?.data;
  } catch (error) {
    console.error(error);
  }
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

export { getAirtelUser, getUserByPhoneNumber, getAirtelKenyaUser };
