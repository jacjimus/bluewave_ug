import axios from 'axios';
import authToken from './auth';
import bcrypt from 'bcrypt';
import { db } from "../models/db";
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();
import sendSMS from './sendSMS';

const User = db.users;

async function getAirtelUser(phoneNumber, country, currency, partner_id) {
    try {
        const token = await authToken();
        const headers = {
            'Accept': '*/*',
            'X-Country': country,
            'X-Currency': currency,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        const GET_USER_URL =  `https://openapiuat.airtel.africa/standard/v1/users/${phoneNumber}`;

        console.log("GET_USER_URL", GET_USER_URL);

        const response = await axios.get(GET_USER_URL, { headers });
        console.log("RESPONCE KYC", response.data)

        if (response && response.data) {
            const userData = response.data.data;

            //check if user exists with the same phone number and partner id
            const userExists = await User.findOne({
                where: {
                    phone_number: userData.msisdn,
                    partner_id: partner_id
                }
            });

            if (userExists) {
                console.log("User exists");
                return userExists;
            }
           
            const user = await User.create({
                user_id: uuidv4(),
                membership_id: Math.floor(100000 + Math.random() * 900000),
                name: `${userData.first_name} ${userData.last_name}`,
                first_name: userData.first_name,
                last_name: userData.last_name,
                nationality: "UGANDA",
                phone_number: userData.msisdn,
                password: await bcrypt.hash(`${userData.first_name}${userData.last_name}`, 10),
                createdAt: new Date(),
                updatedAt: new Date(),
                pin: Math.floor(1000 + Math.random() * 9000),
                role: "user",
                status: "active",
                partner_id: partner_id,
            });
            // WELCOME SMS
            const message = `Dear ${user.first_name}, welcome to Bluewave Insurance. Your membership ID is ${user.membership_id} and PIN is ${user.pin}. Dial *185*4*4# to access your account.`;
            await sendSMS(user.phone_number, message);

            console.log("USER FOR AIRTEL API", user);
            return user;
        } else {
            console.error("User data not found in response");
            throw new Error("User not found");
        }
    } catch (error) {
        console.error(error);
        throw new Error("Error while fetching Airtel user");
    }
}

export default getAirtelUser;
