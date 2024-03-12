import SMSMessenger from '../../services/sendSMS'


const termsAndConditions = async (args) => {
    let { phoneNumber, response } = args;

    phoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    const message = 'To view Medical cover Terms &Conditions Visit https://rb.gy/g4hyk';
       await SMSMessenger.sendSMS(2,phoneNumber, message);

    response = 'END Visit https://rb.gy/g4hyk to Terms & Conditions. A link will also be sent by SMS'

    return response;

}

export default termsAndConditions;

