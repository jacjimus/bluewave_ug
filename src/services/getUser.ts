
import axios from 'axios';
import authToken from './auth';
import bcrypt from 'bcrypt';
import { db } from "../models/db";
require('dotenv').config()


const User = db.users;



async function getUser(phoneNumber: any) {
    let token = await authToken();
    const headers = {
        'Accept': '*/*',
        'X-Country': process.env.AIRTEL_COUNTRY,
        'X-Currency': process.env.AIRTEL_CURRENCY,
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
                name: response.data.first_name + " " + response.data.last_name,
                phone_number: response.data.msisdn,
                password: bcrypt.hash(response.data.msisdn, 10),
                createdAt: new Date(),
                updatedAt: new Date(),
                pin: Math.floor(1000 + Math.random() * 9000),
                role: "user"

            })


            console.log("USER FOR AIRTEL API", user)
            return user;

        })
        .catch(error => {
            console.error(error);
            throw new Error("User not found");

        });
}

export default getUser;