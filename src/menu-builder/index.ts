
import { RequestBody } from './typings/global'
import languages from './lang'
import configs from './configs'
import UssdMenu from 'ussd-builder'
//import getUser from '../services/getAirtelUser';

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
            }) 
            if(!user){
               throw new Error("User not found");
            }

            //|| await getAirtelUser(args.phoneNumber);


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

            menu.state('chooseHospital', {
                run: () => {
                  menu.con('Welcome to Hospital Finder!\nPlease enter your district:');
                },
                next: {
                  '*': 'selectRegion'
                }
              });
              
              menu.state('selectRegion', {
                run: () => {
                  const district = menu.val;
                  
                //example of a district is "Kampala"
                let regions = ['Central', 'Eastern', 'Northern', 'Western'];

                let hospitalRegions = {
                    "Central": ["Kampala", "Mukono", "Wakiso", "Mityana", "Mpigi", "Buikwe", "Kayunga", "Buvuma", "Nakaseke", "Nakasongola", "Luwero"],
                    "Eastern": ["Mbale", "Soroti", "Tororo", "Kumi", "Kapchorwa", "Moroto", "Katakwi", "Kaberamaido", "Kotido", "Nakapiripirit", "Bukedea", "Budaka", "Bukwo", "Pallisa", "Amuria", "Bulambuli", "Kween", "Ngora", "Serere", "Butebo", "Kaliro", "Busia", "Bugiri", "Iganga", "Namayingo", "Jinja", "Mayuge", "Kamuli", "Buyende", "Luuka", "Kaliro"],
                    "Northern": ["Gulu", "Lira", "Kitgum", "Arua", "Kotido", "Moroto", "Nebbi", "Yumbe", "Koboko", "Adjumani", "Moyo", "Maracha", "Zombo", "Pakwach", "Nwoya", "Amuru", "Agago", "Lamwo", "Pader", "Amudat", "Kaabong", "Abim", "Napak", "Karenga", "Kapelebyong", "Amuria", "Otuke", "Alebtong", "Dokolo", "Kole", "Oyam", "Amolatar", "Apac", "Kiryandongo", "Masindi", "Buliisa", "Hoima", "Kiryandongo", "Kibaale", "Kagadi", "Kakumiro", "Buliisa", "Ntoroko", "Kyegegwa", "Kiboga", "Kyankwanzi", "Kyenjojo", "Kyegegwa", "Kibale", "Kagadi", "Kakumiro", "Bunyangabu", "Kikuube", "Kiryandongo", "Kibaale", "Kagadi", "Kakumiro", "Buliisa", "Ntoroko", "Kyegegwa", "Kiboga", "Kyankwanzi", "Kyenjojo", "Kyegegwa", "Kibale", "Kagadi", "Kakumiro", "Bunyangabu", "Kikuube"],
                    "Western": ["Kasese", "Kabarole", "Kamwenge", "Bundibugyo", "Kyenjojo", "Kyegegwa", "Ntoroko", "Kyegegwa", "Kiboga", "Kyankwanzi", "Kyenjojo", "Kyegegwa", "Kibale", "Kagadi", "Kakumiro", "Bunyangabu", "Kikuube", "Kiryandongo", "Masindi", "Buliisa", "Hoima", "Kiryandongo", "Kibaale", "Kagadi", "Kakumiro", "Buliisa", "Ntoroko", "Kyegegwa", "Kiboga", "Kyankwanzi", "Kyenjojo", "Kyegegwa", "Kibale", "Kagadi", "Kakumiro", "Bunyangabu", "Kikuube", "Kiryandongo", "Masindi", "Buliisa", "Hoima", "Kiryandongo", "Kibaale", "Kagadi", "Kakumiro", "Buliisa", "Ntoroko", "Kyegegwa", "Kiboga", "Kyankwanzi", "Kyenjojo", "Kyegegwa", "Kibale", "Kagadi", "Kakumiro", "Bunyangabu", "Kikuube"]
                }
                //check if the district is in the regions 


                  // Here you can query your database or an API to get the hospitals in the specified district and region.
                  // Assuming you have the hospitals data, you can display a list of options for the user to choose from.
                  const hospitals = ['Hospital A', 'Hospital B', 'Hospital C'];
                  
                  let message = 'Select a hospital:\n';
                  hospitals.forEach((hospital, index) => {
                    message += `${index + 1}. ${hospital}\n`;
                  });
                  message += '0. Back';
              
                  menu.con(message);
                },
                next: {
                  '*\\d+': 'hospitalDetails',
                  '0': 'start'
                }
              });
              
              menu.state('hospitalDetails', {
                run: () => {
                  const hospitalIndex = parseInt(menu.val) - 1;
                  const hospitals = ['Hospital A', 'Hospital B', 'Hospital C'];
                  const selectedHospital = hospitals[hospitalIndex];
              
                  // Assuming you have the hospital details, you can display them to the user
                  const hospitalDetails = {
                    "Hospital A": {
                      address: "Address A",
                      contact: "Contact A"
                    },
                    "Hospital B": {
                      address: "Address B",
                      contact: "Contact B"
                    },
                    "Hospital C": {
                      address: "Address C",
                      contact: "Contact C"
                    }
                  };
              
                  menu.end(`Hospital: ${selectedHospital}\nAddress: ${hospitalDetails[selectedHospital].address}\nContact: ${hospitalDetails[selectedHospital].contact}`);
                }
              });
              
              menu.state('start', {
                run: () => {
                  menu.end('Thank you for using Hospital Finder. Goodbye!');
                }
              });
              
              menu.state('myHospital', {
                run: () => {
                    const hospitalDetails = {
                        "Hospital A": {
                          address: "Address A",
                          contact: "Contact A"
                        },
                      };
                  
                      menu.end(`Hospital: ${"Hospital A"}\nAddress: ${hospitalDetails["Hospital A"].address}\nContact: ${hospitalDetails["Hospital A"].contact}`);
                }
              });
              



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




