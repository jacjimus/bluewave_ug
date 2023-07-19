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
const ussd_builder_1 = __importDefault(require("ussd-builder"));
//import getUser from '../services/getAirtelUser';
const startMenu_1 = require("./menus/startMenu");
const displayInsuranceMenu_1 = require("./menus/displayInsuranceMenu");
const displayMedicalCoverMenu_1 = require("./menus/displayMedicalCoverMenu");
const termsAndConditions_1 = require("./menus/termsAndConditions");
const displayAccount_1 = require("./menus/displayAccount");
const buyForSelf_1 = require("./menus/buyForSelf");
const faqs_1 = require("./menus/faqs");
const buyForFamily_1 = require("./menus/buyForFamily");
const myAccount_1 = require("./menus/myAccount");
const payNow_1 = require("./menus/payNow");
require('dotenv').config();
let menu = new ussd_builder_1.default();
function default_1(args, db) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const Session = db.sessions;
            const User = db.users;
            const Policy = db.policies;
            //if  args.phoneNumber has a + then remove it
            if (args.phoneNumber.charAt(0) == "+") {
                args.phoneNumber = args.phoneNumber.substring(1);
            }
            // CHECK IF USER EXISTS
            let user = yield User.findOne({
                where: {
                    phone_number: args.phoneNumber
                }
            });
            if (!user) {
                throw new Error("User not found");
            }
            // console.log("USER===", user);
            // BUILD INPUT VARIABLE
            let buildInput = {
                current_input: args.text,
                full_input: args.text,
                masked_input: args.text,
                active_state: configs_1.default.start_state,
                sid: configs_1.default.session_prefix + args.sessionId,
                language: configs_1.default.default_lang,
                phone: args.phoneNumber,
                hash: "",
                user_id: user === null || user === void 0 ? void 0 : user.id,
                partner_id: user === null || user === void 0 ? void 0 : user.partner_id
            };
            // CHECK IF SESSION EXISTS
            let session = yield Session.findAll({
                where: {
                    sid: buildInput.sid
                }
            });
            if (!session) {
                // CREATE NEW SESSION
                let newSession = yield Session.create({
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
            }
            else {
                console.log("session2", session);
                console.log("BUILD INPUT", buildInput);
                //UPDATE SESSION
                let updatedSession = yield Session.update({
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
            (0, startMenu_1.startMenu)(menu);
            (0, displayInsuranceMenu_1.displayInsuranceMenu)(menu);
            (0, displayMedicalCoverMenu_1.displayMedicalCoverMenu)(menu);
            (0, displayAccount_1.displayAccount)(menu, args, db);
            //=================BUY FOR SELF=================
            (0, buyForSelf_1.buyForSelf)(menu, args, db);
            //=================BUY FOR FAMILY=================
            (0, buyForFamily_1.buyForFamily)(menu, args, db);
            //================MY ACCOUNT===================
            (0, myAccount_1.myAccount)(menu, args, db);
            //==================PAY NOW===================
            (0, payNow_1.payNow)(menu, args, db);
            //==================FAQS===================
            (0, faqs_1.displayFaqsMenu)(menu);
            //===================TERMS AND CONDITIONS===================
            (0, termsAndConditions_1.termsAndConditions)(menu, args);
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
                        "Wakiso District": ["St. Joseph'S Hospital - Wakiso", 'Wakiso Health Centre IV - Wakiso', "St Mary's Medical Center, Wakiso"],
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
                    }
                    else {
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
                        "Wakiso District": ["St. Joseph'S Hospital - Wakiso", 'Wakiso Health Centre IV - Wakiso', "St Mary's Medical Center, Wakiso"],
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
                    }
                    else {
                        menu.con('No hospitals found in the selected district. Please try a different district:');
                    }
                },
                next: {
                    '*\\d+': 'hospitalDetails',
                    '0': 'selectRegion'
                }
            });
            menu.state('hospitalDetails', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    const hospitalIndex = parseInt(menu.val) - 1;
                    let district = menu.val;
                    console.log("district", district, hospitalIndex);
                    const hospitalRegions = {
                        "Kampala District": ["Mulago National Referral Hospital - Kampala", "Uganda Cancer Institute - Kampala"],
                        "Wakiso District": ["St. Joseph'S Hospital - Wakiso", 'Wakiso Health Centre IV - Wakiso', "St Mary's Medical Center, Wakiso"],
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
                            let user = yield User.findOne({
                                where: {
                                    phone_number: args.phoneNumber
                                }
                            });
                            let updatePolicy = yield Policy.update({
                                hospital_details: {
                                    hospital_name: selectedHospital,
                                    hospital_address: details.address,
                                    hospital_contact: details.contact
                                }
                            }, {
                                where: {
                                    user_id: user === null || user === void 0 ? void 0 : user.id
                                }
                            });
                            console.log("updatePolicy", updatePolicy);
                            menu.end(`Hospital: ${selectedHospital}\nAddress: ${details.address}\nContact: ${details.contact}`);
                        }
                        else {
                            menu.end(`Hospital details not found.`);
                        }
                    }
                    else {
                        menu.end(`Invalid hospital selection.`);
                    }
                })
            });
            menu.state('myHospitalOption', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    //ask if they want to change hospital or see details
                    menu.con(`1. See Details
                2. Change Hospital

                0. Back
                00. Main Menu`);
                }),
                next: {
                    '1': 'myHospital',
                    '2': 'chooseHospital',
                    '0': 'account',
                    '00': 'insurance',
                }
            });
            menu.state('myHospital', {
                run: () => __awaiter(this, void 0, void 0, function* () {
                    let user = yield User.findOne({
                        where: {
                            phone_number: args.phoneNumber
                        }
                    });
                    let policy = yield Policy.findOne({
                        where: {
                            user_id: user === null || user === void 0 ? void 0 : user.id
                        }
                    });
                    const hospitalDetails = policy.hospital_details;
                    console.log("hospitalDetails", hospitalDetails);
                    menu.end(`Hospital: ${hospitalDetails.hospital_name}\nAddress: ${hospitalDetails.hospital_address}\nContact: ${hospitalDetails.hospital_contact}`);
                })
            });
            // RUN THE MENU
            let menu_res = yield menu.run(args);
            // RETURN THE MENU RESPONSE
            resolve(menu_res);
            return;
        }
        catch (e) {
            console.log(e);
            // SOMETHING WENT REALLY WRONG
            reject("END " + lang_1.default[configs_1.default.default_lang].generic.fatal_error);
            return;
        }
    }));
}
exports.default = default_1;
