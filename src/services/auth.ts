
import axios from 'axios';
require('dotenv').config()


async function authToken() {
    try {
        let token: any;
    const inputBody = {
        "client_id": process.env.AIRTEL_CLIENT_ID,
        "client_secret": process.env.AIRTEL_CLIENT_SECRET,
        "grant_type": "client_credentials"
    };
    const headers = {
        'Content-Type': 'application/json',
        'Accept': '*/*'
    };

    const AUTH_TOKEN_URL = process.env.AIRTEL_AUTH_TOKEN_URL;
    await axios.post( AUTH_TOKEN_URL, inputBody, { headers })
        .then(response => {
            console.log(response.data);
            token = response.data.access_token;
            console.log("TOKEN", token)
        })
        .catch(error => {
            console.error(error)
        })

        return token;
    } catch (error) {
        console.log(error)
        throw new Error(error)
    }
}


export default authToken;
