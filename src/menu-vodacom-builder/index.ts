import { RequestBody } from "./typings/global";
import languages from "./lang";
import configs from "./configs";
import UssdMenu from "ussd-menu-builder";

require("dotenv").config();

let sessions = {};

let menu = new UssdMenu();
menu.sessionConfig({
  start: (sessionId, callback) => {
    if (!(sessionId in sessions)) sessions[sessionId] = {};
    callback();
  },
  end: (sessionId, callback) => {
    delete sessions[sessionId];
    callback();
  },
  set: (sessionId, key, value, callback) => {
    sessions[sessionId][key] = value;
    callback();
  },
  get: (sessionId, key, callback) => {
    let value = sessions[sessionId][key];
    callback(null, value);
  },
});

let premiumPricing = {
  CAR_JEEP_PICKUP: {
    PRIVATE: {
      "0-9 CV": 153,
      "10-13 CV": 200,
      "14-17 CV": 264,
      "18+": 349,
    },
    CORPORATE: {
      "0-9 CV": 225,
      "10-13 CV": 298,
      "14-17 CV": 340,
      "18+": 383,
      "Bus_Minibus_Minivan_15": 650,
      "Bus_Minibus_Minivan_16-30": 765,
      "Bus_Minibus_Minivan_31+": 1169,
    },
  },
  TRUCKS: {
    OWN_ACCOUNT_TRANSPORT: {
      "Truck_<=3.5T": 464,
      "Truck_3.6T-8T": 519,
      "Truck_9T-15T": 582,
      "Truck_15T+_Tracteur_routier": 652,
    },
  },
  TAXI_BUS_MINIBUS_MINIVAN: {
    "Taxi_<=5_passengers": 654,
    "Taxi_>5_passengers": 785,
    "Bus_Minibus_Minivan_15_paying": 915,
    "Bus_Minibus_Minivan_16-30_paying": 1177,
    "Bus_Minibus_Minivan_31+_paying": 1471,
    "Taxi_Fleet_<=5_passengers": 425,
    "Taxi_Fleet_>5_passengers": 510,
  },
  DRIVING_SCHOOL: {
    "0-9 CV": 338,
    "10-13 CV": 446,
    "14-17 CV": 510,
    "18+": 574,
    "Bus_Minibus_Minivan_15_paying": 975,
    "Bus_Minibus_Minivan_16-30_paying": 1148,
    "Bus_Minibus_Minivan_31+_paying": 1753,
    "Truck_<=3.5T": 774,
    "Truck_3.6T-8T": 866,
    "Truck_9T-15T": 970,
    "Truck_15T+_Tracteur_routier": 1084,
  },
};

