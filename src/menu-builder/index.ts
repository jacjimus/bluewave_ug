
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
                const district = menu.val.toLowerCase(); // Convert district name to lowercase
            
                const hospitalRegions = {
                  "Kampala District": ["Mulago National Referral Hospital - Kampala", "Uganda Cancer Institute - Kampala"],
                  "Wakiso District": ["St. Joseph'S Hospital - Wakiso",'Wakiso Health Centre IV - Wakiso', "St Mary's Medical Center, Wakiso" ],
                  "Mukono District": ["Mukono Church Of Uganda Hospital", "Mukono General Hospital"],
                  "Jinja District": ["Jinja Regional Referral Hospital - Jinja"],
                  "Mbale District": ["Mbale Regional Referral Hospital - Mbale"],
                  "Masaka District": ["Masaka Regional Referral Hospital - Masaka"],
                  "Mbarara District": ["Mbarara Regional Referral Hospital - Mbarara"],
                  "Gulu District": ["Gulu Regional Referral Hospital - Gulu"],
                  "Arua District": ["Arua Regional Referral Hospital - Arua"],
                  "Kabale District": ["Kabale Regional Referral Hospital - Kabale"],
                  "Entebbe General Hospital - Entebbe": ["Bethany Women's and Family Hospital - Entebbe Branch", "Entebbe General Referral Hospital"]
                };
            
                const matchingRegions = Object.keys(hospitalRegions).filter(region => region.toLowerCase().startsWith(district.substring(0, 2)));
            
                if (matchingRegions.length > 0) {
                  let message = 'Select a hospital region:\n';
                  matchingRegions.forEach((region, index) => {
                    message += `${index + 1}. ${region}\n`;
                  });
                  message += '0. Back';
            
                  menu.con(message);
                } else {
                  menu.con('No hospital regions found with the given prefix. Please try a different prefix:');
                }
              },
              next: {
                '*\\d+': 'selectHospital',
                '0': 'chooseHospital'
              }
            });
            
            menu.state('chooseDistrict', {
              run: () => {
                const districts = [
                  "Kampala District",
                  "Wakiso District",
                  "Mukono District",
                  "Jinja District",
                  "Mbale District",
                  "Masaka District",
                  "Mbarara District",
                  "Gulu District",
                  "Arua District",
                  "Kabale District",
                  "Entebbe General Hospital - Entebbe"
                ];
            
                let message = 'Select a district:\n';
                districts.forEach((district, index) => {
                  message += `${index + 1}. ${district}\n`;
                });
                message += '0. Back';
            
                menu.con(message);
              },
              next: {
                '*\\d+': 'selectRegion',
                '0': 'chooseHospital'
              }
            });
            
            menu.state('selectHospital', {
              run: () => {
                const hospitalIndex = parseInt(menu.val) - 1;
            
                let district = menu.val;
                console.log("district", district, hospitalIndex);
                const hospitalRegions = {
                  "Kampala District": ["Mulago National Referral Hospital - Kampala", "Uganda Cancer Institute - Kampala"],
                  "Wakiso District": ["St. Joseph'S Hospital - Wakiso",'Wakiso Health Centre IV - Wakiso', "St Mary's Medical Center, Wakiso" ],
                  "Mukono District": ["Mukono Church Of Uganda Hospital", "Mukono General Hospital"],
                  "Jinja District": ["Jinja Regional Referral Hospital - Jinja"],
                  "Mbale District": ["Mbale Regional Referral Hospital - Mbale"],
                  "Masaka District": ["Masaka Regional Referral Hospital - Masaka"],
                  "Mbarara District": ["Mbarara Regional Referral Hospital - Mbarara"],
                  "Gulu District": ["Gulu Regional Referral Hospital - Gulu"],
                  "Arua District": ["Arua Regional Referral Hospital - Arua"],
                  "Kabale District": ["Kabale Regional Referral Hospital - Kabale"],
                  "Entebbe General Hospital - Entebbe": ["Bethany Women's and Family Hospital - Entebbe Branch", "Entebbe General Referral Hospital"]
                };
            
                district = Object.keys(hospitalRegions)[hospitalIndex];
                const hospitals = hospitalRegions[district];
                console.log("hospitals", hospitals);
            
                if (hospitals) {
                  let message = 'Select a hospital:\n';
                  hospitals.forEach((hospital, index) => {
                    message += `${index + 1}. ${hospital}\n`;
                  });
                  message += '0. Back';
            
                  menu.con(message);
                } else {
                  menu.con('No hospitals found in the selected district. Please try a different district:');
                }
              },
              next: {
                '*\\d+': 'hospitalDetails',
                '0': 'selectRegion'
              }
            });
            
            menu.state('hospitalDetails', {
              run: async () => {
                const hospitalIndex = parseInt(menu.val) - 1;
            
                let district = menu.val;
                console.log("district", district, hospitalIndex);
                const hospitalRegions = {
                  "Kampala District": ["Mulago National Referral Hospital - Kampala", "Uganda Cancer Institute - Kampala"],
                  "Wakiso District": ["St. Joseph'S Hospital - Wakiso",'Wakiso Health Centre IV - Wakiso', "St Mary's Medical Center, Wakiso" ],
                  "Mukono District": ["Mukono Church Of Uganda Hospital", "Mukono General Hospital"],
                  "Jinja District": ["Jinja Regional Referral Hospital - Jinja"],
                  "Mbale District": ["Mbale Regional Referral Hospital - Mbale"],
                  "Masaka District": ["Masaka Regional Referral Hospital - Masaka"],
                  "Mbarara District": ["Mbarara Regional Referral Hospital - Mbarara"],
                  "Gulu District": ["Gulu Regional Referral Hospital - Gulu"],
                  "Arua District": ["Arua Regional Referral Hospital - Arua"],
                  "Kabale District": ["Kabale Regional Referral Hospital - Kabale"],
                  "Entebbe General Hospital - Entebbe": ["Bethany Women's and Family Hospital - Entebbe Branch", "Entebbe General Referral Hospital"]
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
                      address: " Address: Plot 6, Lourdel Road, Nakasero P.O Box 7272, Kampala Uganda.",
                      contact: " Call Center Toll free 0800-100-066,  Phone: Tel: +256 417 712260 "
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
            
                  if (details) {
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
            
                    menu.end(`Hospital: ${selectedHospital}\nAddress: ${details.address}\nContact: ${details.contact}`);
                  } else {
                    menu.end(`Hospital details not found.`);
                  }
                } else {
                  menu.end(`Invalid hospital selection.`);
                }
              }
            });
            

             menu.state('myHospitalOption', {
              run: async () => {
                //ask if they want to change hospital or see details
                menu.con(`1. See Details
                2. Change Hospital

                0. Back
                00. Main Menu`);
              },
              next: {
                '1': 'myHospital',
                '2': 'chooseHospital',
                '0': 'account',
                '00': 'insurance',
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




