
import { RequestBody } from './typings/global'
import languages from './lang'
import configs from './configs'
import UssdMenu from 'ussd-builder'
import getUser from '../services/getUser';

import { startMenu } from './menus/startMenu';
import { displayInsuranceMenu } from './menus/displayInsuranceMenu';
import { displayMedicalCoverMenu } from './menus/displayMedicalCoverMenu';
import { termsAndConditions } from './menus/termsAndConditions';
import { displayAccount } from './menus/displayAccount';
import { buyForSelf } from './menus/buyForSelf';
import { displayFaqsMenu } from './menus/faqs';
import { buyForFamily } from './menus/buyForFamily';
import { myAccount } from './menus/myAccount';
import { payNow } from './menus/payNow';

require('dotenv').config()


let menu = new UssdMenu();

export default function (args: RequestBody, db: any) {
    return new Promise(async (resolve, reject) => {
        try {

            const Session = db.sessions;
            const User = db.users;

            //if  args.phoneNumber has a + then remove it
            if (args.phoneNumber.charAt(0) == "+") {

                args.phoneNumber = args.phoneNumber.substring(1);
            }

            // CHECK IF USER EXISTS
            let user = await User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            }) || await getUser(args.phoneNumber);


           // console.log("USER===", user);

            // BUILD INPUT VARIABLE
            let buildInput = {
                current_input: args.text,
                full_input: args.text, 
                masked_input: args.text,
                active_state: configs.start_state,
                sid: configs.session_prefix + args.sessionId,
                language: configs.default_lang,
                phone: args.phoneNumber,
                hash: "",
                user_id: user?.id


            }

            // CHECK IF SESSION EXISTS
            let session = await Session.findAll({
                where: {
                    sid: buildInput.sid
                }
            });


            if (session) {
                //console.log("session2", session);

                const [firstSession] = session;

                buildInput.active_state = firstSession?.active_state;
                buildInput.language = firstSession?.language;
                buildInput.full_input = firstSession?.full_input;
                buildInput.masked_input = firstSession?.masked_input;
                buildInput.hash = firstSession?.hash;
                buildInput.phone = firstSession?.phone;
                buildInput.user_id = firstSession?.user_id;
            } else {
                // CREATE NEW SESSION
                await Session.create({
                    sid: buildInput.sid,
                    active_state: buildInput.active_state,
                    language: buildInput.language,
                    full_input: buildInput.full_input,
                    masked_input: buildInput.masked_input,
                    hash: buildInput.hash,
                    phone_number: buildInput.phone,
                    user_id: buildInput.user_id
                });
            }

            // ===============SET MENU STATES============
            startMenu(menu);

            displayInsuranceMenu(menu);

            displayMedicalCoverMenu(menu);

            displayAccount(menu, args, db);

            //=================BUY FOR SELF=================

            buyForSelf(menu, args, db);

            //=================BUY FOR FAMILY=================

            buyForFamily(menu, args, db);

            //================MY ACCOUNT===================
            myAccount(menu, args, db);

            //==================PAY NOW===================
            payNow(menu, args, db);

            //==================FAQS===================
            displayFaqsMenu(menu);

            //===================TERMS AND CONDITIONS===================
            termsAndConditions(menu, args);



            // RUN THE MENU
            let menu_res = await menu.run(args);
            // RETURN THE MENU RESPONSE
            resolve(menu_res);
            return


        } catch (e) {
            console.log(e)
            // SOMETHING WENT REALLY WRONG
            reject("END " + languages[configs.default_lang].generic.fatal_error)
            return
        }

    });
}




