const AfricasTalking = require('africastalking');
const dotenv = require('dotenv');
dotenv.config();

const africastalking = AfricasTalking({
    apiKey: process.env.AFRICA_TALKING_API_KEY,
    username: process.env.AFRICA_TALKING_USERNAME
});


async function sendSMS(phoneNumber: string, message: string) {
    
    console.log("API KEY", process.env.AFRICA_TALKING_API_KEY, "USERNAME", process.env.AFRICA_TALKING_USERNAME);
    console.log("PHONE NUMBER", phoneNumber, "MESSAGE", message);

    const sms = africastalking.SMS
    const options = {
        from: process.env.AFRICA_TALKING_SHORTCODE,
        to: phoneNumber,
        message: message
    }

    try {
        const response = await sms.send(options)
        console.log(response);
    } catch (error) {
        console.log(error);
    }
}

export default sendSMS;