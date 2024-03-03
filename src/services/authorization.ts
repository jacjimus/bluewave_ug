import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function authTokenByPartner(partner_id: number) {
    try {
        let AUTH_TOKEN_URL: string, inputBody: any;

        switch (partner_id) {
            case 1:
                AUTH_TOKEN_URL = process.env.KEN_AIRTEL_AUTH_TOKEN_URL;
                inputBody = {
                    client_id: process.env.AIRTEL_KEN_CLIENT_ID,
                    client_secret: process.env.AIRTEL_KEN_CLIENT_SECRET,
                    grant_type: 'client_credentials',
                };
                break;
            case 2:
                AUTH_TOKEN_URL = process.env.PROD_AIRTEL_AUTH_TOKEN_URL;
                inputBody = {
                    client_id: process.env.PROD_AIRTEL_UGX_CLIENT_ID,
                    client_secret: process.env.PROD_AIRTEL_UGX_CLIENT_SECRET,
                    grant_type: 'client_credentials',
                };
                break;
            default:
                throw new Error('Invalid partner id');
        }

        const headers = {
            'Content-Type': 'application/json',
            Accept: '*/*',
        };

        console.log("AUTH_TOKEN_URL", AUTH_TOKEN_URL);
        const response = await axios.post(AUTH_TOKEN_URL, inputBody, { headers });
      
        console.log("========= AUTHTOKEN RESPONSE ======= ", response.data);
        
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

export default authTokenByPartner;
