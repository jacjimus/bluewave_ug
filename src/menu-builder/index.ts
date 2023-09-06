import { RequestBody } from "./typings/global";
import languages from "./lang";
import configs from "./configs";
import UssdMenu from "ussd-builder";
import crypto from "crypto";

import getAirtelUser from "../services/getAirtelUser";

import { startMenu } from "./menus/startMenu";
import { displayInsuranceMenu } from "./menus/displayInsuranceMenu";
import { displayMedicalCoverMenu } from "./menus/displayMedicalCoverMenu";
import { termsAndConditions } from "./menus/termsAndConditions";
import { displayAccount } from "./menus/displayAccount";
import { buyForSelf } from "./menus/buyForSelf";
import { displayFaqsMenu } from "./menus/faqs";
import { buyForFamily } from "./menus/buyForFamily";
import { myAccount } from "./menus/myAccount";
import { payNow } from "./menus/payNow";



require("dotenv").config();

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

    console.log(args.phoneNumber)
    let userPhoneNumber = args.phoneNumber;
    //if args.phoneNumber is 12 digit remove the first three country code
    if (args.phoneNumber.length == 12) {
     userPhoneNumber = args.phoneNumber.substring(3);
     args.phoneNumber = userPhoneNumber;
    }
    

    const userKyc = await getAirtelUser(userPhoneNumber, "UG", "UGX", 2)
    console.log("USER KYC", userKyc)

    async function getUser(phoneNumber: any) {
      return await User.findOne({
        where: {
          phone_number: phoneNumber,
        },
      });
    }

    // Retrieve user using provided phone number
    const user = await getUser(userPhoneNumber);

    if (!user) {
      throw new Error("User not found");
    }

    // Function to generate a SHA-256 hash
    const generateHash = (data) => {
      const hash = crypto.createHash('sha256');
      hash.update(data);
      return hash.digest('hex');
    };
    

    const buildInput = {
      current_input: args.text,
      full_input: args.text,
      masked_input: args.text,
      active_state: configs.start_state,
      sid: configs.session_prefix + args.sessionId,
      language: configs.default_lang,
      phone_number: args.phoneNumber,
      hash: "",
      user_id: user.user_id,
      partner_id: user.partner_id,
    };

    const hashData = `${buildInput.sid}${buildInput.user_id}${buildInput.partner_id}`;
const generatedHash = generateHash(hashData);

