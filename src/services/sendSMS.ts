const AfricasTalking = require('africastalking');
const dotenv = require('dotenv');
dotenv.config();

class SMSMessenger {
  static africastalking = AfricasTalking({
    apiKey: process.env.AFRICA_TALKING_API_KEY,
    username: process.env.AFRICA_TALKING_USERNAME,
  });

  static async sendSMS(phoneNumber, message) {
    const sms = SMSMessenger.africastalking.SMS;
    const options = {
      from: process.env.AFRICA_TALKING_SHORTCODE,
      to: phoneNumber,
      message: message,
    };

    console.log('AFRICASLKING OPTIONS ',options);
    try {
      const response = await sms.send(options);
      console.log('AFRICASLKING RESPONSE ',response);
    } catch (error) {
      console.log("AFRICASTALKING ERR ",error);
    }
  }
}

export default SMSMessenger;
