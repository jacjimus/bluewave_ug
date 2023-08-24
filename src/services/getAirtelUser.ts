
import axios from 'axios';
import authToken from './auth';
import bcrypt from 'bcrypt';
import { db } from "../models/db";
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config()

const User = db.users;

async function getAirtelUser(phoneNumber: any, country: any, currency: any, partner_id: any) {
    let token = await authToken();
    const headers = {
        'Accept': '*/*',
        'X-Country': country,
        'X-Currency': currency,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
   const GET_USER_URL =  `https://openapiuat.airtel.africa/standard/v1/users/${phoneNumber}`

    await axios.get( GET_USER_URL, { headers })
        .then(response => {
            console.log(response.data);
            //   "first_name": "Dealer",
            //   "grade": "SUBS",
            //   "is_barred": false,
            //   "is_pin_set": true,
            //   "last_name": "Test1",
            //   "msisdn": 123456789,
            //   "reg_status": "SUBS",
            let user = User.create({
                user_id: uuidv4(),
                membership_number:  Math.floor(100000 + Math.random() * 900000),
                name: response.data?.first_name + " " + response.data?.last_name,
                first_name: response.data?.first_name,
                last_name: response.data?.last_name,
                nationality: country,
                phone_number: response.data?.msisdn,
                password: bcrypt.hash(response.data?.msisdn, 10),
                createdAt: new Date(),
                updatedAt: new Date(),
                pin: Math.floor(1000 + Math.random() * 9000),
                role: "user",
                status: "active",
                partner_id: partner_id,
             

            })
            console.log("USER FOR AIRTEL API", user)
            return user;
        })
        .catch(error => {
            console.error(error);
            throw new Error("User not found");
        });
}

export default getAirtelUser;