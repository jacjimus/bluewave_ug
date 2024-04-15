import SMSMessenger from '../../services/sendSMS'


const termsAndConditions = async (args) => {
    let { msisdn, response } = args;

    msisdn = msisdn.startsWith('+') ? msisdn : `+${msisdn}`;

    const message = 'To view Terms and Conditions, visit Afyashua Ts & Cs https://rb.gy/g4hyk';
    const sms = await SMSMessenger.sendSMS(3,msisdn, message);
    console.log("SMS", sms)

    response = 'END Visit [LINK TBC] to view Terms & Conditions. A link will also be sent by SMS.'

    return response;

}

export default termsAndConditions;