// Set the generated hash in the buildInput object
//buildInput.hash = generatedHash;
    // Check if session exists
    let session = await Session.findOne({
      where: {
        sid: buildInput.sid,
      },
    });

    if (!session) {
      // Create new session
      session = await Session.create(buildInput);
      console.log("New Session:", session);
    } else {
      // Update existing session
      await Session.update(buildInput, {
        where: {
          sid: buildInput.sid,
        },
      });
      console.log("Updated Session:", session);
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

      menu.state("chooseHospital", {
        run: () => {
          const districts = [
            "Central Region",
            "Western Region",
            "Eastern Region",
            "Karamoja Region",
            "West Nile Region",
            "Northern Region",
          ];

          let message =
            "Welcome to Hospital Finder!\nPlease enter your region:\n";
          districts.forEach((district, index) => {
            message += `${index + 1}. ${district}\n`;
          });
          message += "0. Back";

          menu.con(message);
        },
        next: {
          "*\\d+": "selectRegion",
          "0": "chooseHospital",
        },
      });

      menu.state("selectRegion", {
        run: () => {
          const region = parseInt(menu.val);
          console.log("REGION", region);
          const hospitalRegions = {
            //central region
            1: [
              "Joy Medical Centre",
              "Grand Medical Centre",
              "St. Francis Mukono Medical Centre",
              "St. Francis Naggalama Hospital",
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
              "Henrob Medical Centre",
            ],
            2: [
              //western region
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
              "Kabale Hospital Private wing",
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
              "Nyakatare Health Centre III",
              "St. Karoil Lwanga Nyakibale Hospital",
            ],
            3: [
              //eastern region
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
            ],
            4: [
              "Amudat Hospital",
              "Rainbow Empirical Medical Centre",
              "Fitzmann Medical Services",
            ],
            5: [
              "Nebbi Hospital",
              "Nyapea Mission Hospital",
              "Pioneer Medical Centre Arua",
            ],
            6: [
              "St.Mary’s Lacor Hospital",
              "St John Paul Hospital",
              "Hope Charity Medicare",
              "Florence Nightingale Hospital",
              "St. Joseph’s Hospital",
              "St.Ambrosoli Kalongo hospital",
            ],
          };

          const selectedRegion = hospitalRegions[region];

          if (selectedRegion) {
            const hospitalsPerPage = 8;
            let page = 1;

            const displayHospitals = () => {
              const startIndex = (page - 1) * hospitalsPerPage;
              const endIndex = startIndex + hospitalsPerPage;
              const hospitalsToShow = selectedRegion.slice(
                startIndex,
                endIndex
              );

              let message = `Hospitals - Page ${page}:\n`;
              hospitalsToShow.forEach((hospital, index) => {
                message += `${index + 1}. ${hospital}\n`;
              });

              if (endIndex < selectedRegion.length) {
                message += "9. See More/n";
              }

              message += "0. Back";

              menu.con(message);
            };

            displayHospitals();
          } else {
            menu.con(
              "No hospitals found for the selected region. Please choose a different region:"
            );
          }
        },
        next: {
          "*\\d+": "selectHospital",
          "0": "chooseHospital",
          "9": "seeMoreHospitals",
        },
      });

      menu.state("seeMoreHospitals", {
        run: () => {
          const selected = args.text;

          console.log(" more REGION", selected);

          console.log("select region", selected);
          const input = selected.trim();
          const digits = input.split("*").map((digit) => parseInt(digit, 10));

          function check9AppearsTwice(digits) {
            return digits.filter((digit) => digit === 9).length === 2;
          }
          const result = check9AppearsTwice(digits);
          let secondLastDigit = digits[digits.length - 2];
          console.log("result", result);
          if (result) {
            secondLastDigit = digits[digits.length - 3];
          }
          const lastDigit = digits[digits.length - 1];
          const hospitalRegions = {
            //central region
            1: [
              "Joy Medical Centre",
              "Grand Medical Centre",
              "St. Francis Mukono Medical Centre",
              "St. Francis Naggalama Hospital",
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
              "Henrob Medical Centre",
            ],
            2: [
              //western region
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
              "Kabale Hospital Private wing",
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
              "Nyakatare Health Centre III",
              "St. Karoil Lwanga Nyakibale Hospital",
            ],
            3: [
              //eastern region

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
            ],
            4: [
              "Amudat Hospital",
              "Rainbow Empirical Medical Centre",
              "Fitzmann Medical Services",
            ],
            5: [
              "Nebbi Hospital",
              "Nyapea Mission Hospital",
              "Pioneer Medical Centre Arua",
            ],
            6: [
              "St.Mary’s Lacor Hospital",
              "St John Paul Hospital",
              "Hope Charity Medicare",
              "Florence Nightingale Hospital",
              "St. Joseph’s Hospital",
              "St.Ambrosoli Kalongo hospital",
            ],
          };

          const selectedRegion = hospitalRegions[secondLastDigit];

          console.log("secondLastDigit", secondLastDigit);
          console.log("lastDigit", lastDigit);
          console.log("selected hopital", selectedRegion);

          if (selectedRegion) {
            let hospitalsPerPage = 8;
            let page = 2;
            if (result) {
              //hospitalsPerPage =
              page = 3;
            }

            const displayHospitals = () => {
              const startIndex = (page - 1) * hospitalsPerPage;
              const endIndex = startIndex + hospitalsPerPage;
              const hospitalsToShow = selectedRegion.slice(
                startIndex,
                endIndex
              );

              let message = `Hospitals - Page ${page}:\n`;
              hospitalsToShow.forEach((hospital, index) => {
                message += `${index + 1}. ${hospital}\n`;
              });

              if (endIndex < selectedRegion.length) {
                message += "9. See More/n";
              }

              message += "0. Back";

              menu.con(message);
            };

            displayHospitals();
          } else {
            menu.con(
              "No hospitals found for the selected region. Please choose a different region:"
            );
          }
        },
        next: {
          "*\\d+": "selectHospital",
          "0": "chooseHospital",
          "9": "seeMoreHospitals",
        },
      });

      menu.state("selectHospital", {
        run: async () => {
          const selectedRegion = args.text;
          console.log("select region", selectedRegion);
          const input = selectedRegion.trim();
          const digits = input.split("*").map((digit) => parseInt(digit, 10));
          console.log("digits", digits, digits.includes(9));
          function check9AppearsTwice(digits) {
            return digits.filter((digit) => digit === 9).length === 2;
          }
          const result = check9AppearsTwice(digits);

          console.log("result", result);

          let secondLastDigit = digits[digits.length - 2];
          if (digits.includes(9)) {
            secondLastDigit = digits[digits.length - 3];
          }
          if (result) {
            secondLastDigit = digits[digits.length - 4];
          }
          const lastDigit = digits[digits.length - 1];

          // Now you have the second last digit and the last digit
          console.log("Second Last Digit:", secondLastDigit);
          console.log("Last Digit:", lastDigit);

          const hospitalRegions = {
            //central region
            1: [
              "Joy Medical Centre",
              "Grand Medical Centre",
              "St. Francis Mukono Medical Centre",
              "St. Francis Naggalama Hospital",
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
              "Henrob Medical Centre",
            ],
            2: [
              //western region
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
              "Kabale Hospital Private wing",
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
              "Nyakatare Health Centre III",
              "St. Karoil Lwanga Nyakibale Hospital",
            ],
            3: [
              //eastern region
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
            ],
            4: [
              "Amudat Hospital",
              "Rainbow Empirical Medical Centre",
              "Fitzmann Medical Services",
            ],
            5: [
              "Nebbi Hospital",
              "Nyapea Mission Hospital",
              "Pioneer Medical Centre Arua",
            ],
            6: [
              "St.Mary’s Lacor Hospital",
              "St John Paul Hospital",
              "Hope Charity Medicare",
              "Florence Nightingale Hospital",
              "St. Joseph’s Hospital",
              "St.Ambrosoli Kalongo hospital",
            ],
          };

          const hospitals = hospitalRegions[secondLastDigit];
          let hospitalIndex = lastDigit - 1;
          if (digits.includes(9)) {
            hospitalIndex = lastDigit + 7;
          }
          if (result) {
            hospitalIndex = lastDigit + 15;
          }
          console.log("HOSPITAL", hospitals, hospitalIndex);

          if (hospitalIndex >= 0 && hospitalIndex < hospitals.length) {
            const selectedHospital = hospitals[hospitalIndex];
            console.log("SELECTED HOSPITAL", selectedHospital);
            // menu.con(`You selected: ${selectedHospital}\n\nPlease enter the hospital details:`);

            let hospitalList = {
              "Rinamo Medical Centre": {
                address: "Kakumiro town",
                contactPerson: "Crissy",
                contact: "0774-725761/0705-200-275",
              },
              "Born Medical Centre": {
                address: "P. O. Box 18, Lyantonde",
                contactPerson: "Dr. Kizza Isaiah",
                contact: "0772-495779/0701-462-459",
              },
              "Beacof Medical Centre": {
                address: "Sembabule Town",
                contactPerson: "Dr Asuman",
                contact: "0779-147033",
              },
              "Nkozi Hospital": {
                address: "P.O Box 4349,Kampala",
                contactPerson: "Dr. Criscent",
                contact: "0776-738-723",
              },

              "Vision Medical Centre": {
                address: "Wakaliga Road-Natete",
                contactPerson: "Dr. Dan Zaake",
                contact: "0704-768-939",
              },
              "Adcare Medical Services": {
                address:
                  "Near Ethiopian Village at the junction of the Italian Supermarket",
                contactPerson: "Eton",
                contact: "0705929944/0776-212-847",
              },
              "Heart services Uganda Ltd": {
                address: "Kitgum House",
                contactPerson: "Florence",
                contact: "0757-934376/0785-580855",
              },
              "Nsambya Hospital": {
                address: "Plot 57 Nsambya-Ggaba road",
                contactPerson: "Rose",
                contact: "0701-417-478",
              },
              "Paramount Hospital": {
                address: "Gadaffi Road",
                contactPerson: "Dr. Simon Begumisa",
                contact: "0700 873155",
              },
              "Welington Wellness Centre": {
                address: "Medical Hub Yusuf Lule road next to Fairway Hotel",
                contactPerson: "Hellen Nabwire",
                contact: "0776-832-820/0393-217-854",
              },
              "Mukwaya General Hospital": {
                address: "Opp. American Embassy",
                contactPerson: "Elijah Semalulu",
                contact: "0702-132 123 / 0788-268 682",
              },
              "Case Hospital": {
                address: "Opp. American Embassy",
                contactPerson: "Elijah Semalulu",
                contact: "0702-132 123 / 0788-268 682",
              },
              "Marie stopes Hospital": {
                address: "Forest mall",
                contactPerson: "Dorcus",
                contact: "0775 274373",
              },
              "Norvik Hospital": {
                address: "Kampala road",
                contactPerson: "Isaac",
                contact: "0704-143507",
              },
              "Kampala Hospital": {
                address: "Kampala road",
                contactPerson: "Isaac",
                contact: "0704-143507",
              },
              "International Hospital Kampala": {
                address: "0312 200 400/0752-966-812/0753-242-688",
                contactPerson: "Herbert Mukova",
                contact: "Namuwongo",
              },
              "Bugolobi Medical Centre": {
                address: "Bugolobi",
                contactPerson: "Owor Gilbert",
                contact: "0777 717034",
              },
              "UMC Victoria Hospital": {
                address: "Bukoto. P.O Box 72587 Kampala",
                contactPerson: "Dr.Jjuko",
                contact: "0773-42203",
              },
              "St. Joseph'S Hospital - Wakiso": {
                address: "Mission Road Nyenyiki Village",
                contactPerson: "Dr.Pamela Atim/Robert",
                contact: "0772-591493/0772-054-72",
              },

              "St. Francis Mukono Medical Centre": {
                address: "Mukono Ssaza Road",
                contactPerson: "Marris Nakayaga",
                contact: "0782 884415",
              },
              "Crescent medical centre": {
                address: "Jinja Town",
                contactPerson: "Abdallah/ Ssjjabi",
                contact: "0702 678240/0702 417284",
              },
              "International Medical Centre": {
                address: "Plot 14 Circular Road",
                contactPerson: "Joseph Nyanzi/ Agasha Carol",
                contact: "0434-122-499 /0712-856-200/ 0712-484-846",
              },
              "International medical centre": {
                address: "Mbale town",
                contactPerson: "Slyvia",
                contact: "0781 221 703/0392 000 054",
              },
              "Allied Medicare Services": {
                address: "Pliot 5 Elgin Road Masaka",
                contactPerson: "Bawakanya Stephen",
                contact: "0702-427-668",
              },
              "Masaka Regional Referra Hopital": {
                address: "Makaka",
                contactPerson: "Dr. Dada/Dr. Nathan/Beatrice/Ronald",
                contact: "0782-017098/0772-433809/0781-141-755/0776-977-114",
              },
              "Kitovu hospital": {
                address: "Kitovu",
                contactPerson: "Jude/Sr Pauline",
                contact: "0756-440-056/0752-556-712/0702-683461",
              },
              "International Medical Center": {
                address: "Mbarara complex building -Mbaguta street",
                contactPerson: "Dr. Lubega Paul/Scovia Eryenyu",
                contact: "0393 - 280- 696",
              },

              "St.Mary’s Lacor Hospital": {
                address: "Gulu",
                contactPerson: "Mrs. Iris/Beatrice/Jackie",
                contact: "0471-432-310/0772-365-480/0787-576-636/0777-326438",
              },

              "Pioneer Medical Centre Arua": {
                address: "P.O BOX 1124 KOBOKO",
                contactPerson: "Dr. Aldo Pariyo",
                contact: "0392 961427",
              },

              "Rugarama Hospital": {
                address: "Kabale town",
                contactPerson: "Dr. Gilbert Mateeka",
                contact: "0486-422-628/0773-455618",
              },

              "Kabale Hospital Private wing": {
                address: "Kabale town",
                contactPerson: "Justus",
                contact: "0775-273-584",
              },

              "Joy Medical Centre": {
                address: "P.O BOX 12723, OPP TOTAL PETROL STATION",
                contactPerson: "Mutesi Esther",
                contact: "0414-383151/0752-827-024",
              },

              "St.Ambrosoli Kalongo hospital": {
                address: "Mission Ward, Kalongo Town Council",
                contactPerson: "Sr Pamela/Ojok",
                contact: "0772-323072/0782840036",
              },

              "St. Joseph’s Hospital": {
                address: "Mission Road Nyenyiki Village",
                contactPerson: "Dr.Pamela Atim/Robert",
                contact: "0772-591493/0772-054-72",
              },

              "Florence Nightingale Hospital": {
                address: "Apac town, P.O BOX 20",
                contactPerson: "Sr. Margaret/Okello Dickson",
                contact: "0772-539-049/0773-875-601",
              },

              "Hope Charity Medicare": {
                address: "Amolatar",
                contactPerson: "Aloka Bonny Obongi",
                contact: "0782 807490",
              },

              "St John Paul Hospital": {
                address: "Oyam town",
                contactPerson: "Sarah",
                contact: "0780 590859",
              },

              "Nyapea Mission Hospital": {
                address: "Paidha /Zombo",
                contactPerson: "Dr Omara ",
                contact: "0783-725018",
              },
              "Nebbi Hospital": {
                address: "Nebbi town",
                contactPerson: "Peace Nikum",
                contact: "0784 219998",
              },

              "Amudat Hospital": {
                address: "Amudat, P.O Box 44 Moroto",
                contactPerson: "Dr. Jane",
                contact: "0782187876",
              },

              "Rainbow Empirical Medical Centre": {
                address: " Huzafrans House Plot 9 Jie Road Campswahili Juu",
                contactPerson: " Dr. Paul Olong",
                contact: " 0750-584045 ",
              },
              "Fitzmann Medical Services": {
                address: "Former mariestopes offices",
                contactPerson: "Dr. Nuwagaba Charles",
                contact: "0774 309 908",
              },
              "Masha Clinic": {
                address: "Plot 5 Chemonges Road",
                contactPerson: "Dr. Boyo Alfred",
                contact: "0772 984 947",
              },
              "Kumi Hospital": {
                address: "P.O BOX 09, Ongino",
                contactPerson: "Dr. Robert",
                contact: "0776-221443",
              },
              "Divine Mercy Hospital": {
                address: "Tororo",
                contactPerson: "Dr. Josue",
                contact: "0772413166",
              },
              "Townside Clinic": {
                address: "Jinja Town",
                contactPerson: "Abdallah/ Ssjjabi",
                contact: "0702 678240/0702 417284",
              },
              "Emram Doctor's clinic": {
                address: "Dr. Tusiime Emmanuel",
                contactPerson: "Dr. Tusiime Emmanuel",
                contact: "0773-375551",
              },
              "Kamuli Mission Hospital(Lubaga)": {
                address: "P.O BOX 99, Kamuli town",
                contactPerson: "Ronald",
                contact: "0774-187-499/0755-187-499",
              },
              "JK Pancrass Medical Centre": {
                address: "Mayuge Town Council, Kaguta Rd",
                contactPerson: "Dr. Joseph",
                contact: "0774 931798",
              },
              "Dr Ambosoli Health Centre": {
                address:
                  "Kaliro Town council, Munayeka Rd near Kaliro High school",
                contactPerson: "Dr Ambrose/Bruno",
                contact: "0782-867978/0785-083-087",
              },
              "Mercy  Health Center": {
                address: "Plot 7/9 bulamu Iganda",
                contactPerson: "Innocent Mugabi",
                contact: "0703-895-928",
              },
              "Santa Medical Centre": {
                address: "Namayingo Town",
                contactPerson: "Dr John Paul",
                contact: "0788-322099",
              },
              "Fastline Medical Center": {
                address: "Plot 99 Kaune Wakooli Road",
                contactPerson: "Dr. Isabirye Stephen",
                contact: "0772 664318 /0783 375332",
              },
              "Suubi medical center": {
                address: "Kayunga Town Council",
                contactPerson: "Mpooya Simon",
                contact: "0772-670-744",
              },
              "Jonathan Medical Centre": {
                address: "Hospital lane next to Umeme Offices ",
                contactPerson: "Patrick/Kakooza",
                contact: "0756-649-688/0706-730-664",
              },
              "Kiryadondo Hospital": {
                address: "Kiryandongo town center",
                contactPerson: "Dr. Gamel",
                contact: "0782-506-093",
              },
              "True Vine Hospital": {
                address: "Mubende municipality. P.O. Box 1665 Masaka  ",
                contactPerson: "Dr. Emmanuel",
                contact: "0704 284351",
              },
              "Grand Medical Centre": {
                address: "Kira Town",
                contactPerson: "Ronald",
                contact: "0772-713816",
              },
              "St. Francis Naggalama Hospital": {
                address: "P.O Box-22004, Naggalama",
                contactPerson: "Sr Jane Frances/Francis",
                contact: "0392-702-709/0772-593-665/0776-880-211",
              },
              "Kabarole Hospital": {
                address: "Fortportal Town",
                contactPerson: "Dr Mugisha",
                contact: "0703-825140",
              },
              "Migisha Clinic": {
                address: "Lwengo Town",
                contactPerson: "Dr. Mugisha Joseph",
                contact: "0772-444-784",
              },
              "Mutolere Hospital": {
                address: "Kisoro Town",
                contactPerson: "Mayunga Godfrey/Peter Tuyikunde",
                contact: "0783 647 635/0752-140-702",
              },
              "Kilembe Mines Hospital": {
                address: "Kilembe",
                contactPerson: "Ben/ Sr. Betilda",
                contact: "0783-353881/0782-915170",
              },
              "Kasese Hospital": {
                address: "Kyebambe rd, Opp. Catholic cemetry",
                contactPerson: "Dr. Bernard/Yoledi",
                contact: "0701-756712/0392-908493",
              },
              "Fort portal regional hospital": {
                address: "P.O BOX 10,FORT PORTAL",
                contactPerson: "Nyakana Samuel",
                contact: "0772-834-486",
              },
              "Kigezi Community Medical Centre": {
                address: "Kihihi Town",
                contactPerson: "Dr Joshua",
                contact: "0779-218416",
              },
              "Bushenyi Medical Centre": {
                address: "Along Bushenyi-Mbarara Rd",
                contactPerson: "Dr. Namanya Viann",
                contact: "0705-881-084/0779-416-224",
              },
              "KIU- Teaching Hospital": {
                address: "Within KIU University",
                contactPerson: "Prof. Sebuufu/ Carol Admin",
                contact: "0772-507-248/0701-326-132",
              },
              "Ibanda hospital-Kagongo": {
                address: "Ibanda",
                contactPerson: "kyengera",
                contact: "0787-088100",
              },
              "Bwindi Community Hospital": {
                address: "Bwindi-Kihihi",
                contactPerson: "Enock",
                contact: "0782-890884",
              },
              "Rugyeyo hospital": {
                address: "Kanungu",
                contactPerson: "Tracy/Trust",
                contact: "0782 875 531/0787-536-576",
              },
              "St. Monica Health Center": {
                address: "Mpigi, Katende",
                contactPerson: "Sr. Cecilia",
                contact: "0706-098-350",
              },
              "Eunice Memorial Medical centre": {
                address: "Kalangala Town Council",
                contactPerson: "Dr Suubi",
                contact: "0705945534",
              },
            };

            if (hospitalList[selectedHospital]) {
              // Hospital found in the hospitalList, retrieve its details
              const hospitalDetails = hospitalList[selectedHospital];
              const { address, contactPerson, contact } = hospitalDetails;
              let user = await User.findOne({
                where: {
                  phone_number: args.phoneNumber,
                },
              });
              let updatePolicy = await Policy.update(
                {
                  hospital_details: {
                    hospital_name: selectedHospital,
                    hospital_address: address,
                    contact_person: contactPerson,
                    hospital_contact: contact,
                  },
                },
                {
                  where: {
                    user_id: user?.user_id,
                  },
                }
              );
              console.log("updatePolicy", updatePolicy);

              menu.end(
                `Hospital Details:\nHospital: ${selectedHospital}\nAddress: ${address}\nContact Person: ${contactPerson}\nContact: ${contact}`
              );
            }
          } else {
            menu.con("Invalid selection. Please choose a valid hospital:");
          }
        },
        next: {
          "*\\d+": "hospitalDetails",
          "0": "selectRegion",
        },
      });

      menu.state("myHospitalOption", {
        run: async () => {
          //ask if they want to change hospital or see details
          menu.con(`1. See Details
                2. Change Hospital

                0. Back
                00. Main Menu`);
        },
        next: {
          "1": "myHospital",
          "2": "chooseHospital",
          "0": "account",
          "00": "insurance",
        },
      });

      menu.state("myHospital", {
        run: async () => {
            try {
                const user = await User.findOne({
                    where: {
                        phone_number: args.phoneNumber,
                    },
                });
    
                if (!user) {
                    menu.end("User not found.");
                    return;
                }
    
                const policy = await Policy.findOne({
                    where: {
                        user_id: user.user_id,
                    },
                });
    
                if (!policy) {
                    menu.end("Policy not found for this user.");
                    return;
                }
    
                const hospitalDetails = policy.hospital_details;
                console.log("hospitalDetails", hospitalDetails);
    
                const { hospital_name, hospital_address, contact_person, hospital_contact } = hospitalDetails;
                const hospitalInfo = `Hospital: ${hospital_name}\nAddress: ${hospital_address}\nContact Person: ${contact_person}\nContact: ${hospital_contact}`;
    
                menu.end(hospitalInfo);
            } catch (error) {
                console.error('myHospital Error:', error);
                menu.end('An error occurred. Please try again later.');
            }
        },
    });
    

      // RUN THE MENU
      let menu_res = await menu.run(args);
      // RETURN THE MENU RESPONSE
      resolve(menu_res);
      return;
    } catch (e) {
      console.log(e);
      // SOMETHING WENT REALLY WRONG
      reject("END " + languages[configs.default_lang].generic.fatal_error);
      return;
    }
  });
}
