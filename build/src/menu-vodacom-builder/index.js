"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = __importDefault(require("./lang"));
const configs_1 = __importDefault(require("./configs"));
require("dotenv").config();
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
// number of vehicle of a fleet 
function default_1(args, db) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            let { phoneNumber, text, sessionId, serviceCode } = args;
            let response = "";
            let allSteps = text.split("*");
            let phone = (_a = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.replace("+", "")) === null || _a === void 0 ? void 0 : _a.substring(3);
            let existingUser = yield db.users.findOne({
                where: {
                    phone_number: phone,
                    partner_id: 3,
                },
                limit: 1,
            });
            console.log("existingUser", existingUser === null || existingUser === void 0 ? void 0 : existingUser.name);
            if (allSteps[allSteps.length - 1] == "00") {
                allSteps = [];
                text = "";
            }
            const handleBack = (arr) => {
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
            if (text == "") {
                console.log();
                response =
                    "CON " +
                        "\n1. English/Anglais" +
                        "\n2. French/Français" +
                        "\n0. Back" +
                        "\n00. Main Menu";
            }
            else if (currentStep == 1) {
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
                    }
                    else if (userText == "2") {
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
                }
                else {
                    if (allSteps[0] == "1") {
                        response =
                            "CON Enter your Voter No. or ID number" +
                                "\n0. Back" +
                                "\n00.Main Menu";
                    }
                    else if (allSteps[0] == "2") {
                        console.log(currentStep, userText);
                        response =
                            "CON Entrez votre numéro de vote ou votre numéro d'identification" +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                }
            }
            else if (currentStep == 2) {
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
                    }
                    else if (userText == "1" && allSteps[0] == "2") {
                        console.log(currentStep, userText);
                        response =
                            "CON Choisissez le type de couverture" +
                                "\n1. Complet" +
                                "\n2. Incendie et vol" +
                                "\n3. Tiers seulement" +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "2" && allSteps[0] == "1") {
                        response =
                            "CON  " +
                                "\n1. Policy status" +
                                "\n2. Pay Now" +
                                "\n3. Cancel policy" +
                                "\n4. Add Emergency Contact" +
                                "\n0. Back" +
                                "\n00.Main Menu";
                    }
                    else if (userText == "2" && allSteps[0] == "2") {
                        response = "CON  " +
                            "\n1. Statut de la police" +
                            "\n2. Payer maintenant" +
                            "\n3. Annuler la police" +
                            "\n4. Ajouter un contact d'urgence" +
                            "\n0. Retour" +
                            "\n00. Menu principal";
                    }
                    else if (userText == "3" && allSteps[0] == "1") {
                        //list my vehicles
                        console.log(currentStep, userText);
                        let myVehicles = yield db.vehicles.findAll({
                            where: {
                                user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            },
                            limit: 6,
                        });
                        console.log("myVehicles", myVehicles);
                        if (myVehicles.length == 0) {
                            myVehicles = [
                                {
                                    registration_number: "DRCE647E",
                                    status: "Comprehensive",
                                    cv: 10,
                                    year_of_manufacture: 2010,
                                    chassis_number: "1234567890",
                                },
                                {
                                    registration_number: "DRC456V",
                                    status: "Fire and Theft",
                                    cv: 12,
                                    year_of_manufacture: 2012,
                                    chassis_number: "1234567890",
                                },
                            ];
                        }
                        response =
                            "END My Vehicles" +
                                "\n" +
                                myVehicles.map((vehicle, index) => {
                                    const vehicleNumber = index + 1;
                                    return ` ${vehicleNumber}. ${vehicle.registration_number} -  CV ${vehicle.cv}, Chassis ${vehicle.chassis_number}`;
                                }).join("\n") +
                                "\n0. Back" +
                                "\n00. Main Menu";
                    }
                    else if (userText == "3" && allSteps[0] == "2") {
                        //list my vehicles
                        console.log(currentStep, userText);
                        let myVehicles = yield db.vehicles.findAll({
                            where: {
                                phone_number: phone,
                            },
                            limit: 1,
                        });
                        if (myVehicles.length == 0) {
                            myVehicles = [{
                                    registration_number: "DRCE647E",
                                    status: "Comprehensive",
                                    cv: 10,
                                    year_of_manufacture: 2010,
                                    chassis_number: "1234567890",
                                },
                                {
                                    registration_number: "DRC456V",
                                    status: "Fire and Theft",
                                    cv: 12,
                                    year_of_manufacture: 2012,
                                    chassis_number: "1234567890",
                                }
                            ];
                        }
                        response =
                            "END Mes véhicules" +
                                "\n" +
                                myVehicles
                                    .map((vehicle, index) => {
                                    const vehicleNumber = index + 1;
                                    return ` ${vehicleNumber}. ${vehicle.registration_number} - CV ${vehicle.cv}, Châssis ${vehicle.chassis_number}`;
                                })
                                    .join("\n") +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "4" && allSteps[0] == "1") {
                        //make claim
                        console.log(currentStep, userText);
                        response =
                            "CON Please confirm the vehicle involved below" +
                                "\n1. DRCE647E - Comprehensive" +
                                "\n2. DRC456V - Fire and Theft" +
                                "\n0. Back" +
                                "\n00. Main Menu";
                    }
                    else if (userText == "4" && allSteps[0] == "2") {
                        //make claim
                        console.log(currentStep, userText);
                        response =
                            "CON Veuillez confirmer le véhicule impliqué ci-dessous" +
                                "\n1. DRCE647E - Complet" +
                                "\n2. DRC456V - Incendie et vol" +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "5" && allSteps[0] == "1") {
                        //faqs
                        console.log(currentStep, userText);
                        response =
                            "CON FAQs" +
                                "\n1. How do I buy cover?" +
                                "\n2. How do I pay for my cover?" +
                                "\n3. How do I cancel my cover?" +
                                "\n4. How do I add an emergency contact?" +
                                "\n5. How do I make a claim?" +
                                "\n0. Back" +
                                "\n00. Main Menu";
                    }
                    else if (userText == "5" && allSteps[0] == "2") {
                        //faqs
                        console.log(currentStep, userText);
                        response =
                            "CON FAQs" +
                                "\n1. Comment acheter une couverture?" +
                                "\n2. Comment payer ma couverture?" +
                                "\n3. Comment annuler ma couverture?" +
                                "\n4. Comment ajouter un contact d'urgence?" +
                                "\n5. Comment faire une réclamation?" +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "6" && allSteps[0] == "1") {
                        //list garages
                        console.log(currentStep, userText);
                        response =
                            "CON Garages" +
                                "\n1. Auto Garage" +
                                "\n2. ABC Garage " +
                                "\n3. Moto Garage " +
                                "\n0. Back" +
                                "\n00. Main Menu";
                    }
                    else if (userText == "6" && allSteps[0] == "2") {
                        //list garages
                        console.log(currentStep, userText);
                        response =
                            "CON Garages" +
                                "\n1. Auto Garage" +
                                "\n2. ABC Garage " +
                                "\n3. Moto Garage " +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "7" && allSteps[0] == "1") {
                        //terms and conditions
                        console.log(currentStep, userText);
                        response = "END Terms and Conditions link has been sent via sms" + "\n0. Back" + "\n00.Main Menu";
                    }
                    else if (userText == "7" && allSteps[0] == "2") {
                        //terms and conditions
                        console.log(currentStep, userText);
                        response = "END Le lien des conditions générales a été envoyé par SMS" + "\n0. Retour" + "\n00. Menu principal";
                    }
                }
                else {
                    console.log(currentStep, userText);
                    let userVoterNumber = userText;
                    let user = yield db.users.findOne({
                        where: {
                            voter_id: userVoterNumber,
                            partner_id: 3,
                        },
                        limit: 1,
                    });
                    console.log("user", user, userVoterNumber);
                    if (allSteps[0] == "1") {
                        response =
                            "CON Full Name: John Doe" +
                                "\nNumber :  " + phone +
                                "\nVote Number: " + userVoterNumber +
                                "\nPress 1 to confirm your details " +
                                "\n1. Confirm" +
                                "\n0. Back" +
                                "\n00.Main Menu";
                    }
                    else if (allSteps[0] == "2") {
                        response =
                            "CON Nom complet: John Doe" +
                                "\nNuméro :  " + phone +
                                "\nNuméro de vote: " + userVoterNumber +
                                "\nAppuyez sur 1 pour confirmer vos détails " +
                                "\n1. Confirmer" +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                }
            }
            else if (currentStep == 3) {
                //chhoose vehicle category
                console.log(allSteps, currentStep, userText);
                if (existingUser) {
                    if (userText == "1" && allSteps[0] == "1" && allSteps[1] == "1") {
                        response =
                            "CON select vehicle category" +
                                "\n1. Private" +
                                "\n2. Corporate" +
                                "\n3. Passenger transport" +
                                "\n4. Truck" +
                                "\n5. Driving school" +
                                "\n6. Rental vehicle" +
                                "\n00.Main Menu";
                    }
                    else if (userText == "1" && allSteps[0] == "2" && allSteps[1] == "1") {
                        console.log(currentStep, userText);
                        response =
                            "CON sélectionnez la catégorie de véhicule" +
                                "\n1. Privé" +
                                "\n2. Entreprise" +
                                "\n3. Transport de passagers" +
                                "\n4. Camion" +
                                "\n5. École de conduite" +
                                "\n6. Véhicule de location" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "1" && allSteps[0] == "1" && allSteps[1] == "2") {
                        console.log(currentStep, userText);
                        //list my cover
                        console.log(currentStep, userText);
                        let myCover = yield db.policies.findAll({
                            where: {
                                user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            },
                            limit: 3,
                        });
                        if (myCover.length == 0) {
                            myCover = [{
                                    policy_number: "POL0001",
                                    status: "Comprehensive",
                                    registration_number: "DRCE647E",
                                },
                                {
                                    policy_number: "POL0002",
                                    status: "Fire and Theft",
                                    registration_number: "DRC456V",
                                }];
                        }
                        response =
                            "CON My Cover" +
                                "\n" +
                                (myCover === null || myCover === void 0 ? void 0 : myCover.map((cover, index) => {
                                    return ` ${index + 1}. ${cover === null || cover === void 0 ? void 0 : cover.policy_number} - ${cover === null || cover === void 0 ? void 0 : cover.status} - ${cover === null || cover === void 0 ? void 0 : cover.registration_number}`;
                                }).join("\n")) +
                                "\n0. Back" +
                                "\n00. Main Menu";
                    }
                    else if (userText == "1" && allSteps[0] == "2" && allSteps[1] == "2") {
                        //   //list my cover
                        console.log(currentStep, userText);
                        let myCover = yield db.policies.findAll({
                            where: {
                                user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                            },
                            limit: 3,
                        });
                        if (myCover.length == 0) {
                            myCover = [{
                                    policy_number: "POL0001",
                                    status: "Comprehensive",
                                    registration_number: "DRCE647E",
                                },
                                {
                                    policy_number: "POL0002",
                                    status: "Fire and Theft",
                                    registration_number: "DRC456V",
                                }];
                        }
                        response =
                            "CON Ma couverture" +
                                "\n" +
                                (myCover === null || myCover === void 0 ? void 0 : myCover.map((cover, index) => {
                                    return `${index + 1}. ${cover === null || cover === void 0 ? void 0 : cover.policy_number} - ${cover === null || cover === void 0 ? void 0 : cover.status}`;
                                }).join("\n")) +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "2" && allSteps[0] == "1" && allSteps[1] == "2") {
                        //pay now
                        console.log(currentStep, userText);
                        response =
                            "CON Please select the policy to pay" +
                                "\n1. POL0001" +
                                "\n2. POL0002" +
                                "\n0. Back" +
                                "\n00. Main Menu";
                    }
                    else if (userText == "2" && allSteps[0] == "2" && allSteps[1] == "2") {
                        //pay now
                        console.log(currentStep, userText);
                        response =
                            "CON Veuillez sélectionner la police à payer" +
                                "\n1. POL0001" +
                                "\n2. POL0002" +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "3" && allSteps[0] == "1" && allSteps[1] == "2") {
                        //cancel policy
                        console.log(currentStep, userText);
                        response =
                            "CON Please select the policy to cancel" +
                                "\n1. POL0001" +
                                "\n2. POL0002" +
                                "\n0. Back" +
                                "\n00. Main Menu";
                    }
                    else if (userText == "3" && allSteps[0] == "2" && allSteps[1] == "2") {
                        //cancel policy
                        console.log(currentStep, userText);
                        response =
                            "CON Veuillez sélectionner la police à annuler" +
                                "\n1. POL0001" +
                                "\n2. POL0002" +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "4" && allSteps[0] == "1" && allSteps[1] == "2") {
                        //add emergency contact
                        console.log(currentStep, userText);
                        response =
                            "CON Please enter the name of the contact" +
                                "\n0. Back" +
                                "\n00. Main Menu";
                    }
                    else if (userText == "4" && allSteps[0] == "2" && allSteps[1] == "2") {
                        //add emergency contact
                        console.log(currentStep, userText);
                        response =
                            "CON Veuillez saisir le nom du contact" +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "1" && allSteps[0] == "1" && allSteps[1] == "4") {
                        // file claim
                        console.log(currentStep, userText);
                        response =
                            "CON Claim filed successfully" +
                                "\n0. Back" +
                                "\n00. Main Menu";
                    }
                    else if (userText == "1" && allSteps[0] == "2" && allSteps[1] == "4") {
                        // file claim
                        console.log(currentStep, userText);
                        response =
                            "CON Réclamation déposée avec succès" +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "1" && allSteps[0] == "1" && allSteps[1] == "5") {
                        //faqs
                        console.log(currentStep, userText);
                        response =
                            "CON  Dial * 384*89005# and got to the main menu and select 'Buy Cover'." +
                                "\n0. Back" +
                                "\n00. Main Menu";
                    }
                    else if (userText == "1" && allSteps[0] == "2" && allSteps[1] == "5") {
                        //faqs
                        console.log(currentStep, userText);
                        response =
                            "CON  Composez * 384 * 89005 # et accédez au menu principal et sélectionnez 'Acheter une couverture'." +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                    else if (userText == "1" && allSteps[0] == "1" && allSteps[1] == "6") {
                        // successfull garage selection
                        console.log(currentStep, userText);
                        response =
                            "CON Garage selected successfully" +
                                "\n0. Back" +
                                "\n00. Main Menu";
                    }
                    else if (userText == "1" && allSteps[0] == "2" && allSteps[1] == "6") {
                        // successfull garage selection
                        console.log(currentStep, userText);
                        response =
                            "CON Garage sélectionné avec succès" +
                                "\n0. Retour" +
                                "\n00. Menu principal";
                    }
                }
                else {
                    if (allSteps[0] == "1") {
                        console.log(allSteps, currentStep, userText);
                        yield db.users.create({
                            name: "John Doe",
                            phone_number: phone,
                            voter_id: allSteps[1],
                            partner_id: 3,
                        });
                        response =
                            "END Thank you for registering on VodaInsure. " +
                                "\n Dial *123*6*2# to buy cover";
                    }
                    else if (allSteps[0] == "2") {
                        console.log(currentStep, userText);
                        response =
                            "END Merci de vous être inscrit sur VodaInsure." +
                                "\nComposez * 123 * 6 * 2 # pour acheter une couverture";
                    }
                }
            }
            else if (currentStep == 4) {
                //enter chassis number
                console.log(allSteps, currentStep, userText);
                if (allSteps[0] == "1" && allSteps[1] == "1" && allSteps[2] == "1") {
                    response =
                        "CON Enter Chassis No. of the Vehicle" +
                            "\n0. Back" +
                            "\n00.Main Menu";
                }
                else if (allSteps[0] == "2" && allSteps[1] == "1" && allSteps[2] == "1") {
                    console.log(currentStep, userText);
                    response =
                        "CON Entrez le numéro de châssis du véhicule" +
                            "\n0. Retour" +
                            "\n00. Menu principal";
                }
                else if (allSteps[0] == "1" && allSteps[1] == "2" && allSteps[2] == "1") {
                    //cover details
                    console.log(allSteps, currentStep, userText);
                    response = "CON Policy Number: POL0001" +
                        "\nStatus: PAID" +
                        "\nRegistration Number: DRCE647E" +
                        "\nCover Type: Comprehensive" +
                        "\nPremium: USD 153" +
                        "\n0. Back" +
                        "\n00.Main Menu";
                }
                else if (allSteps[0] == "2" && allSteps[1] == "2" && allSteps[2] == "1") {
                    //cover details
                    console.log(allSteps, currentStep, userText);
                    response = "CON Numéro de police: POL0001" +
                        "\nStatut: PAYÉ" +
                        "\nNuméro d'immatriculation: DRCE647E" +
                        "\nType de couverture: Complet" +
                        "\nPrime: USD 153" +
                        "\n0. Retour" +
                        "\n00. Menu principal";
                }
                else if (allSteps[0] == "1" && allSteps[1] == "2" && allSteps[2] == "2") {
                    //pay now
                    console.log(allSteps, currentStep, userText);
                    response = "END Please enter your Vodacom Pin to complete the payment" +
                        "\n0. Back" +
                        "\n00.Main Menu";
                }
                else if (allSteps[0] == "2" && allSteps[1] == "2" && allSteps[2] == "2") {
                    //pay now
                    console.log(allSteps, currentStep, userText);
                    response = "END Veuillez saisir votre Vodacom Pin pour terminer le paiement" +
                        "\n0. Retour" +
                        "\n00. Menu principal";
                }
                else if (allSteps[0] == "1" && allSteps[1] == "2" && allSteps[2] == "3") {
                    //cancel policy
                    console.log(allSteps, currentStep, userText);
                    response = "END Policy cancelled successfully" +
                        "\n0. Back" +
                        "\n00.Main Menu";
                }
                else if (allSteps[0] == "2" && allSteps[1] == "2" && allSteps[2] == "3") {
                    //cancel policy
                    console.log(allSteps, currentStep, userText);
                    response = "END Police annulée avec succès" +
                        "\n0. Retour" +
                        "\n00. Menu principal";
                }
                else if (allSteps[0] == "1" && allSteps[1] == "2" && allSteps[2] == "4") {
                    //add emergency contact
                    console.log(allSteps, currentStep, userText);
                    response = "CON Please enter the phone number of the contact" +
                        "\n0. Back" +
                        "\n00.Main Menu";
                }
                else if (allSteps[0] == "2" && allSteps[1] == "2" && allSteps[2] == "4") {
                    //add emergency contact
                    console.log(allSteps, currentStep, userText);
                    response = "CON Veuillez saisir le numéro de téléphone du contact" +
                        "\n0. Retour" +
                        "\n00. Menu principal";
                }
            }
            else if (currentStep == 5) {
                console.log(allSteps, currentStep, userText);
                if (allSteps[0] == "1" && allSteps[1] == "1" && allSteps[2] == "1" && allSteps[3] == "1") {
                    response =
                        "CON Enter Cv No. of the Vehicle" + "\n0. Back" + "\n00.Main Menu";
                }
                else if (allSteps[0] == "2" && allSteps[1] == "1" && allSteps[2] == "1" && allSteps[3] == "1") {
                    console.log(currentStep, userText);
                    response =
                        "CON Entrez le numéro de CV du véhicule" +
                            "\n0. Retour" +
                            "\n00. Menu principal";
                }
                else if (allSteps[0] == "1" && allSteps[1] == "2" && allSteps[2] == "4") {
                    //emergency contact added
                    console.log(allSteps, currentStep, userText);
                    response = "END Emergency contact added successfully";
                }
            }
            else if (currentStep == 6) {
                //enter year of manufacture
                console.log(allSteps, currentStep, userText);
                if (allSteps[0] == "1") {
                    response =
                        "CON Enter Registration Number" + "\n0. Back" + "\n00.Main Menu";
                }
                else if (allSteps[0] == "2") {
                    console.log(currentStep, userText);
                    response =
                        "CON  Entrez le numéro d'immatriculation" +
                            "\n0. Retour" +
                            "\n00. Menu principal";
                }
            }
            else if (currentStep == 7) {
                console.log(allSteps, currentStep, userText);
                //check the vehicle category and calculate the premium
                let coverType = allSteps[2];
                let vehicleCategory = allSteps[3];
                let vehicleChassis = allSteps[4];
                let vehicleCv = parseInt(allSteps[5]);
                let vehicleRegNumber = allSteps[6];
                console.log("coverType", coverType);
                console.log("vehicleCategory", vehicleCategory);
                console.log("vehicleChassis", vehicleChassis);
                console.log("vehicleCv", vehicleCv);
                console.log("vehicleRegNumber", vehicleRegNumber);
                let vehiclePremium = 0;
                let cvRange = "";
                if (vehicleCv >= 0 && vehicleCv <= 9) {
                    cvRange = "0-9 CV";
                }
                else if (vehicleCv >= 10 && vehicleCv <= 13) {
                    cvRange = "10-13 CV";
                }
                else if (vehicleCv >= 14 && vehicleCv <= 17) {
                    cvRange = "14-17 CV";
                }
                else {
                    cvRange = "18+";
                }
                console.log("cvRange", cvRange);
                if (vehicleCategory == "1") {
                    vehiclePremium =
                        premiumPricing["CAR_JEEP_PICKUP"]["PRIVATE"][cvRange];
                }
                else if (vehicleCategory == "2") {
                    vehiclePremium =
                        premiumPricing["CAR_JEEP_PICKUP"]["CORPORATE"][cvRange];
                }
                else if (vehicleCategory == "3") {
                    vehiclePremium =
                        premiumPricing["TAXI_BUS_MINIBUS_MINIVAN"]["Taxi_<=5_passengers"];
                }
                else if (vehicleCategory == "4") {
                    vehiclePremium =
                        premiumPricing["TRUCKS"]["OWN_ACCOUNT_TRANSPORT"]["Truck_<=3.5T"];
                }
                else if (vehicleCategory == "5") {
                    vehiclePremium = premiumPricing["DRIVING_SCHOOL"][vehicleCv];
                }
                else if (vehicleCategory == "6") {
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
                const policyData = {
                    cover_type: allSteps[2],
                    vehicle_category: allSteps[3],
                    chassis_number: allSteps[4],
                    cv: allSteps[5],
                    registration_number: allSteps[6],
                    user_id: existingUser === null || existingUser === void 0 ? void 0 : existingUser.user_id,
                    premium: vehiclePremium,
                    partner_id: 3,
                };
            }
            else if (currentStep == 8) {
                //registration complete
                console.log(allSteps, currentStep, userText);
                if (allSteps[0] == "1") {
                    response = 'END Please wait for Vodacom Pin prompt to complete the payment';
                }
                else if (allSteps[0] == "2") {
                    console.log(currentStep, userText);
                    response = "END Veuillez patienter que Vodacom Pin vous invite à effectuer le paiement";
                }
            }
            resolve(response);
            return;
        }
        catch (e) {
            console.log(e);
            reject("END " + lang_1.default[configs_1.default.default_lang].generic.fatal_error);
            return;
        }
    }));
}
exports.default = default_1;
