import sendSMS from '../../services/sendSMS'


const termsAndConditions = async (args) => {
    let { phoneNumber,  response} = args;

    phoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`; 

           const message = 'To view Terms and Conditions, visit Afyashua Ts & Cs https://rb.gy/g4hyk';
            const sms = await sendSMS(phoneNumber, message);
            console.log("SMS", sms)

            response = 'END Visit [LINK TBC] to view Terms & Conditions. A link will also be sent by SMS.'

         return response;

}

export default termsAndConditions;

