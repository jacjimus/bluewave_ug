import sendSMS from '../../services/sendSMS'


const termsAndConditions = async (args) => {
    let { phoneNumber,  response} = args;

           const message = 'To view Medical cover Terms &Conditions Visit www.tclink.com ';
            const sms = await sendSMS(phoneNumber, message);
            console.log("SMS", sms)

            response = 'END Visit www.tclink.com to Terms & Conditions. A link will also be sent by SMS'

         return response;

}

export default termsAndConditions;

