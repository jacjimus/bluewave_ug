
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
            const Policy = db.policies;

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
                user_id: user?.id,
                partner_id: user?.partner_id


            }

            // CHECK IF SESSION EXISTS
            let session = await Session.findAll({
                where: {
                    sid: buildInput.sid
                }
            });

            if (!session) {
                
                // CREATE NEW SESSION
             let newSession =   await Session.create({
                    sid: buildInput.sid,
                    active_state: buildInput.active_state,
                    language: buildInput.language,
                    full_input: buildInput.full_input,
                    masked_input: buildInput.masked_input,
                    hash: buildInput.hash,
                    phone_number: buildInput.phone,
                    user_id: buildInput.user_id,
                    partner_id: buildInput.partner_id
                });

                console.log("newSession1", newSession);
            
            } else {
              console.log("session2", session);
              console.log("BUILD INPUT", buildInput)
              //UPDATE SESSION
              let updatedSession = await Session.update({
                active_state: buildInput.active_state,
                language: buildInput.language,
                full_input: buildInput.full_input,
                masked_input: buildInput.masked_input,  
                hash: buildInput.hash,
                phone_number: buildInput.phone,
                user_id: buildInput.user_id,
                partner_id: buildInput.partner_id
              }, {
                where: {
                  sid: buildInput.sid

                }
              });
              console.log("updatedSession", updatedSession);

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
            
                const hospitalRegions = {
                  "Kampala District": ["Mulago National Referral Hospital - Kampala", "Uganda Cancer Institute - Kampala"],
                  "Wakiso District": [],
                  "Mukono District": [],
                  "Jinja District": ["Jinja Regional Referral Hospital - Jinja"],
                  "Mbale District": ["Mbale Regional Referral Hospital - Mbale"],
                  "Masaka District": ["Masaka Regional Referral Hospital - Masaka"],
                  "Mbarara District": ["Mbarara Regional Referral Hospital - Mbarara"],
                  "Gulu District": ["Gulu Regional Referral Hospital - Gulu"],
                  "Arua District": ["Arua Regional Referral Hospital - Arua"],
                  "Kabale District": ["Kabale Regional Referral Hospital - Kabale"],
                  "Entebbe General Hospital - Entebbe": []
                };
            
                if (district in hospitalRegions) {
                  const hospitals = hospitalRegions[district];
            
                  if (hospitals.length > 0) {
                    let message = 'Select a hospital:\n';
                    hospitals.forEach((hospital, index) => {
                      message += `${index + 1}. ${hospital}\n`;
                    });
                    message += '0. Back';
            
                    menu.con(message);
                  } else {
                    menu.con('No hospitals found in the selected district. Please try a different district:');
                  }
                } else {
                  menu.con('Invalid district. Please enter a valid district:');
                }
              },
              next: {
                '*\\d+': 'hospitalDetails',
                '0': 'start'
              }
            });
            
            menu.state('hospitalDetails', {
              run: async () => {
                const hospitalIndex = parseInt(menu.val) - 1;
            
                let district = menu.val;
                console.log("district", district, hospitalIndex);
                const hospitalRegions = {
                  "Kampala District": ["Mulago National Referral Hospital - Kampala", "Uganda Cancer Institute - Kampala"],
                  "Wakiso District": [],
                  "Mukono District": [],
                  "Jinja District": ["Jinja Regional Referral Hospital - Jinja"],
                  "Mbale District": ["Mbale Regional Referral Hospital - Mbale"],
                  "Masaka District": ["Masaka Regional Referral Hospital - Masaka"],
                  "Mbarara District": ["Mbarara Regional Referral Hospital - Mbarara"],
                  "Gulu District": ["Gulu Regional Referral Hospital - Gulu"],
                  "Arua District": ["Arua Regional Referral Hospital - Arua"],
                  "Kabale District": ["Kabale Regional Referral Hospital - Kabale"],
                  "Entebbe General Hospital - Entebbe": []
                };
            
                district = Object.keys(hospitalRegions)[hospitalIndex];
                const hospitals = hospitalRegions[district];
                console.log("hospitals", hospitals);
            
                if (hospitals) {
                  const hospitalDetails = {
                    "Mulago National Referral Hospital - Kampala": {
                      address: "Mulago Hill P.O Box 7051, Kampala, Uganda",
                      contact: "+256-414-554008/1, admin@mulagohospital.go.com"
                    },
                    "Uganda Cancer Institute - Kampala": {
                      address: "Address B",
                      contact: "Contact B"
                    },
                    "Jinja Regional Referral Hospital - Jinja": {
                      address: "Rotary Rd, Jinja, Uganda",
                      contact: "Telephone, +256 43 4256431"
                    },
                    "Mbale Regional Referral Hospital - Mbale": {
                      address: "Address D",
                      contact: "Contact D"
                    },
                    "Masaka Regional Referral Hospital - Masaka": {
                      address: "Address E",
                      contact: "Contact E"
                    },
                    "Mbarara Regional Referral Hospital - Mbarara": {
                      address: "Address F",
                      contact: "Contact F"
                    },
                    "Gulu Regional Referral Hospital - Gulu": {
                      address: "Address G",
                      contact: "Contact G"
                    },
                    "Arua Regional Referral Hospital - Arua": {
                      address: "Address H",
                      contact: "Contact H"
                    },
                    "Kabale Regional Referral Hospital - Kabale": {
                      address: "Address I",
                      contact: "Contact I"
                    },
                    "Entebbe General Hospital - Entebbe": {
                      address: "Address J",
                      contact: "Contact J"
                    }
                  };
            
                  const selectedHospital = hospitals[hospitalIndex];
                  console.log("selectedHospital", selectedHospital);
                  const details = hospitalDetails[selectedHospital];
                  console.log("details", details);

                  let user = await User.findOne({
                    where: {
                      phone_number: args.phoneNumber
                    }
                  });
  

                  let updatePolicy = await Policy.update({
                    hospital_details: {
                      hospital_name: selectedHospital,
                      hospital_address: details.address,
                      hospital_contact: details.contact
                    }
                  }, {
                    where: {
                      user_id: user?.id
                    }
                  });
            console.log("updatePolicy", updatePolicy);
                  if (details) {
                    menu.end(`Hospital: ${selectedHospital}\nAddress: ${details.address}\nContact: ${details.contact}`);
                  } else {
                    menu.end(`Hospital details not found.`);
                  }
                } else {
                  menu.end(`Invalid hospital selection.`);
                }
              }
            });
            
            
      
            menu.state('myHospital', {
              run: async () => {
                let user = await User.findOne({
                  where: {
                    phone_number: args.phoneNumber
                  }
                });

                let policy = await Policy.findOne({
                  where: {
                    user_id: user?.id
                  }
                });

                const hospitalDetails = policy.hospital_details
                console.log("hospitalDetails", hospitalDetails);
                menu.end(`Hospital: ${hospitalDetails.hospital_name}\nAddress: ${hospitalDetails.hospital_address}\nContact: ${hospitalDetails.hospital_contact}`);
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




