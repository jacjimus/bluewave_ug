
const AfricasTalking = require('africastalking');

const apiKey = "f16ecdd2d74c746296367b7f34dcebe7b9f14ab45cfb2113f3e86077f906bc98"
const username = "sandbox"
const africastalking = AfricasTalking({
    apiKey,
    username
});

async function sendSMS(phoneNumber: any, message: any) {

    const sms = africastalking.SMS
    const options = {
        from: 'BLUEWAVE',
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