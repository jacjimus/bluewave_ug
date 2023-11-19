
import axios from 'axios';
import dotenv from 'dotenv'
dotenv.config()

async function authToken(partner_id: number) {
    try {
        let inputBody: any, AUTH_TOKEN_URL: string;

        switch (partner_id) {
            case 1:
                AUTH_TOKEN_URL = process.env.AIRTEL_AUTH_TOKEN_URL_UAT
                inputBody = {
                    client_id: process.env.AIRTEL_KEN_CLIENT_ID,
                    client_secret: process.env.AIRTEL_KEN_CLIENT_SECRET,
                    grant_type: 'client_credentials',
                };
                break;
                case 2:
               AUTH_TOKEN_URL = process.env.PROD_AIRTEL_AUTH_TOKEN_URL
                inputBody = {
                    client_id: process.env.PROD_AIRTEL_UGX_CLIENT_ID,
                    client_secret:process.env.PROD_AIRTEL_UGX_CLIENT_SECRET,
                    grant_type: 'client_credentials',
                };
                
                break;
            default:
                AUTH_TOKEN_URL = process.env.PROD_AIRTEL_AUTH_TOKEN_URL
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


      

        console.log("AUTH_TOKEN_URL", AUTH_TOKEN_URL)
        const response = await axios.post(AUTH_TOKEN_URL, inputBody, { headers });
      

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
