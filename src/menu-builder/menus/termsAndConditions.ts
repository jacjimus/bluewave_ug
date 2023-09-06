
import sendSMS  from '../../services/sendSMS'

export function termsAndConditions(menu: any, buildInput:any): void {
    menu.state('termsAndConditions', {
        run: async () => {
    
            const message = 'Visit [LINK TBC] to Terms & Conditions.';
            const to = buildInput.phoneNumber;

            const sms = await sendSMS(to, message);
            console.log("SMS", sms)

            menu.end('Visit [LINK TBC] to Terms & Conditions. A link will also be sent by SMS')
        },
    });

}