export default function (args: RequestBody, db: any) {
  return new Promise(async (resolve, reject) => {
    try {
      let { phoneNumber, text, sessionId, serviceCode } = args;

      let response = "";
      let allSteps = text.split("*");

      let phone = phoneNumber?.replace("+", "")?.substring(3);
      let existingUser = await db.users.findOne({
        where: {
          phone_number: phone,
          partner_id: 3,
        },
        limit: 1,
      });

      console.log("existingUser", existingUser?.name);

      if (allSteps[allSteps.length - 1] == "00") {
        allSteps = [];
        text = "";
      }

      const handleBack = (arr: any) => {
        let index = arr.indexOf("0");
        if (index > -1) {
          console.log("index", index);
          console.log("VOD allSteps", allSteps);

          allSteps.splice(index - 1, 2);
          text = allSteps.join("*");

          return handleBack(allSteps);
        }
        // find the last index of '00' and return the array from that index
        let index2 = arr.lastIndexOf("00");
        if (index2 > -1) {
          return (allSteps = allSteps.slice(index2 + 1));
        }
        return allSteps;
      };

      allSteps = handleBack(allSteps);

      let firstStep = allSteps[0];
      let currentStep = allSteps.length;
      let previousStep = currentStep - 1;
      let userText = allSteps[allSteps.length - 1];

      console.log("VOD allStepsAfter", allSteps);

      const params = {
        phoneNumber,
        text,
        response,
        currentStep,
        previousStep,
        userText,
        allSteps,
      };

      if (text == "") {
        console.log();
        response =
          "CON " +
          "\n1. English/Anglais" +
          "\n2. French/Français" +
          "\n0. Back" +
          "\n00. Main Menu";
      } else if (currentStep == 1) {
        console.log(allSteps, currentStep, userText);
        if (existingUser) {
          if (userText == "1") {
            response =
              "CON Welcome to VodaInsure" +
              "\n1. Buy Cover" +
              "\n2. My Cover" +
              "\n3. My Vehicles/Motorcycle" +
              "\n4. Make Claim" +
              "\n5. FAQS" +
              "\n6. Garages" +
              "\n7. Terms & Conditions" +
              "\n0. Back" +
              "\n00. Main Menu";
          } else if (userText == "2") {
            console.log(allSteps, currentStep, userText);
            response =
              "CON Bienvenue à VodaInsure" +
              "\n1. Acheter une couverture" +
              "\n2. Ma couverture" +
              "\n3. Mes véhicules / motocyclettes" +
              "\n4. Faire une réclamation" +
              "\n5. FAQS" +
              "\n6. Garages" +
              "\n7. Termes et conditions" +
              "\n0. Retour" +
              "\n00. Menu principal";
          }
        } else {
          if (allSteps[0] == "1") {
            response =
              "CON Enter your Voter No. or ID number" +
              "\n0. Back" +
              "\n00.Main Menu";
          } else if (allSteps[0] == "2") {
            console.log(currentStep, userText);
            response =
              "CON Entrez votre numéro de vote ou votre numéro d'identification" +
              "\n0. Retour" +
              "\n00. Menu principal";
          }
        }
      } else if (currentStep == 2) {
        console.log(allSteps, currentStep, userText);
        if (existingUser) {
          if (userText == "1" && allSteps[0] == "1") {
            response =
              "CON Choose cover type" +
              "\n1. Comprehensive" +
              "\n2. Fire and Theft" +
              "\n3. Third Party Only" +
              "\n0. Back" +
              "\n00. Main Menu";
          } else if (userText == "1" && allSteps[0] == "2") {
            console.log(currentStep, userText);
            response =
              "CON Choisissez le type de couverture" +
              "\n1. Complet" +
              "\n2. Incendie et vol" +
              "\n3. Tiers seulement" +
              "\n0. Retour" +
              "\n00. Menu principal";
          } else if (userText == "2" && allSteps[0] == "1") {
            //list my cover
            console.log(currentStep, userText);
            let myCover = await db.policies.findAll({
              where: {
                user_id: existingUser?.user_id,
              },
              limit: 3,
            });

            response =
              "CON My Cover" +
              "\n" +
              myCover?.map((cover: any) => {
                return cover?.policy_number + " " + cover?.status;
              }) +
              "\n0. Back" +
              "\n00. Main Menu";
          } else if (userText == "2" && allSteps[0] == "2") {
            //list my cover
            console.log(currentStep, userText);
            let myCover = await db.policies.findAll({
              where: {
                user_id: existingUser?.user_id,
              },
              limit: 3,
            });

            response =
              "CON Ma couverture" +
              "\n" +
              myCover?.map((cover: any) => {
                return cover?.policy_number + " " + cover?.policy_status;
              }) +
              "\n0. Retour" +
              "\n00. Menu principal";
          } else if (userText == "3" && allSteps[0] == "1") {
            //list my vehicles
            console.log(currentStep, userText);
            let myVehicles = await db.vehicles.findAll({
              where: {
                user_id: existingUser?.user_id,
              },
              limit: 6,
            });
            console.log("myVehicles", myVehicles);
            if (myVehicles.length == 0) {
              response =
                "CON You have no vehicles registered" +
                "\n0. Back" +
                "\n00. Main Menu";
            }

            response =
              "CON My Vehicles" +
              "\n" +
              myVehicles?.map((vehicle: any) => {
                return vehicle?.vehicle_registration;
              }) +
              "\n0. Back" +
              "\n00. Main Menu";
          } else if (userText == "3" && allSteps[0] == "2") {
            //list my vehicles
            console.log(currentStep, userText);
            let myVehicles = await db.vehicles.findAll({
              where: {
                phone_number: phone,
              },
              limit: 1,
            });

            response =
              "CON Mes véhicules" +
              "\n" +
              myVehicles?.map((vehicle: any) => {
                return vehicle?.registration_number + " " + vehicle?.status;
              }) +
              "\n0. Retour" +
              "\n00. Menu principal";
          } else if (userText == "4" && allSteps[0] == "1") {
            //make claim
            console.log(currentStep, userText);

            response =
              "CON Please confirm the vehicle involved below" +
              "\n1. DRCE647E" +
              "\n2. DRC456V" +
              "\n0. Back" +
              "\n00. Main Menu";
          }
        } else {
          console.log(currentStep, userText);

          let userVoterNumber = userText;
          let user = await db.users.findOne({
            where: {
              voter_number: userVoterNumber,
              partner_id: 1,
            },
            limit: 1,
          });
          console.log("user", user, userVoterNumber);

          if (allSteps[0] == "1") {
            response =
              "CON Full Name: xxxxx" +
              "\nNumber : 07xxxxxxxx" +
              "\nVote Number: xxxxxxx" +
              "\nPress 1 to confirm your details " +
              "\n1. Confirm" +
              "\n0. Back" +
              "\n00.Main Menu";
          } else if (allSteps[0] == "2") {
            response =
              "CON Nom complet: xxxxx" +
              "\nNuméro : 07xxxxxxxx" +
              "\nNuméro de vote: xxxxxxx" +
              "\nAppuyez sur 1 pour confirmer vos détails " +
              "\n1. Confirmer" +
              "\n0. Retour" +
              "\n00. Menu principal";
          }
        }
      } else if (currentStep == 3) {
        //chhoose vehicle category
        console.log(allSteps, currentStep, userText);
        if (existingUser) {
          if (userText == "1" && allSteps[0] == "1") {
            response =
              "CON select vehicle category" +
              "\n1. Private" +
              "\n2. Corporate" +
              "\n3. Passenger transport" +
              "\n4. Truck" +
              "\n5. Driving school" +
              "\n6. Rental vehicle" +
              "\n00.Main Menu";
          } else if (userText == "1" && allSteps[0] == "2") {
            console.log(currentStep, userText);
            response =
              "CON sélectionnez la catégorie de véhicule" +
              "\n1. Privé" +
              "\n2. Corporate" +
              "\n3. Transport de passagers" +
              "\n4. Camion" +
              "\n5. Moto" +
              "\n6. Auto-école" +
              "\n7. Véhicule de location" +
              "\n8. Véhicule de construction" +
              "\n9. Véhicule spécial" +
              "\n10. Remorques" +
              "\n0. Retour" +
              "\n00. Menu principal";
          }
        } else {
          if (allSteps[0] == "1") {
            response =
              "END Thank you for registering on VodaInsure. " +
              "\n Dial *123*6*2# to buy cover";
          } else if (allSteps[0] == "2") {
            console.log(currentStep, userText);
            response =
              "END Merci de vous être inscrit sur VodaInsure." +
              "\nComposez * 123 * 6 * 2 # pour acheter une couverture";
          }
        }
      } else if (currentStep == 4) {
        //enter chassis number
        console.log(allSteps, currentStep, userText);
        if (allSteps[0] == "1") {
          response =
            "CON Enter Chassis No. of the Vehicle" +
            "\n0. Back" +
            "\n00.Main Menu";
        } else if (allSteps[0] == "2") {
          console.log(currentStep, userText);
          response =
            "CON Entrez le numéro de châssis du véhicule" +
            "\n0. Retour" +
            "\n00. Menu principal";
        }
      } else if (currentStep == 5) {
        //enter cv number
        console.log(allSteps, currentStep, userText);
        // if (allSteps[3] == "1") {
        //   response =
        //     "CON Enter Tonnage of the Vehicle" + "\n0. Back" + "\n00.Main Menu";
        // }else{
            if (allSteps[0] == "1") {
                response =
                  "CON Enter Cv No. of the Vehicle" + "\n0. Back" + "\n00.Main Menu";
              } else if (allSteps[0] == "2") {
                console.log(currentStep, userText);
                response =
                  "CON Entrez le numéro de CV du véhicule" +
                  "\n0. Retour" +
                  "\n00. Menu principal";
              }

       // }
       
      } else if (currentStep == 6) {
        //enter year of manufacture
        console.log(allSteps, currentStep, userText);
        if (allSteps[0] == "1") {
          response =
            "CON Enter Year of Manufacture" + "\n0. Back" + "\n00.Main Menu";
        } else if (allSteps[0] == "2") {
          console.log(currentStep, userText);
          response =
            "CON Entrez l'année de fabrication" +
            "\n0. Retour" +
            "\n00. Menu principal";
        }
      } else if (currentStep == 7) {
        console.log(allSteps, currentStep, userText);
        //check the vehicle category and calculate the premium
        let coverType = allSteps[2];
        let vehicleCategory = allSteps[3];
        let vehicleChassis = allSteps[4];
        let vehicleCv = parseInt(allSteps[5]);
        let vehicleYear = allSteps[6];
        let tonnage =parseInt(allSteps[5]);

        console.log("coverType", coverType);
        console.log("vehicleCategory", vehicleCategory);
        console.log("vehicleChassis", vehicleChassis);
        console.log("vehicleCv", vehicleCv);
       
        console.log("vehicleRegYear", vehicleYear);

        let vehiclePremium = 0;

        let cvRange: any = "";
        if (vehicleCv >= 0 && vehicleCv <= 9) {
          cvRange = "0-9 CV";
        } else if (vehicleCv >= 10 && vehicleCv <= 13) {
          cvRange = "10-13 CV";
        } else if (vehicleCv >= 14 && vehicleCv <= 17) {
          cvRange = "14-17 CV";
        } else {
          cvRange = "18+";
        }

        console.log("cvRange", cvRange);

        //  "\n1. Private" +
        //  "\n2. Corporate" +
        //  "\n3. Passenger transport" +
        //  "\n4. Truck" +
        //  "\n5. Driving school" +
        //  "\n6. Rental vehicle" +

        if (vehicleCategory == "1") {
          vehiclePremium =
            premiumPricing["CAR_JEEP_PICKUP"]["PRIVATE"][cvRange];
        } else if (vehicleCategory == "2") {
          vehiclePremium =
            premiumPricing["CAR_JEEP_PICKUP"]["CORPORATE"][cvRange];
        } else if (vehicleCategory == "3") {
          vehiclePremium =
            premiumPricing["TAXI_BUS_MINIBUS_MINIVAN"]["Taxi_<=5_passengers"];
        } else if (vehicleCategory == "4") {
          vehiclePremium =
            premiumPricing["TRUCKS"]["OWN_ACCOUNT_TRANSPORT"]["Truck_<=3.5T"];
        } else if (vehicleCategory == "5") {
          vehiclePremium = premiumPricing["DRIVING_SCHOOL"][vehicleCv];
        } else if (vehicleCategory == "6") {
          vehiclePremium =
            premiumPricing["TAXI_BUS_MINIBUS_MINIVAN"]["Taxi_<=5_passengers"];
        }

        console.log("vehiclePremium", vehiclePremium);

        response =
          "CON policy premium is USD " +
          vehiclePremium +
          "\n1. Confirm" +
          "\n0. Back" +
          "\n00.Main Menu";
      } else if (currentStep == 8) {
        //registration complete
        console.log(allSteps, currentStep, userText);
        if (allSteps[0] == "1") {
          response =
            "CON Thank you for registering your vehicle with VodaInsure." +
            "\nYou will receive email and SMS with more information." +
            "\nYour Vehicle details have been sent to you via SMS" +
            "\n0. Back" +
            "\n00.Main Menu";
        } else if (allSteps[0] == "2") {
          console.log(currentStep, userText);
          response =
            "CON Merci de vous être inscrit sur VodaInsure." +
            "\nUtilisez votre NIP pour vous connecter" +
            "\n0. Retour" +
            "\n00. Menu principal";
        }
      }

      resolve(response);

      return;
    } catch (e) {
      console.log(e);
      reject("END " + languages[configs.default_lang].generic.fatal_error);
      return;
    }
  });
}

