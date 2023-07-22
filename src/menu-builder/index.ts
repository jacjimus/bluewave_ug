
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

      if (!user) {
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
        let newSession = await Session.create({
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
          const districts = [
            "Central Region",
            "Kampala District",
            "Western Region",
            "Eastern Region",
            "Karamoja Region",
            "West Nile Region",
            "Northern Region"
          ];

          let message = 'Welcome to Hospital Finder!\nPlease enter your region:\n'
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

      menu.state('selectRegion', {
        run: () => {
          const region = parseInt(menu.val);
          console.log("REGION", region);
          const hospitalRegions =
          {
            1: [
              "Vision Medical Centre 9.Paramount Hospital",
              "Nkozi Hospital",
              "St. Monica Health Center",
              "Eunice Memorial Medical centre",
              "Dr Ambosoli Health Centre",
              "Adcare Medical Services",
              "Heart services Uganda Ltd",
              "Nsambya Hospital",
              "Paramount Hospital",
              "Welington Wellness Centre",
              "Mukwaya General Hospital",
              "Case Hospital",
              "Marie stopes Hospital",
              "Norvik Hospital",
              "Kampala Hospital",
              "International Hospital Kampala",
              "Bugolobi Medical Centre",
              "UMC Victoria Hospital",
              "Kyadondo Medical Centre",
              "Span medicare",
              "CTC Medical center",
              "Lubaga hospital",
              "Mengo Hospital",
              "Doctor's Medical Centre",
              "Millineum medical center",
              "Life Link Medical Centre",
              "Kampala West Medical Centre",
              "Vision Medical Centre",
              "Henrob Medical Centre"
            ],
            2: [
              "Adcare Medical Services",
              "Heart services Uganda Ltd",
              "Nsambya Hospital",
              "Paramount Hospital",
              "Welington Wellness Centre",
              "Mukwaya General Hospital",
              "Case Hospital",
              "Marie stopes Hospital",
              "Norvik Hospital",
              "Kampala Hospital",
              "International Hospital Kampala",
              "Bugolobi Medical Centre",
              "UMC Victoria Hospital",
              "Kyadondo Medical Centre",
              "Span medicare",
              "CTC Medical center",
              "Lubaga hospital",
              "Mengo Hospital",
              "Doctor's Medical Centre",
              "Millineum medical center",
              "Life Link Medical Centre",
              "Kampala West Medical Centre",
              "Vision Medical Centre",
              "Henrob Medical Centre"
            ],
            3: [
              "Migisha Clinic",
              "Rinamo Medical Centre",
              "Born Medical Centre",
              "Allied Medicare Services",
              "Masaka Regional Referra Hopital",
              "Kitovu hospital",
              "Beacof Medical Centre",
              "International Medical Center",
              "Kigezi Community Medical Centre",
              "Bushenyi Medical Centre",
              "KIU- Teaching Hospital",
              "Ibanda hospital-Kagongo",
              "Rugarama Hospital",
              "Kabale Hospital",
              "Bwindi Community Hospital",
              "Rugyeyo hospital",
              "Mutolere Hospital",
              "Kilembe Mines Hospital",
              "Kasese Hospital",
              "Fort portal regional hospital",
              "Kabarole Hospital",
              "True Vine Hospital",
              "Kiryadondo Hospital",
              "Migisha Clinic",
              "Life Link Medical Centre",
              "Kampala West Medical Centre",
              "Vision Medical Centre",
              "Henrob Medical Centre"
            ],
            4: [
              "Jonathan Medical Centre",
              "Suubi medical center",
              "Fastline Medical Center",
              "Santa Medical Centre",
              "Mercy  Health Center",
              "Dr Ambosoli Health Centre",
              "JK Pancrass Medical Centre",
              "Emram Doctor's clinic",
              "International Medical Centre",
              "Townside Clinic",
              "Divine Mercy Hospital",
              "International medical centre",
              "Kumi Hospital",
              "Masha Clinic",
              "Hope Charity Medicare",
              "Kamuli Mission Hospital(Lubaga)",
              "Crescent medical centre",
              "Emram Doctor's clinic",
              "Mercy  Health Center",
              "International Medical Centre",
              "Townside Clinic",
              "Divine Mercy Hospital",
              "International medical centre",
              "Kumi Hospital",
              "Masha Clinic",
              "Hope Charity Medicare"
            ],
            5: [
              "Amudat Hospital",
              "Rainbow Empirical Medical Centre",
              "Fitzmann Medical Services"
            ],
            6: [
              "Nebbi Hospital",
              "Nyapea Mission Hospital",
              "Pioneer Medical Centre Arua"
            ],
            7: [
              "St.Mary’s Lacor Hospital",
              "St John Paul Hospital",
              "Hope Charity Medicare",
              "Florence Nightingale Hospital",
              "St. Joseph’s Hospital",
              "St.Ambrosoli Kalongo hospital"
            ]
          }

          const selectedRegion = hospitalRegions[region];

          if (selectedRegion) {
            const hospitalsPerPage = 8;
            let page = 1;

            const displayHospitals = () => {
              const startIndex = (page - 1) * hospitalsPerPage;
              const endIndex = startIndex + hospitalsPerPage;
              const hospitalsToShow = selectedRegion.slice(startIndex, endIndex);

              let message = `Hospitals - Page ${page}:\n`;
              hospitalsToShow.forEach((hospital, index) => {
                message += `${index + 1}. ${hospital}\n`;
              });

              if (endIndex < selectedRegion.length) {
                message += '9. See More/n';
              }

              message += '0. Back';

              menu.con(message);
            };

            displayHospitals();
          } else {
            menu.con('No hospitals found for the selected region. Please choose a different region:');
          }
        },
        next: {
          '*\\d+': 'selectHospital',
          '0': 'chooseHospital',
          '9': 'seeMoreHospitals'
        }
      });

      menu.state('seeMoreHospitals', {
        run: () => {
          const selected = args.text

          console.log(" more REGION",selected );

          console.log("select region", selected)
          const input = selected.trim();
          const digits = input.split('*').map((digit) => parseInt(digit, 10));


          const secondLastDigit = digits[digits.length - 2];
          const lastDigit = digits[digits.length - 1];
          const hospitalRegions =
          {
            1: [
              "Vision Medical Centre 9.Paramount Hospital",
              "Nkozi Hospital",
              "St. Monica Health Center",
              "Eunice Memorial Medical centre",
              "Dr Ambosoli Health Centre",
              "Adcare Medical Services",
              "Heart services Uganda Ltd",
              "Nsambya Hospital",
              "Paramount Hospital",
              "Welington Wellness Centre",
              "Mukwaya General Hospital",
              "Case Hospital",
              "Marie stopes Hospital",
              "Norvik Hospital",
              "Kampala Hospital",
              "International Hospital Kampala",
              "Bugolobi Medical Centre",
              "UMC Victoria Hospital",
              "Kyadondo Medical Centre",
              "Span medicare",
              "CTC Medical center",
              "Lubaga hospital",
              "Mengo Hospital",
              "Doctor's Medical Centre",
              "Millineum medical center",
              "Life Link Medical Centre",
              "Kampala West Medical Centre",
              "Vision Medical Centre",
              "Henrob Medical Centre"
            ],
            2: [
              "Adcare Medical Services",
              "Heart services Uganda Ltd",
              "Nsambya Hospital",
              "Paramount Hospital",
              "Welington Wellness Centre",
              "Mukwaya General Hospital",
              "Case Hospital",
              "Marie stopes Hospital",
              "Norvik Hospital",
              "Kampala Hospital",
              "International Hospital Kampala",
              "Bugolobi Medical Centre",
              "UMC Victoria Hospital",
              "Kyadondo Medical Centre",
              "Span medicare",
              "CTC Medical center",
              "Lubaga hospital",
              "Mengo Hospital",
              "Doctor's Medical Centre",
              "Millineum medical center",
              "Life Link Medical Centre",
              "Kampala West Medical Centre",
              "Vision Medical Centre",
              "Henrob Medical Centre"
            ],
            3: [
              "Migisha Clinic",
              "Rinamo Medical Centre",
              "Born Medical Centre",
              "Allied Medicare Services",
              "Masaka Regional Referra Hopital",
              "Kitovu hospital",
              "Beacof Medical Centre",
              "International Medical Center",
              "Kigezi Community Medical Centre",
              "Bushenyi Medical Centre",
              "KIU- Teaching Hospital",
              "Ibanda hospital-Kagongo",
              "Rugarama Hospital",
              "Kabale Hospital",
              "Bwindi Community Hospital",
              "Rugyeyo hospital",
              "Mutolere Hospital",
              "Kilembe Mines Hospital",
              "Kasese Hospital",
              "Fort portal regional hospital",
              "Kabarole Hospital",
              "True Vine Hospital",
              "Kiryadondo Hospital",
              "Migisha Clinic",
              "Life Link Medical Centre",
              "Kampala West Medical Centre",
              "Vision Medical Centre",
              "Henrob Medical Centre"
            ],
            4: [
              "Jonathan Medical Centre",
              "Suubi medical center",
              "Fastline Medical Center",
              "Santa Medical Centre",
              "Mercy  Health Center",
              "Dr Ambosoli Health Centre",
              "JK Pancrass Medical Centre",
              "Emram Doctor's clinic",
              "International Medical Centre",
              "Townside Clinic",
              "Divine Mercy Hospital",
              "International medical centre",
              "Kumi Hospital",
              "Masha Clinic",
              "Hope Charity Medicare",
              "Kamuli Mission Hospital(Lubaga)",
              "Crescent medical centre",
              "Emram Doctor's clinic",
              "Mercy  Health Center",
              "International Medical Centre",
              "Townside Clinic",
              "Divine Mercy Hospital",
              "International medical centre",
              "Kumi Hospital",
              "Masha Clinic",
              "Hope Charity Medicare"
            ],
            5: [
              "Amudat Hospital",
              "Rainbow Empirical Medical Centre",
              "Fitzmann Medical Services"
            ],
            6: [
              "Nebbi Hospital",
              "Nyapea Mission Hospital",
              "Pioneer Medical Centre Arua"
            ],
            7: [
              "St.Mary’s Lacor Hospital",
              "St John Paul Hospital",
              "Hope Charity Medicare",
              "Florence Nightingale Hospital",
              "St. Joseph’s Hospital",
              "St.Ambrosoli Kalongo hospital"
            ]
          }

          const selectedRegion = hospitalRegions[secondLastDigit];

          console.log("secondLastDigit", secondLastDigit)
          console.log("lastDigit", lastDigit)
          console.log("selected hopital", selectedRegion,)

          if (selectedRegion) {
            const hospitalsPerPage = 8;
            let page = 2;

            const displayHospitals = () => {
              const startIndex = (page - 1) * hospitalsPerPage;
              const endIndex = startIndex + hospitalsPerPage;
              const hospitalsToShow = selectedRegion.slice(startIndex, endIndex);

              let message = `Hospitals - Page ${page}:\n`;
              hospitalsToShow.forEach((hospital, index) => {
                message += `${index + 8}. ${hospital}\n`;
              });

              if (endIndex < selectedRegion.length) {
                message += '9. See More/n';
              }

              message += '0. Back';

              menu.con(message);
            };

            displayHospitals();
          } else {
            menu.con('No hospitals found for the selected region. Please choose a different region:');
          }
        },
        next: {
          '*\\d+': 'selectHospital',
          '0': 'chooseHospital',
          '9': 'seeMoreHospitals'
        }
      });




      menu.state('selectHospital', {
        run: async() => {
          const selectedRegion = args.text
          console.log("select region", selectedRegion)
          const input = selectedRegion.trim();
          const digits = input.split('*').map((digit) => parseInt(digit, 10));


          const secondLastDigit = digits[digits.length - 2];
          const lastDigit = digits[digits.length - 1];

          // Now you have the second last digit and the last digit
          console.log("Second Last Digit:", secondLastDigit);
          console.log("Last Digit:", lastDigit);

          const hospitalRegions =
          {
            1: [
              "Vision Medical Centre",
              "Nkozi Hospital",
              "St. Monica Health Center",
              "Eunice Memorial Medical centre",
              "Dr Ambosoli Health Centre",
              "Adcare Medical Services",
              "Heart services Uganda Ltd",
              "Nsambya Hospital",
              "Paramount Hospital",
              "Welington Wellness Centre",
              "Mukwaya General Hospital",
              "Case Hospital",
              "Marie stopes Hospital",
              "Norvik Hospital",
              "Kampala Hospital",
              "International Hospital Kampala",
              "Bugolobi Medical Centre",
              "UMC Victoria Hospital",
              "Kyadondo Medical Centre",
              "Span medicare",
              "CTC Medical center",
              "Lubaga hospital",
              "Mengo Hospital",
              "Doctor's Medical Centre",
              "Millineum medical center",
              "Life Link Medical Centre",
              "Kampala West Medical Centre",
              "Henrob Medical Centre"
            ],
            2: [
              "Adcare Medical Services",
              "Heart services Uganda Ltd",
              "Nsambya Hospital",
              "Paramount Hospital",
              "Welington Wellness Centre",
              "Mukwaya General Hospital",
              "Case Hospital",
              "Marie stopes Hospital",
              "Norvik Hospital",
              "Kampala Hospital",
              "International Hospital Kampala",
              "Bugolobi Medical Centre",
              "UMC Victoria Hospital",
              "Kyadondo Medical Centre",
              "Span medicare",
              "CTC Medical center",
              "Lubaga hospital",
              "Mengo Hospital",
              "Doctor's Medical Centre",
              "Millineum medical center",
              "Life Link Medical Centre",
              "Kampala West Medical Centre",
              "Vision Medical Centre",
              "Henrob Medical Centre"
            ],
            3: [
              "Migisha Clinic",
              "Rinamo Medical Centre",
              "Born Medical Centre",
              "Allied Medicare Services",
              "Masaka Regional Referra Hopital",
              "Kitovu hospital",
              "Beacof Medical Centre",
              "International Medical Center",
              "Kigezi Community Medical Centre",
              "Bushenyi Medical Centre",
              "KIU- Teaching Hospital",
              "Ibanda hospital-Kagongo",
              "Rugarama Hospital",
              "Kabale Hospital",
              "Bwindi Community Hospital",
              "Rugyeyo hospital",
              "Mutolere Hospital",
              "Kilembe Mines Hospital",
              "Kasese Hospital",
              "Fort portal regional hospital",
              "Kabarole Hospital",
              "True Vine Hospital",
              "Kiryadondo Hospital",
              "Migisha Clinic",
              "Life Link Medical Centre",
              "Kampala West Medical Centre",
              "Vision Medical Centre",
              "Henrob Medical Centre"
            ],
            4: [
              "Jonathan Medical Centre",
              "Suubi medical center",
              "Fastline Medical Center",
              "Santa Medical Centre",
              "Mercy  Health Center",
              "Dr Ambosoli Health Centre",
              "JK Pancrass Medical Centre",
              "Emram Doctor's clinic",
              "International Medical Centre",
              "Townside Clinic",
              "Divine Mercy Hospital",
              "International medical centre",
              "Kumi Hospital",
              "Masha Clinic",
              "Hope Charity Medicare",
              "Kamuli Mission Hospital(Lubaga)",
              "Crescent medical centre",
              "Emram Doctor's clinic",
              "Mercy  Health Center",
              "International Medical Centre",
              "Townside Clinic",
              "Divine Mercy Hospital",
              "International medical centre",
              "Kumi Hospital",
              "Masha Clinic",
              "Hope Charity Medicare"
            ],
            5: [
              "Amudat Hospital",
              "Rainbow Empirical Medical Centre",
              "Fitzmann Medical Services"
            ],
            6: [
              "Nebbi Hospital",
              "Nyapea Mission Hospital",
              "Pioneer Medical Centre Arua"
            ],
            7: [
              "St.Mary’s Lacor Hospital",
              "St John Paul Hospital",
              "Hope Charity Medicare",
              "Florence Nightingale Hospital",
              "St. Joseph’s Hospital",
              "St.Ambrosoli Kalongo hospital"
            ]
          }

          const hospitals = hospitalRegions[secondLastDigit];
          const hospitalIndex = lastDigit - 1
          console.log("HOSPITAL", hospitals, hospitalIndex)

          if (hospitalIndex >= 0 && hospitalIndex < hospitals.length) {
              const selectedHospital = hospitals[hospitalIndex];
              console.log("SELECTED HOSPITAL", selectedHospital)
            // menu.con(`You selected: ${selectedHospital}\n\nPlease enter the hospital details:`);

              let hospitalList = {
                'Vision Medical Centre':{
                  address: "Wakaliga Road-Natete",
                  contactPerson:"Dr. Dan Zaake",
                  contact: "0704-768-939"
                },
                'Adcare Medical Services': {
                    address: "Near Ethiopian Village at the junction of the Italian Supermarket",
                    contactPerson:"Eton",
                    contact: "0705929944/0776-212-847"
                  
                },
              'Heart services Uganda Ltd':{
                address: "Kitgum House",
                contactPerson:"Florence",
                contact: "0757-934376/0785-580855"
              
            },
              'Nsambya Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Paramount Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Welington Wellness Centre':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Mukwaya General Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Case Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Marie stopes Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Norvik Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Kampala Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'International Hospital Kampala':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Bugolobi Medical Centre':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'UMC Victoria Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "St. Joseph'S Hospital - Wakiso":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Wakiso Health Centre IV - Wakiso':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "St Mary's Medical Center, Wakiso":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'St. Francis Mukono Medical Centre':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Crescent medical centre':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
               'International Medical Centre':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'International medical centre':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Allied Medicare Services':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Masaka Regional Referra Hopital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Kitovu hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'International Medical Center':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'St.Mary’s Lacor Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Pioneer Medical Centre Arua':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Rugarama Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            }, 
              'Kabale Hospital Private wing':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "Joy Medical Centre":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'St.Ambrosoli Kalongo hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'St. Joseph’s Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Florence Nightingale Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Hope Charity Medicare':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'St John Paul Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Nyapea Mission Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Nebbi Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Amudat Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Rainbow Empirical Medical Centre':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Fitzmann Medical Services':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Masha Clinic':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Kumi Hospital':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "Divine Mercy Hospital":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "Townside Clinic":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "Emram Doctor's clinic":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "Kamuli Mission Hospital(Lubaga)":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "JK Pancrass Medical Centre":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              'Dr Ambosoli Health Centre':{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "Mercy  Health Center":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "Santa Medical Centre":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "Fastline Medical Center":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "Suubi medical center":{
                address: "",
                contactPerson:"",
                contact: ""
              
            }, 
              "Jonathan Medical Centre":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "Kiryadondo Hospital":{
                address: "",
                contactPerson:"",
                contact: ""
              
            },
              "True Vine Hospital":{
                address: "",
                contactPerson:"",
                contact: ""
              
            }
            }

            if (hospitalList[selectedHospital]) {
              // Hospital found in the hospitalList, retrieve its details
              const hospitalDetails = hospitalList[selectedHospital];
              const { address, contactPerson, contact } = hospitalDetails;
              let user = await User.findOne({
                where: {
                  phone_number: args.phoneNumber
                }
               } )
              let updatePolicy = await Policy.update({
                hospital_details: {
                  hospital_name: selectedHospital,
                  hospital_address:address,
                  contact_person: contactPerson,
                  hospital_contact: contact
                }
              }, {
                where: {
                  user_id: user?.id
                }
              });
              console.log("updatePolicy", updatePolicy);
      
              menu.end(`Hospital Details:\nHospital: ${selectedHospital}\nAddress: ${address}\nContact Person: ${contactPerson}\nContact: ${contact}`);
            }

          } else {
            menu.con('Invalid selection. Please choose a valid hospital:');
          }
        },
        next: {
          '*\\d+': 'hospitalDetails',
          '0': 'selectRegion'
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
          menu.end(`Hospital: ${hospitalDetails.hospital_name}\nAddress: ${hospitalDetails.hospital_address}\nContact Person: ${hospitalDetails.contact_person}\nContact: ${hospitalDetails.hospital_contact}`);
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




