import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function authTokenByPartner(partnerId: number) {
    const partnerConfig = {
      1: {
        url: process.env.UAT_AIRTEL_AUTH_TOKEN_URL,
        clientId: process.env.UAT_AIRTEL_KEN_CLIENT_ID,
        clientSecret: process.env.UAT_AIRTEL_KEN_CLIENT_SECRET,
      },
      2: {
        url: process.env.UAT_AIRTEL_AUTH_TOKEN_URL,
        clientId: process.env.UAT_AIRTEL_UGX_CLIENT_ID,
        clientSecret: process.env.UAT_AIRTEL_UGX_CLIENT_SECRET,
      },
    };

    if (!partnerConfig[partnerId]) {
      throw new Error('Invalid partner ID');
    }

    const { url, clientId, clientSecret } = partnerConfig[partnerId];

    const inputBody = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: '*/*',
    };

    console.log("======== partnerConfig =========== ",inputBody);
    try {
      const response = await axios.post(url, inputBody, { headers });

      if (response.status === 200) {
        return response.data.access_token;
      } else {
        throw new Error(`Failed to retrieve access token. Status: ${response.status}, Text: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Could not get auth token:', error.message);
      throw error;
    }
  }

  export default authTokenByPartner;
