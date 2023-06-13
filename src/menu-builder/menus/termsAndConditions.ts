
import sendSMS  from '../../services/sendSMS'
import { isValidKenyanPhoneNumber } from '../../services/utils';

export function termsAndConditions(menu: any, buildInput:any): void {
    menu.state('termsAndConditions', {
        run: async () => {

        //change to kenya phone number format if not make to kenya format
        // if (!isValidKenyanPhoneNumber(buildInput.phone)) {
        //     buildInput.phone = `254${buildInput.phone.substring(1)}`;
            
        // }
        
        const to = `+${buildInput.phoneNumber}`;
        
        console.log(buildInput.phoneNumber, to)
            const message = 'Visit [LINK TBC] to Terms & Conditions. A link will also be sent by SMS';
            console.log(to)

            const sms = await sendSMS(to, message);

            menu.end('Visit [LINK TBC] to Terms & Conditions. A link will also be sent by SMS')
        },
    });

}