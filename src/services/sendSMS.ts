const AfricasTalking = require('africastalking');
const dotenv = require('dotenv');
dotenv.config();

const africastalking = AfricasTalking({
    apiKey: process.env.AFRICA_TALKING_API_KEY,
    username: process.env.AFRICA_TALKING_USERNAME
});

async function sendSMS(phoneNumber: string, message: string) {
    //add +256 to the phone number 
    phoneNumber = "+256" + phoneNumber

    console.log("PHONE NUMBER", phoneNumber, "MESSAGE", message);

    const sms = africastalking.SMS
    const options = {
        from: "BLUEWAVE",
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