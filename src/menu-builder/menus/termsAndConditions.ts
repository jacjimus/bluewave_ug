
import sendSMS  from '../../services/sendSMS'
export function termsAndConditions(menu: any, buildInput:any): void {
    menu.state('termsAndConditions', {
        run: async () => {
            const to = '254' + buildInput.phone.substring(1);
            const message = 'Visit [LINK TBC] to Terms & Conditions. A link will also be sent by SMS';

            const sms = await sendSMS(to, message);

            menu.end('Visit [LINK TBC] to Terms & Conditions. A link will also be sent by SMS')
        },
    });

}