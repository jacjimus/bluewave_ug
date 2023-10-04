
import sendSMS  from '../../services/sendSMS'

export function termsAndConditions(menu: any, buildInput:any): void {
    menu.state('termsAndConditions', {
        run: async () => {

            
    
            const message = 'To view Medical cover Terms &Conditions Visit www.tclink.com ';
            const to = buildInput.phoneNumber;

            const sms = await sendSMS(to, message);
            console.log("SMS", sms)

            menu.end('Visit www.tclink.com to Terms & Conditions. A link will also be sent by SMS')
        },
    });

}