// "Please confirm the vehicle involved below;;

// 1. DRCE647E
// 2. DRC456V

// 0.Back 00.Main Menu"	"Please select the nature of the claim below;

// 1. Accident
// 2. Theft

// 0.Back 00.Main Menu"	"Enter the date of occurence

// 0.Back    00.Main Menu"	"Confirm your claim details below:

// Nature: XXX
// Date: XXX

// 1. Confirm

// 0.Back    00.Main Menu"	"Your Claim on Vehicle xxx has been successfully submitted.

// You will receive sms with further instruction"
//	Dear xxx, please share a police abstract, pictures of filled claim form and any other proof via the link that  has been sent via SMS or send to this Whatsapp Number. Thank you

// menu.con(`Welcome to Vodainsure

//                                 Continue in
//                                 1. English/Anglais
//                                 2. French/Français

//                                 0.Back 00.Main Menu`);

// menu.con("Welcome to VodaInsure" +
//     "\n1. Buy Cover" +
//     "\n2. My Cover" +
//     "\n3. My Vehicles/Motorcycle" +
//     "\n4. Make Claim" +
//     "\n5. FAQS" +
//     "\n6. Garages" +
//     "\n7. Terms & Conditions" +
//     "\n0. Back" +
//     "\n00. Main Menu"
// );

