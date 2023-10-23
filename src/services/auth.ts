
import axios from 'axios';
require('dotenv').config()


async function authToken(partner_id: number) {
    try {
        let inputBody: any;

        switch (partner_id) {
            case 1:
                inputBody = {
                    client_id: process.env.AIRTEL_KEN_CLIENT_ID,
                    client_secret: process.env.AIRTEL_KEN_CLIENT_SECRET,
                    grant_type: 'client_credentials',
                };
                break;
                case 2:
                inputBody = {
                    client_id: 'f42013ed-a169-4b69-a7fb-960e56e80911',
                    //process.env.ENVIROMENT == 'PROD' ? process.env.PROD_AIRTEL_UGX_CLIENT_ID: process.env.AIRTEL_UGX_CLIENT_ID,
                    client_secret:'845908cd-8f22-463a-bb2b-8a5243b6efbe',
                    //process.env.ENVIROMENT == 'PROD' ?  process.env.PROD_AIRTEL_UGX_CLIENT_SECRET : process.env.AIRTEL_UGX_CLIENT_SECRET,
                    grant_type: 'client_credentials',
                };
                
                break;
            default:
                inputBody = {
                    client_id: process.env.AIRTEL_CLIENT_ID,
                    client_secret: process.env.AIRTEL_CLIENT_SECRET,
                    grant_type: 'client_credentials',
                };
        }

        const headers = {
            'Content-Type': 'application/json',
            Accept: '*/*',
        };

        //console.log("process.env.AIRTEL_UGX_CLIENT_ID", inputBody);

        const AUTH_TOKEN_URL = 'https://openapi.airtel.africa/auth/oauth2/token'
        //process.env.ENVIROMENT == 'PROD' ? process.env.PROD_AIRTEL_AUTH_TOKEN_URL : process.env.AIRTEL_AUTH_TOKEN_URL;
        console.log("AUTH_TOKEN_URL", AUTH_TOKEN_URL)
        const response = await axios.post(AUTH_TOKEN_URL, inputBody, { headers });
       // console.log("RESPONSE", response);

        if (response.status === 200) {
            const token = response.data.access_token;
            return token;
        } else {
            console.error('Failed to retrieve the access token:', response.status, response.statusText);
            throw new Error('Failed to retrieve the access token');
        }
    } catch (error) {
        console.error('An error occurred:', error.message);
        throw error;
    }
}

export default authToken;
