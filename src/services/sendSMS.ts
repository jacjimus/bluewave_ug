
const AfricasTalking = require('africastalking');
const dotenv = require('dotenv');
dotenv.config();


const africastalking = AfricasTalking({
    apiKey: process.env.AFRICA_TALKING_API_KEY || '1718d7b52118cfef92bcc7bfb906ee258ed7c6bc420dd78c45b6328b99775c62',
    username: process.env.AFRICA_TALKING_USERNAME || 'sandbox'
});

async function sendSMS(phoneNumber: string, message: string) {

    const sms = africastalking.SMS
    const options = {
        from: "36667",
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