// menu.con(`Choose cover type
//                         1. Comprehensive
//                         2. Fire and Theft
//                         3. Third Party Only

//                         0. Back

//                         00. Main Menu`);

// menu.con(`Enter your Voter No.
//                         1. Identification Number
//                         0. Back 00.Main Menu`);

// menu.con(`select vehicle category
//                         1. Private
//                         2. Corporate
//                         3. Passenger transport
//                         4. Truck
//                         5. Motorcycle
//                         6. Driving school
//                         7. Rental vehicle
//                         8. Construction machinery vehicle
//                         9. Special vehicle
//                         10. Trailers
//                         0. Back 00.Main Menu`);

// menu.con(`Enter Chassis No. of the Vehicle
//                         0. Back 00.Main Menu`);

// menu.con(`Enter Cv No. of the Vehicle
//                         0. Back 00.Main Menu`);

// menu.con(`Enter Value of the Vehicle
//                         0. Back 00.Main Menu`);

// menu.con(`Enter Year of Manufacture
//                         0. Back 00.Main Menu`);

// } else if (currentStep == 3) {
//     console.log(allSteps, currentStep, userText);

// } else if (currentStep == 4) {
//     console.log(allSteps, currentStep, userText);
//     if (userText == "1" && allSteps[0] == "1") {
//         response = "CON Full Name: xxxxx" +
//             "\nNumber : 07xxxxxxxx" +
//             "\nVote Number: xxxxxxx" +
//             "\nPress 1 to confirm your details " +
//             "\n1. Confirm" +
//             "\n0. Back" +
//             "\n00.Main Menu"
//     } else if (userText == "1" && allSteps[0] == "2") {
//         console.log(currentStep, userText);
//         response = 'CON Nom complet: xxxxx' +
//             "\nNuméro : 07xxxxxxxx" +
//             "\nNuméro de vote: xxxxxxx" +
//             "\nAppuyez sur 1 pour confirmer vos détails " +
//             "\n1. Confirmer" +
//             "\n0. Retour" +
//             "\n00. Menu principal"

//     }

// }else if (currentStep == 5) {
//     console.log(allSteps, currentStep, userText);
//     if (userText == "1" && allSteps[0] == "1") {
//         response = "CON Thank you for registering on VodaInsure." +
//             "\nUse your PIN to login"
//     } else if (userText == "1" && allSteps[0] == "2") {
//         console.log(currentStep, userText);
//         response = 'CON Merci de vous être inscrit sur VodaInsure.' +
//             "\nUtilisez votre NIP pour vous connecter"

//     }

//     }

//    Continue in
//    1. English/Anglais
//    2. French/Français
//    0. Back
//    00. Main Menu"

// 2. Voter Number Entry
//    "Enter your Voter No.
//    1. Identification Number
//    0. Back
//    00. Main Menu"

// 3. Confirm Details
//    "Full Name: xxxxx
//    Number : 07xxxxxxxx
//    Vote Number: xxxxxxx

//    Press 1 to confirm your details
//    1. Confirm
//    0. Back
//    00. Main Menu"

// 4. Registration Complete
//    "Thank you for registering on VodaInsure.
//    Use your PIN to login"

// . VodaInsure Main Menu
//    *123*6*2#
//    "Welcome to Vodainsure
//    Continue in
//    1. Voda Motor
//    2. Voda Health
//    0. Back
//    00. Main Menu"

// 10. VodaMotor Options
//     "Welcome to VodaInsure
//     1. Buy Cover
//     2. My Cover
//     3. My Vehicles/Motorcycle
//     4. Make Claim
//     5. FAQS
//     6. Garages
//     7. Terms & Conditions
//     0. Back
//     00. Main Menu"

// 11. Choose Cover Type
//     "Choose cover type
//     1. Comprehensive
//     2. Fire and Theft
//     3. Third Party Only
//     0. Back
//     00. Main Menu"

// 12. Select Vehicle Category
//     "Select vehicle category
//     1. Private
//     2. Corporate
//     3. Passenger transport
//     4. Truck
//     5. Motorcycle
//     6. Driving school
//     7. Rental vehicle
//     8. Construction machinery vehicle
//     9. Special vehicle
//     10. Trailers
//     0. Back
//     01. Next
//     00. Main Menu"

// 13. Vehicle Details Entry
//     "Enter Chassis No. of the Vehicle
//     0. Back
//     00. Main Menu"

// 14. Vehicle Details Entry (continued)
//     "Enter Cv No. of the Vehicle
//     0. Back
//     00. Main Menu"

// 15. Vehicle Details Entry (continued)
//     "Enter Value of the Vehicle
//     0. Back
//     00. Main Menu"

// 16. Vehicle Details Entry (continued)
//     "Enter Year of Manufacture
//     0. Back
//     00. Main Menu"

// 17. Vehicle Registration Complete
//     "Thank you for registering your vehicle with VodaInsure.
//     You will receive email and SMS with more information.
//     Your Vehicle details have been sent to you via SMS"

// 24. VodaHealth Registration Complete
//     "Thank you for showing interest in Voda Health. We will call you shortly"
