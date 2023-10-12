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
exports.chooseHospital = void 0;
const sendSMS_1 = __importDefault(require("../../services/sendSMS"));
const uuid_1 = require("uuid");
function chooseHospital(menu, args, db) {
    const User = db.users;
    const UserHospital = db.user_hospitals;
    const Hospitals = db.hospitals;
    if (args.phoneNumber.charAt(0) == "+") {
        args.phoneNumber = args.phoneNumber.substring(1);
    }
    const findUserByPhoneNumber = (phoneNumber) => __awaiter(this, void 0, void 0, function* () {
        return yield User.findOne({
            where: {
                phone_number: phoneNumber,
            },
        });
    });
    console.log("CHOOSE HOPITAL", args.phoneNumber);
    menu.state("chooseHospital", {
        run: () => {
            const regions = [
                "Central Region",
                "Western Region",
                "Eastern Region",
                "Karamoja Region",
                "West Nile Region",
                "Northern Region",
            ];
            let message = "Select Region\n";
            regions.forEach((region, index) => {
                message += `${index + 1}. ${region}\n`;
            });
            message += "0. Back";
            menu.con(message);
        },
        next: {
            "*\\d+": "chooseHospital.distict",
            "0": "chooseHospital",
        },
    });
    menu.state("chooseHospital.distict", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const region = menu.val;
            const regions = [
                "Central Region",
                "Western Region",
                "Eastern Region",
                "Karamoja Region",
                "West Nile Region",
                "Northern Region",
            ];
            console.log("REGION", region, regions[region - 1]);
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            const userHospital = yield UserHospital.findOne({
                where: {
                    user_id: user.user_id,
                },
            });
            if (userHospital) {
                yield UserHospital.update({
                    hospital_region: regions[region - 1],
                }, {
                    where: {
                        user_id: user.user_id
                    }
                });
            }
            else {
                yield UserHospital.create({
                    user_hospital_id: (0, uuid_1.v4)(),
                    user_id: user.user_id,
                    hospital_region: regions[region - 1],
                });
            }
            const user_hospital_region = userHospital.hospital_region;
            // const hospitalList = await Hospitals.findAll();
            const hospitalList = yield Hospitals.findAll();
            console.log("HOSPITAL LIST", hospitalList.length);
            //console.log("HOSPITAL LIST", hospitalList)
            const hospitalListByRegion = hospitalList.filter(hospital => hospital.region === user_hospital_region);
            console.log("HOSPITAL LIST BY REGION", hospitalListByRegion);
            // if district exists, list district for user to choose
            let districtList = hospitalListByRegion.map(hospital => hospital.district);
            districtList = [...new Set(districtList)];
            //randomize district list
            districtList.sort(() => Math.random() - 0.5);
            menu.con(`Type your District to search e.g ${districtList[0]}
         0.Back 00.Main Menu`);
        }),
        next: {
            "*\\w+": "chooseHospital.search",
            "0": "chooseHospital",
        },
    });
    menu.state("chooseHospital.search", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const district = menu.val;
            console.log("DISTRICT val", district);
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            const userHospital = yield UserHospital.findOne({
                where: {
                    user_id: user.user_id,
                },
            });
            const user_hospital_region = userHospital.hospital_region;
            const hospitalList = yield Hospitals.findAll();
            const hospitalListByRegion = hospitalList.filter(hospital => hospital.region.toLowerCase().includes(user_hospital_region.toLowerCase()));
            //console.log("HOSPITAL LIST BY REGION", hospitalListByRegion)
            // check if district exists in hospitalListByRegion
            const hospitalListByDistrict = hospitalListByRegion.filter(hospital => hospital.district.toLowerCase().includes(district.toLowerCase()));
            //console.log("HOSPITAL LIST BY DISTRICT", hospitalListByDistrict)
            if (hospitalListByDistrict.length === 0) {
                menu.con('No hospital found in this district. Please try again.');
                menu.end();
            }
            // if district exists, list district for user to choose
            let districtList = hospitalListByDistrict.map(hospital => hospital.district);
            districtList = [...new Set(districtList)];
            menu.con(`Confirm your District
${districtList.map((district, index) => `${district}`).join("\n")}

   0.Back 00.Main Menu`);
        }),
        next: {
            "*\\w+": "searchHospital.hospital",
            "0": "chooseHospital",
        },
    });
    menu.state("searchHospital.hospital", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const distictInput = menu.val;
            console.log("DISTRICT INPUT", distictInput);
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            const userHospital = yield UserHospital.findOne({
                where: {
                    user_id: user.user_id,
                },
            });
            const user_hospital_region = userHospital.hospital_region;
            console.log("USER HOSPITAL REGION", user_hospital_region);
            // SAVE DISTRICT TO DATABASE
            userHospital.hospital_district = distictInput;
            yield userHospital.save();
            const user_hospital_district = userHospital.hospital_district;
            // const hospitalList = {
            //   "Central Region": [
            //     {
            //       region: 'Central Region',
            //       district: 'Bweyogerere',
            //       hospital_name: 'Joy Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Mutesi Esther',
            //       hospital_address: 'P.O BOX 12723, OPP TOTAL PETROL STATION',
            //       hospital_contact: '0414-383151/0752-827-024'
            //     },
            //     {
            //       region: 'Central Region',
            //       district: 'Kira',
            //       hospital_name: 'Grand Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Ronald',
            //       hospital_address: 'Kira Town',
            //       hospital_contact: '0772-713816'
            //     },
            //     {
            //       region: 'Central Region',
            //       district: 'Mukono',
            //       hospital_name: 'St. Francis Mukono Medical Centre',
            //       category: 'IP',
            //       hospital_contact_person: 'Marris Nakayaga',
            //       hospital_address: 'Mukono Ssaza Road',
            //       hospital_contact: '0782 884415'
            //     },
            //     {
            //       district: 'Nagalama',
            //       region: 'Central Region',
            //       hospital_name: 'St. Francis Naggalama Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Sr Jane Frances/Francis',
            //       hospital_address: 'P.O Box-22004, Naggalama',
            //       hospital_contact: '0392-702-709/0772-593-665/0776-880-211'
            //     },
            //     {
            //       district: 'Natete',
            //       region: 'Central Region',
            //       hospital_name: 'Vision Medical Centre',
            //       category: 'IP',
            //       hospital_contact_person: 'Dan Zaake',
            //       hospital_address: 'Wakaliga Road-Natete',
            //       hospital_contact: '0704-768-939'
            //     },
            //     {
            //       district: 'Nkozi',
            //       region: 'Central Region',
            //       hospital_name: 'Nkozi Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Criscent',
            //       hospital_address: 'P.O Box 4349,Kampala ',
            //       hospital_contact: '0776-738-723'
            //     },
            //     {
            //       district: 'Mpigi',
            //       region: 'Central Region',
            //       hospital_name: 'St. Monica Health Center',
            //       category: 'IP',
            //       hospital_contact_person: 'Sr. Cecilia',
            //       hospital_address: 'Mpigi, Katende',
            //       hospital_contact: '0706-098-350'
            //     },
            //     {
            //       district: 'Kalangala',
            //       region: 'Central Region',
            //       hospital_name: 'Eunice Memorial Medical centre',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr Suubi',
            //       hospital_address: 'Kalangala Town Council',
            //       hospital_contact: 705945534
            //     },
            //     {
            //       district: 'Kaliro',
            //       region: 'Central Region',
            //       hospital_name: 'Dr Ambosoli Health Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr Ambrose/Bruno',
            //       hospital_address: 'Kaliro Town council, Munayeka Rd near Kaliro High school',
            //       hospital_contact: '0782-867978/0785-083-087'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Adcare Medical Services',
            //       category: 'IP ',
            //       hospital_contact_person: 'Eton',
            //       hospital_address: 'Near Ethiopian Village at the junction of the Italian Supermarket',
            //       hospital_contact: '0705929944/0776-212-847'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Heart services Uganda Ltd',
            //       category: 'IP',
            //       hospital_contact_person: 'Florence',
            //       hospital_address: 'Kitgum House',
            //       hospital_contact: '0757-934376/0785-580855'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Nsambya Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Rose',
            //       hospital_address: 'Plot 57 Nsambya-Ggaba road',
            //       hospital_contact: '0701-417-478'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Paramount Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Simon Begumisa',
            //       hospital_address: 'Gadaffi Road',
            //       hospital_contact: '0700 873155'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Welington Wellness Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Hellen Nabwire',
            //       hospital_address: 'Medical Hub Yusuf Lule road next to Fairway Hotel',
            //       hospital_contact: '0776-832-820/0393-217-854'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Mukwaya General Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Elijah Semalulu',
            //       hospital_address: 'Opp. American Embassy',
            //       hospital_contact: '0702-132 123 / 0788-268 682'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Case Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Brian Nyegenye',
            //       hospital_address: 'Plot 69-71 Buganda Road',
            //       hospital_contact: '0702-917-495/0312-250700'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Marie stopes Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Dorcus',
            //       hospital_address: 'Forest mall,',
            //       hospital_contact: '0775 274373'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Norvik Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Isaac',
            //       hospital_address: 'Kampala road',
            //       hospital_contact: '0704-143507'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Kampala Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Jude Kigozi',
            //       hospital_address: 'Kololo Makindu close',
            //       hospital_contact: '0312-563400/0783-893650'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'International Hospital Kampala',
            //       category: 'IP ',
            //       hospital_contact_person: 'Herbert Mukova',
            //       hospital_address: 'Namuwongo',
            //       hospital_contact: '0312 200 400/0752-966-812/0753-242-688'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Bugolobi Medical Centre',
            //       category: 'IP',
            //       hospital_contact_person: 'Owor Gilbert',
            //       hospital_address: 'Bugolobi',
            //       hospital_contact: '0777 717034'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'UMC Victoria Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr.Jjuko',
            //       hospital_address: 'Bukoto. P.O Box 72587 Kampala',
            //       hospital_contact: '0773-422034'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Kyadondo Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Musoke',
            //       hospital_address: 'Tula road Kawempe',
            //       hospital_contact: '0705929944/0772-483-267'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Span medicare',
            //       category: 'IP ',
            //       hospital_contact_person: 'Miss Catherine',
            //       hospital_address: 'Kisaasi Trading Centre',
            //       hospital_contact: '0752-049829/0754-035106'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'CTC Medical center',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Arnold/ Ivan',
            //       hospital_address: 'Kyengera- Next to DFCU Bank',
            //       hospital_contact: '0772-613-300/0759-577-871'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Lubaga hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Deus/Sylvia',
            //       hospital_address: 'Lubaga',
            //       hospital_contact: '0781-807-627/0701-605-148'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Mengo Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Lincoln/Brenda Naggawa',
            //       hospital_address: 'Mengo Off Sir Albert cook road',
            //       hospital_contact: '0414 270222 /0704-499-907/0756-507-476'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: "Doctor's Medical Centre",
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Kabanda/Carol Admin',
            //       hospital_address: 'Mpererwe-gayaza rd',
            //       hospital_contact: '0702961561(Dr. Kabanda)/0773-251-408(Carol)'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Millineum medical center',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dan Zaake',
            //       hospital_address: 'Nsangi',
            //       hospital_contact: '0704-768-939'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Life Link Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Carol',
            //       hospital_address: 'Ntinda, Opposite Caltex',
            //       hospital_contact: '+256 712 965505/0312-294-998'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Kampala West Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Benson Tumwesigye/Hope',
            //       hospital_address: 'Rubaga road next to Hotel Sojovalo',
            //       hospital_contact: '0717-162476/0753-844-159'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Vision Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Dan Zaake',
            //       hospital_address: 'Wakaliga Road-Natete',
            //       hospital_contact: '0704-768-939'
            //     },
            //     {
            //       district: 'Kampala',
            //       region: 'Central Region',
            //       hospital_name: 'Henrob Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Kiggundu Spire',
            //       hospital_address: 'Zana Entebbe Road',
            //       hospital_contact: '0757-104596 /0782-104-596'
            //     }
            //   ],
            //   "Western Region": [
            //     {
            //       district: 'Lwengo',
            //       region: 'Western Region',
            //       hospital_name: 'Migisha Clinic',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Mugisha Joseph',
            //       hospital_address: 'Lwengo Town',
            //       hospital_contact: '0772-444-784'
            //     },
            //     {
            //       district: 'Kakumiro',
            //       region: 'Western Region',
            //       hospital_name: 'Rinamo Medical Centre  ',
            //       category: 'IP ',
            //       hospital_contact_person: 'Crissy',
            //       hospital_address: 'Kakumiro town',
            //       hospital_contact: '0774-725761/0705-200-275'
            //     },
            //     {
            //       district: 'Lyantonde',
            //       region: 'Western Region',
            //       hospital_name: 'Born Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Kizza Isaiah',
            //       hospital_address: 'P. O. Box 18, Lyantonde',
            //       hospital_contact: '0772-495779/0701-462-459'
            //     },
            //     {
            //       district: 'Masaka',
            //       region: 'Western Region',
            //       hospital_name: 'Allied Medicare Services',
            //       category: 'IP ',
            //       hospital_contact_person: 'Bawakanya Stephen',
            //       hospital_address: 'Pliot 5 Elgin Road Masaka',
            //       hospital_contact: '0702-427-668'
            //     },
            //     {
            //       district: 'Masaka',
            //       region: 'Western Region',
            //       hospital_name: 'Masaka Regional Referra Hopital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Dada/Dr. Nathan/Beatrice/Ronald',
            //       hospital_address: 'Makaka',
            //       hospital_contact: '0782-017098/0772-433809/0781-141-755/0776-977-114'
            //     },
            //     {
            //       district: 'Masaka',
            //       region: 'Western Region',
            //       hospital_name: 'Kitovu hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Jude/Sr Pauline',
            //       hospital_address: 'Kitovu',
            //       hospital_contact: '0756-440-056/0752-556-712/0702-683461'
            //     },
            //     {
            //       district: 'Sembabule',
            //       region: 'Western Region',
            //       hospital_name: 'Beacof Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr Asuman',
            //       hospital_address: 'Sembabule Town',
            //       hospital_contact: '0779-147033'
            //     },
            //     {
            //       district: 'Mbarara',
            //       region: 'Western Region',
            //       hospital_name: 'International Medical Center',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Lubega Paul/Scovia Eryenyu',
            //       hospital_address: 'Mbarara complex building -Mbaguta street',
            //       hospital_contact: '0393 - 280- 696'
            //     },
            //     {
            //       district: 'Kihihi',
            //       region: 'Western Region',
            //       hospital_name: 'Kigezi Community Medical Centre',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr Joshua',
            //       hospital_address: 'Kihihi Town',
            //       hospital_contact: '0779-218416'
            //     },
            //     {
            //       district: 'Bushenyi',
            //       region: 'Western Region',
            //       hospital_name: 'Bushenyi Medical Centre',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Namanya Viann',
            //       hospital_address: 'Along Bushenyi-Mbarara Rd',
            //       hospital_contact: '0705-881-084/0779-416-224'
            //     },
            //     {
            //       district: 'Ishaka',
            //       region: 'Western Region',
            //       hospital_name: 'KIU- Teaching Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Prof. Sebuufu/ Carol Admin',
            //       hospital_address: 'Within KIU University',
            //       hospital_contact: '0772-507-248/0701-326-132'
            //     },
            //     {
            //       district: 'Ibanda',
            //       region: 'Western Region',
            //       hospital_name: 'Ibanda hospital-Kagongo',
            //       category: 'IP ',
            //       hospital_contact_person: 'kyengera',
            //       hospital_address: 'Ibanda',
            //       hospital_contact: '0787-088100'
            //     },
            //     {
            //       district: 'Kabale',
            //       region: 'Western Region',
            //       hospital_name: 'Rugarama Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Gilbert Mateeka',
            //       hospital_address: 'Kabale town',
            //       hospital_contact: '0486-422-628/0773-455618'
            //     },
            //     {
            //       district: 'Kabale',
            //       region: 'Western Region',
            //       hospital_name: 'Kabale Hospital Private wing',
            //       category: 'IP',
            //       hospital_contact_person: 'Justus',
            //       hospital_address: 'Kabale town',
            //       hospital_contact: '0775-273-584'
            //     },
            //     {
            //       district: 'Kihihi',
            //       region: 'Western Region',
            //       hospital_name: 'Bwindi Community Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Enock',
            //       hospital_address: 'Bwindi-Kihihi',
            //       hospital_contact: '0782-890884'
            //     },
            //     {
            //       district: 'Kanungu',
            //       region: 'Western Region',
            //       hospital_name: 'Rugyeyo hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Tracy/Trust',
            //       hospital_address: 'Kanungu',
            //       hospital_contact: '0782 875 531/0787-536-576'
            //     },
            //     {
            //       district: 'Kanungu',
            //       region: 'Western Region',
            //       hospital_name: 'Nyakatare Health Centre III',
            //       category: 'IP',
            //       hospital_contact_person: 'Ritah Katumba/Nexon',
            //       hospital_address: '12 Hours',
            //       hospital_contact: 'Nex-0775-620-596/0700-620-596'
            //     },
            //     {
            //       district: 'Rukungiri',
            //       region: 'Western Region',
            //       hospital_name: 'St. Karoil Lwanga Nyakibale Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Claudio/Alex',
            //       hospital_address: 'Rwakabengo rd, Rukungiri municipality',
            //       hospital_contact: '0772-443-572&0705-541-028/0772-321-478'
            //     },
            //     {
            //       district: 'Kisoro',
            //       region: 'Western Region',
            //       hospital_name: 'Mutolere Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Mayunga Godfrey/Peter Tuyikunde',
            //       hospital_address: 'Kisoro town',
            //       hospital_contact: '0783 647 635/0752-140-702'
            //     },
            //     {
            //       district: 'Kasese',
            //       region: 'Western Region',
            //       hospital_name: 'Kilembe Mines Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Ben/ Sr. Betilda',
            //       hospital_address: 'Kilembe',
            //       hospital_contact: '0783-353881/0782-915170'
            //     },
            //     {
            //       district: 'Kasese',
            //       region: 'Western Region',
            //       hospital_name: 'Kasese Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Bernard/Yoledi',
            //       hospital_address: 'Kyebambe rd, Opp. Catholic cemetry',
            //       hospital_contact: '0701-756712/0392-908493'
            //     },
            //     {
            //       district: 'Fortportal',
            //       region: 'Western Region',
            //       hospital_name: 'Fort portal regional hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Nyakana Samuel',
            //       hospital_address: 'P.O BOX 10,FORT PORTAL',
            //       hospital_contact: '0772-834-486'
            //     },
            //     {
            //       district: 'Fortportal',
            //       region: 'Western Region',
            //       hospital_name: 'Kabarole Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr Mugisha',
            //       hospital_address: 'Fortportal Town',
            //       hospital_contact: '0703-825140'
            //     },
            //     {
            //       district: 'Mubende',
            //       region: 'Western Region',
            //       hospital_name: 'True Vine Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Emmanuel',
            //       hospital_address: 'Mubende municipality. P.O. Box 1665 Masaka',
            //       hospital_contact: '0704 284351'
            //     },
            //     {
            //       district: 'Kiryadongo',
            //       region: 'Western Region',
            //       hospital_name: 'Kiryadondo Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Gamel',
            //       hospital_address: 'Kiryandongo town center',
            //       hospital_contact: '0782-506-093'
            //     }
            //   ],
            //   "Eastern Region": [
            //     {
            //       district: 'KAYUNGA',
            //       region: 'Eastern Region',
            //       hospital_name: 'Jonathan Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Patrick/Kakooza',
            //       hospital_address: 'Hospital lane next to Umeme Offices ',
            //       hospital_contact: '0756-649-688/0706-730-664'
            //     },
            //     {
            //       district: 'KAYUNGA',
            //       region: 'Eastern Region',
            //       hospital_name: 'Suubi medical center',
            //       category: 'IP ',
            //       hospital_contact_person: 'Mpooya Simon',
            //       hospital_address: 'Kayunga Town Council ',
            //       hospital_contact: '0772-670-744'
            //     },
            //     {
            //       district: 'BUGIRI',
            //       region: 'Eastern Region',
            //       hospital_name: 'Fastline Medical Center',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Isabirye Stephen',
            //       hospital_address: 'Plot 99 Kaune Wakooli Road',
            //       hospital_contact: '0772 664318 /0783 375332'
            //     },
            //     {
            //       district: 'Namayingo',
            //       region: 'Eastern Region',
            //       hospital_name: 'Santa Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr John Paul',
            //       hospital_address: 'Namayingo Town',
            //       hospital_contact: '0788-322099'
            //     },
            //     {
            //       district: 'IGANGA',
            //       region: 'Eastern Region',
            //       hospital_name: 'Mercy  Health Center',
            //       category: 'IP ',
            //       hospital_contact_person: 'Innocent Mugabi',
            //       hospital_address: 'Plot 7/9 bulamu Iganda',
            //       hospital_contact: '0703-895-928'
            //     },
            //     {
            //       district: 'Kaliro',
            //       region: 'Eastern Region',
            //       hospital_name: 'Dr Ambosoli Health Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr Ambrose/Bruno',
            //       hospital_address: 'Kaliro Town council, Munayeka Rd near Kaliro High school',
            //       hospital_contact: '0782-867978/0785-083-087'
            //     },
            //     {
            //       district: 'Mayuge',
            //       region: 'Eastern Region',
            //       hospital_name: 'JK Pancrass Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Joseph',
            //       hospital_address: 'Mayuge Town Council, Kaguta Rd',
            //       hospital_contact: '0774 931798'
            //     },
            //     {
            //       district: 'KAMULI',
            //       region: 'Eastern Region',
            //       hospital_name: 'Kamuli Mission Hospital(Lubaga)',
            //       category: 'IP ',
            //       hospital_contact_person: 'Ronald',
            //       hospital_address: 'P.O BOX 99, Kamuli town',
            //       hospital_contact: '0774-187-499/0755-187-499'
            //     },
            //     {
            //       district: 'JINJA',
            //       region: 'Eastern Region',
            //       hospital_name: 'Crescent medical centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Abdallah/ Ssjjabi',
            //       hospital_address: 'Jinja Town',
            //       hospital_contact: '0702 678240/0702 417284'
            //     },
            //     {
            //       district: 'BUSIA',
            //       region: 'Eastern Region',
            //       hospital_name: "Emram Doctor's clinic",
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Tusiime Emmanuel',
            //       hospital_address: 'Busia Municipality',
            //       hospital_contact: '0773-375551'
            //     },
            //     {
            //       district: 'JINJA',
            //       region: 'Eastern Region',
            //       hospital_name: 'International Medical Centre',
            //       category: 'IP ',
            //       hospital_contact_person: 'Joseph Nyanzi/ Agasha Carol',
            //       hospital_address: 'Plot 14 Circular Road',
            //       hospital_contact: '0434-122-499 /0712-856-200/ 0712-484-846'
            //     },
            //     {
            //       district: 'PALLISA',
            //       region: 'Eastern Region',
            //       hospital_name: 'Townside Clinic',
            //       category: 'IP ',
            //       hospital_contact_person: 'Dr. Samuel Okoit',
            //       hospital_address: 'Paliisa town',
            //       hospital_contact: '0704-556-667'
            //     },
            //     {
            //       district: 'TORORO',
            //       region: 'Eastern Region',
            //       hospital_name: 'Divine Mercy Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Josue',
            //       hospital_address: 'Tororo',
            //       hospital_contact: '0772413166'
            //     },
            //     {
            //       district: 'MBALE',
            //       region: 'Eastern Region',
            //       hospital_name: 'International medical centre',
            //       category: 'IP',
            //       hospital_contact_person: 'Sylvia',
            //       hospital_address: 'Mbale town',
            //       hospital_contact: '0781 221 703/0392 000 054'
            //     },
            //     {
            //       district: 'KUMI',
            //       region: 'Eastern Region',
            //       hospital_name: 'Kumi Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Robert',
            //       hospital_address: 'P.O BOX 09, Ongino',
            //       hospital_contact: '0776-221443'
            //     },
            //     {
            //       district: 'KAPCHORWA',
            //       region: 'Eastern Region',
            //       hospital_name: 'Masha Clinic',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Boyo Alfred',
            //       hospital_address: 'Plot 5 Chemonges Road',
            //       hospital_contact: '0772 984 947'
            //     }
            //   ],
            //   "Karamoja Region": [
            //     {
            //       district: 'Moroto',
            //       region: 'Karamoja Region',
            //       hospital_name: 'Amudat Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Jane',
            //       hospital_address: 'Amudat, P.O Box 44 Moroto',
            //       hospital_contact: '0782187876'
            //     },
            //     {
            //       district: 'Moroto',
            //       region: 'Karamoja Region',
            //       hospital_name: 'Rainbow Empirical Medical Centre',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Paul Olong',
            //       hospital_address: 'Huzafrans House Plot 9 Jie Road Campswahili Juu',
            //       hospital_contact: ' 0750-584045 '
            //     },
            //     {
            //       district: 'Moroto',
            //       region: 'Karamoja Region',
            //       hospital_name: 'Fitzmann Medical Services',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Nuwagaba Charles',
            //       hospital_address: 'Former mariestopes offices',
            //       hospital_contact: '0774 309 908'
            //     }
            //   ],
            //   "West Nile Region": [
            //     {
            //       district: 'Nebbi',
            //       region: 'West Nile Region',
            //       hospital_name: 'Nebbi Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Peace Nikum',
            //       hospital_address: 'Nebbi town',
            //       hospital_contact: '0784 219998'
            //     },
            //     {
            //       district: 'Zombo',
            //       region: 'West Nile Region',
            //       hospital_name: 'Nyapea Mission Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr Omara ',
            //       hospital_address: 'Paidha /Zombo',
            //       hospital_contact: '0783-725018'
            //     },
            //     {
            //       district: 'ARUA',
            //       region: 'West Nile Region',
            //       hospital_name: 'Pioneer Medical Centre Arua',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr. Aldo Pariyo',
            //       hospital_address: 'P.O BOX 1124 KOBOKO',
            //       hospital_contact: '0392 961427'
            //     }
            //   ],
            //   "Northern Region": [
            //     {
            //       district: 'Gulu',
            //       region: 'Northern Region',
            //       hospital_name: 'St.Mary’s Lacor Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Mrs. Iris/Beatrice/Jackie',
            //       hospital_address: 'Gulu',
            //       hospital_contact: '0471-432-310/0772-365-480/0787-576-636/0777-326438'
            //     },
            //     {
            //       district: 'Oyam',
            //       region: 'Northern Region',
            //       hospital_name: 'St John Paul Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Sarah',
            //       hospital_address: 'Oyam town',
            //       hospital_contact: '0780 590859'
            //     },
            //     {
            //       district: 'Amolatar',
            //       region: 'Northern Region',
            //       hospital_name: 'Hope Charity Medicare',
            //       category: 'IP',
            //       hospital_contact_person: 'Aloka Bonny Obongi',
            //       hospital_address: 'Amolatar',
            //       hospital_contact: '0782 807490'
            //     },
            //     {
            //       district: 'Apac',
            //       region: 'Northern Region',
            //       hospital_name: 'Florence Nightingale Hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Sr. Margaret/Okello Dickson',
            //       hospital_address: 'Apac town, P.O BOX 20',
            //       hospital_contact: '0772-539-049/0773-875-601'
            //     },
            //     {
            //       district: 'Kitgum',
            //       region: 'Northern Region',
            //       hospital_name: 'St. Joseph’s Hospital',
            //       category: 'IP',
            //       hospital_contact_person: 'Dr.Pamela Atim/Robert',
            //       hospital_address: 'Mission Road Nyenyiki Village',
            //       hospital_contact: '0772-591493/0772-054-72'
            //     },
            //     {
            //       district: 'Agago',
            //       region: 'Northern Region',
            //       hospital_name: 'St.Ambrosoli Kalongo hospital',
            //       category: 'IP ',
            //       hospital_contact_person: 'Sr Pamela/Ojok',
            //       hospital_address: 'Mission Ward, Kalongo Town Council',
            //       hospital_contact: '0772-323072/0782840036'
            //     }
            //   ],
            // };
            const hospitalList = yield Hospitals.findAll();
            const hospitalsByRegion = hospitalList.filter(hospital => hospital.region.toLowerCase() === user_hospital_region.toLowerCase());
            console.log('hospitalsByRegion', hospitalsByRegion);
            const hospitalsByDistrict = hospitalsByRegion.filter(hospital => hospital.district.toLowerCase() === user_hospital_district.toLowerCase());
            console.log('hospitalsByDistrict', hospitalsByDistrict);
            // RANDOM HOSPITAL
            const randomHospital = hospitalsByDistrict[Math.floor(Math.random() * hospitalsByDistrict.length)];
            menu.con(`Type your Hospital to search e.g ${randomHospital.hospital_name}`);
        }),
        next: {
            "*[a-zA-Z]+": "selectHospital.search",
            "0": "selectRegion",
        },
    });
    menu.state("selectHospital.search", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            const hospitalName = menu.val;
            const user = yield findUserByPhoneNumber(args.phoneNumber);
            const userHospital = yield UserHospital.findOne({
                where: {
                    user_id: user.user_id,
                },
            });
            const user_hospital_region = userHospital.hospital_region;
            const user_hospital_district = userHospital.hospital_district;
            const hospitalList = yield Hospitals.findAll();
            const hospitalsByRegion = hospitalList.filter(hospital => hospital.region.toLowerCase() === user_hospital_region.toLowerCase());
            //console.log('hospitalsByRegion', hospitalsByRegion);
            const hospitalsByDistrict = hospitalsByRegion.filter(hospital => hospital.district.toLowerCase() === user_hospital_district.toLowerCase());
            console.log('hospitalsByDistrict', hospitalsByDistrict);
            const hospitalSearchList = hospitalsByDistrict.find(hospital => hospital.hospital_name.toLowerCase().includes(hospitalName.toLowerCase()));
            console.log('hospitalSearchList', hospitalSearchList);
            if (typeof hospitalSearchList === 'undefined') {
                return menu.end('Sorry, we could not find a hospital with that name. Please try again.');
            }
            console.log(typeof hospitalSearchList === 'undefined');
            const { hospital_name, hospital_address, hospital_contact_person, hospital_contact } = hospitalSearchList;
            userHospital.hospital_name = hospital_name;
            userHospital.hospital_address = hospital_address;
            userHospital.hospital_contact_person = hospital_contact_person;
            userHospital.hospital_contact = hospital_contact;
            yield userHospital.save();
            const hospitalInfo = `
          You have selected ${hospital_name}\n as your preferred facility.Below are the Hospital details
          \nAddress: ${hospital_address}\nContact Person: ${hospital_contact_person}\nContact: ${hospital_contact}`;
            menu.con(hospitalInfo);
        }),
        next: {
            "00": "account",
        },
    });
    menu.state("myHospitalOption", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            //ask if they want to change hospital or see details
            menu.con(`1. See Details
                2. Change Hospital

                0. Back
                00. Main Menu`);
        }),
        next: {
            "1": "myHospital",
            "2": "chooseHospital",
            "0": "account",
            "00": "account",
        },
    });
    menu.state("myHospital", {
        run: () => __awaiter(this, void 0, void 0, function* () {
            let user = yield findUserByPhoneNumber(args.phoneNumber);
            const hospitalDetails = yield db.user_hospitals.findOne({
                where: {
                    user_id: user.user_id,
                },
            });
            if (!hospitalDetails) {
                menu.end(`Sorry, you have not selected a hospital yet.
                      \nPlease select a hospital first.
                      \n1. Select Hospital`);
            }
            console.log("hospitalDetails", hospitalDetails);
            const { hospital_name, hospital_address, hospital_contact_person, hospital_contact } = hospitalDetails;
            const hospitalInfo = `Hospital: ${hospital_name}\nAddress: ${hospital_address}\nContact Person: ${hospital_contact_person}\nContact: ${hospital_contact}`;
            const message = `Congratulations, you have selected ${hospital_name} as your preferred Inpatient Hospital. Below are the Hospital details:
                        Hospital Name: ${hospital_name}
                        Contact Number: ${hospital_contact}
                        Location: ${hospital_address}
                        Contact Person: ${hospital_contact_person}
                        `;
            yield (0, sendSMS_1.default)(args.phoneNumber, message);
            menu.end(hospitalInfo);
        }),
        next: {
            "1": "chooseHospital",
            "00": "account",
        },
    });
}
exports.chooseHospital = chooseHospital;
// const hospitalList = {
//   "Central Region": [
//     {
//       region: 'Central Region',
//       district: 'Bweyogerere',
//       hospital_name: 'Joy Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Mutesi Esther',
//       hospital_address: 'P.O BOX 12723, OPP TOTAL PETROL STATION',
//       hospital_contact: '0414-383151/0752-827-024'
//     },
//     {
//       region: 'Central Region',
//       district: 'Kira',
//       hospital_name: 'Grand Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Ronald',
//       hospital_address: 'Kira Town',
//       hospital_contact: '0772-713816'
//     },
//     {
//       region: 'Central Region',
//       district: 'Mukono',
//       hospital_name: 'St. Francis Mukono Medical Centre',
//       category: 'IP',
//       hospital_contact_person: 'Marris Nakayaga',
//       hospital_address: 'Mukono Ssaza Road',
//       hospital_contact: '0782 884415'
//     },
//     {
//       district: 'Nagalama',
//       region: 'Central Region',
//       hospital_name: 'St. Francis Naggalama Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Sr Jane Frances/Francis',
//       hospital_address: 'P.O Box-22004, Naggalama',
//       hospital_contact: '0392-702-709/0772-593-665/0776-880-211'
//     },
//     {
//       district: 'Natete',
//       region: 'Central Region',
//       hospital_name: 'Vision Medical Centre',
//       category: 'IP',
//       hospital_contact_person: 'Dan Zaake',
//       hospital_address: 'Wakaliga Road-Natete',
//       hospital_contact: '0704-768-939'
//     },
//     {
//       district: 'Nkozi',
//       region: 'Central Region',
//       hospital_name: 'Nkozi Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Criscent',
//       hospital_address: 'P.O Box 4349,Kampala ',
//       hospital_contact: '0776-738-723'
//     },
//     {
//       district: 'Mpigi',
//       region: 'Central Region',
//       hospital_name: 'St. Monica Health Center',
//       category: 'IP',
//       hospital_contact_person: 'Sr. Cecilia',
//       hospital_address: 'Mpigi, Katende',
//       hospital_contact: '0706-098-350'
//     },
//     {
//       district: 'Kalangala',
//       region: 'Central Region',
//       hospital_name: 'Eunice Memorial Medical centre',
//       category: 'IP',
//       hospital_contact_person: 'Dr Suubi',
//       hospital_address: 'Kalangala Town Council',
//       hospital_contact: 705945534
//     },
//     {
//       district: 'Kaliro',
//       region: 'Central Region',
//       hospital_name: 'Dr Ambosoli Health Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Dr Ambrose/Bruno',
//       hospital_address: 'Kaliro Town council, Munayeka Rd near Kaliro High school',
//       hospital_contact: '0782-867978/0785-083-087'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Adcare Medical Services',
//       category: 'IP ',
//       hospital_contact_person: 'Eton',
//       hospital_address: 'Near Ethiopian Village at the junction of the Italian Supermarket',
//       hospital_contact: '0705929944/0776-212-847'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Heart services Uganda Ltd',
//       category: 'IP',
//       hospital_contact_person: 'Florence',
//       hospital_address: 'Kitgum House',
//       hospital_contact: '0757-934376/0785-580855'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Nsambya Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Rose',
//       hospital_address: 'Plot 57 Nsambya-Ggaba road',
//       hospital_contact: '0701-417-478'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Paramount Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Simon Begumisa',
//       hospital_address: 'Gadaffi Road',
//       hospital_contact: '0700 873155'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Welington Wellness Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Hellen Nabwire',
//       hospital_address: 'Medical Hub Yusuf Lule road next to Fairway Hotel',
//       hospital_contact: '0776-832-820/0393-217-854'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Mukwaya General Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Elijah Semalulu',
//       hospital_address: 'Opp. American Embassy',
//       hospital_contact: '0702-132 123 / 0788-268 682'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Case Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Brian Nyegenye',
//       hospital_address: 'Plot 69-71 Buganda Road',
//       hospital_contact: '0702-917-495/0312-250700'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Marie stopes Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Dorcus',
//       hospital_address: 'Forest mall,',
//       hospital_contact: '0775 274373'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Norvik Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Isaac',
//       hospital_address: 'Kampala road',
//       hospital_contact: '0704-143507'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Kampala Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Jude Kigozi',
//       hospital_address: 'Kololo Makindu close',
//       hospital_contact: '0312-563400/0783-893650'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'International Hospital Kampala',
//       category: 'IP ',
//       hospital_contact_person: 'Herbert Mukova',
//       hospital_address: 'Namuwongo',
//       hospital_contact: '0312 200 400/0752-966-812/0753-242-688'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Bugolobi Medical Centre',
//       category: 'IP',
//       hospital_contact_person: 'Owor Gilbert',
//       hospital_address: 'Bugolobi',
//       hospital_contact: '0777 717034'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'UMC Victoria Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Dr.Jjuko',
//       hospital_address: 'Bukoto. P.O Box 72587 Kampala',
//       hospital_contact: '0773-422034'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Kyadondo Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Musoke',
//       hospital_address: 'Tula road Kawempe',
//       hospital_contact: '0705929944/0772-483-267'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Span medicare',
//       category: 'IP ',
//       hospital_contact_person: 'Miss Catherine',
//       hospital_address: 'Kisaasi Trading Centre',
//       hospital_contact: '0752-049829/0754-035106'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'CTC Medical center',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Arnold/ Ivan',
//       hospital_address: 'Kyengera- Next to DFCU Bank',
//       hospital_contact: '0772-613-300/0759-577-871'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Lubaga hospital',
//       category: 'IP',
//       hospital_contact_person: 'Deus/Sylvia',
//       hospital_address: 'Lubaga',
//       hospital_contact: '0781-807-627/0701-605-148'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Mengo Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Lincoln/Brenda Naggawa',
//       hospital_address: 'Mengo Off Sir Albert cook road',
//       hospital_contact: '0414 270222 /0704-499-907/0756-507-476'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: "Doctor's Medical Centre",
//       category: 'IP',
//       hospital_contact_person: 'Dr. Kabanda/Carol Admin',
//       hospital_address: 'Mpererwe-gayaza rd',
//       hospital_contact: '0702961561(Dr. Kabanda)/0773-251-408(Carol)'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Millineum medical center',
//       category: 'IP ',
//       hospital_contact_person: 'Dan Zaake',
//       hospital_address: 'Nsangi',
//       hospital_contact: '0704-768-939'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Life Link Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Carol',
//       hospital_address: 'Ntinda, Opposite Caltex',
//       hospital_contact: '+256 712 965505/0312-294-998'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Kampala West Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Benson Tumwesigye/Hope',
//       hospital_address: 'Rubaga road next to Hotel Sojovalo',
//       hospital_contact: '0717-162476/0753-844-159'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Vision Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Dan Zaake',
//       hospital_address: 'Wakaliga Road-Natete',
//       hospital_contact: '0704-768-939'
//     },
//     {
//       district: 'Kampala',
//       region: 'Central Region',
//       hospital_name: 'Henrob Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Kiggundu Spire',
//       hospital_address: 'Zana Entebbe Road',
//       hospital_contact: '0757-104596 /0782-104-596'
//     }
//   ],
//   "Western Region": [
//     {
//       district: 'Lwengo',
//       region: 'Western Region',
//       hospital_name: 'Migisha Clinic',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Mugisha Joseph',
//       hospital_address: 'Lwengo Town',
//       hospital_contact: '0772-444-784'
//     },
//     {
//       district: 'Kakumiro',
//       region: 'Western Region',
//       hospital_name: 'Rinamo Medical Centre  ',
//       category: 'IP ',
//       hospital_contact_person: 'Crissy',
//       hospital_address: 'Kakumiro town',
//       hospital_contact: '0774-725761/0705-200-275'
//     },
//     {
//       district: 'Lyantonde',
//       region: 'Western Region',
//       hospital_name: 'Born Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Kizza Isaiah',
//       hospital_address: 'P. O. Box 18, Lyantonde',
//       hospital_contact: '0772-495779/0701-462-459'
//     },
//     {
//       district: 'Masaka',
//       region: 'Western Region',
//       hospital_name: 'Allied Medicare Services',
//       category: 'IP ',
//       hospital_contact_person: 'Bawakanya Stephen',
//       hospital_address: 'Pliot 5 Elgin Road Masaka',
//       hospital_contact: '0702-427-668'
//     },
//     {
//       district: 'Masaka',
//       region: 'Western Region',
//       hospital_name: 'Masaka Regional Referra Hopital',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Dada/Dr. Nathan/Beatrice/Ronald',
//       hospital_address: 'Makaka',
//       hospital_contact: '0782-017098/0772-433809/0781-141-755/0776-977-114'
//     },
//     {
//       district: 'Masaka',
//       region: 'Western Region',
//       hospital_name: 'Kitovu hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Jude/Sr Pauline',
//       hospital_address: 'Kitovu',
//       hospital_contact: '0756-440-056/0752-556-712/0702-683461'
//     },
//     {
//       district: 'Sembabule',
//       region: 'Western Region',
//       hospital_name: 'Beacof Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Dr Asuman',
//       hospital_address: 'Sembabule Town',
//       hospital_contact: '0779-147033'
//     },
//     {
//       district: 'Mbarara',
//       region: 'Western Region',
//       hospital_name: 'International Medical Center',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Lubega Paul/Scovia Eryenyu',
//       hospital_address: 'Mbarara complex building -Mbaguta street',
//       hospital_contact: '0393 - 280- 696'
//     },
//     {
//       district: 'Kihihi',
//       region: 'Western Region',
//       hospital_name: 'Kigezi Community Medical Centre',
//       category: 'IP',
//       hospital_contact_person: 'Dr Joshua',
//       hospital_address: 'Kihihi Town',
//       hospital_contact: '0779-218416'
//     },
//     {
//       district: 'Bushenyi',
//       region: 'Western Region',
//       hospital_name: 'Bushenyi Medical Centre',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Namanya Viann',
//       hospital_address: 'Along Bushenyi-Mbarara Rd',
//       hospital_contact: '0705-881-084/0779-416-224'
//     },
//     {
//       district: 'Ishaka',
//       region: 'Western Region',
//       hospital_name: 'KIU- Teaching Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Prof. Sebuufu/ Carol Admin',
//       hospital_address: 'Within KIU University',
//       hospital_contact: '0772-507-248/0701-326-132'
//     },
//     {
//       district: 'Ibanda',
//       region: 'Western Region',
//       hospital_name: 'Ibanda hospital-Kagongo',
//       category: 'IP ',
//       hospital_contact_person: 'kyengera',
//       hospital_address: 'Ibanda',
//       hospital_contact: '0787-088100'
//     },
//     {
//       district: 'Kabale',
//       region: 'Western Region',
//       hospital_name: 'Rugarama Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Gilbert Mateeka',
//       hospital_address: 'Kabale town',
//       hospital_contact: '0486-422-628/0773-455618'
//     },
//     {
//       district: 'Kabale',
//       region: 'Western Region',
//       hospital_name: 'Kabale Hospital Private wing',
//       category: 'IP',
//       hospital_contact_person: 'Justus',
//       hospital_address: 'Kabale town',
//       hospital_contact: '0775-273-584'
//     },
//     {
//       district: 'Kihihi',
//       region: 'Western Region',
//       hospital_name: 'Bwindi Community Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Enock',
//       hospital_address: 'Bwindi-Kihihi',
//       hospital_contact: '0782-890884'
//     },
//     {
//       district: 'Kanungu',
//       region: 'Western Region',
//       hospital_name: 'Rugyeyo hospital',
//       category: 'IP',
//       hospital_contact_person: 'Tracy/Trust',
//       hospital_address: 'Kanungu',
//       hospital_contact: '0782 875 531/0787-536-576'
//     },
//     {
//       district: 'Kanungu',
//       region: 'Western Region',
//       hospital_name: 'Nyakatare Health Centre III',
//       category: 'IP',
//       hospital_contact_person: 'Ritah Katumba/Nexon',
//       hospital_address: '12 Hours',
//       hospital_contact: 'Nex-0775-620-596/0700-620-596'
//     },
//     {
//       district: 'Rukungiri',
//       region: 'Western Region',
//       hospital_name: 'St. Karoil Lwanga Nyakibale Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Claudio/Alex',
//       hospital_address: 'Rwakabengo rd, Rukungiri municipality',
//       hospital_contact: '0772-443-572&0705-541-028/0772-321-478'
//     },
//     {
//       district: 'Kisoro',
//       region: 'Western Region',
//       hospital_name: 'Mutolere Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Mayunga Godfrey/Peter Tuyikunde',
//       hospital_address: 'Kisoro town',
//       hospital_contact: '0783 647 635/0752-140-702'
//     },
//     {
//       district: 'Kasese',
//       region: 'Western Region',
//       hospital_name: 'Kilembe Mines Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Ben/ Sr. Betilda',
//       hospital_address: 'Kilembe',
//       hospital_contact: '0783-353881/0782-915170'
//     },
//     {
//       district: 'Kasese',
//       region: 'Western Region',
//       hospital_name: 'Kasese Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Bernard/Yoledi',
//       hospital_address: 'Kyebambe rd, Opp. Catholic cemetry',
//       hospital_contact: '0701-756712/0392-908493'
//     },
//     {
//       district: 'Fortportal',
//       region: 'Western Region',
//       hospital_name: 'Fort portal regional hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Nyakana Samuel',
//       hospital_address: 'P.O BOX 10,FORT PORTAL',
//       hospital_contact: '0772-834-486'
//     },
//     {
//       district: 'Fortportal',
//       region: 'Western Region',
//       hospital_name: 'Kabarole Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Dr Mugisha',
//       hospital_address: 'Fortportal Town',
//       hospital_contact: '0703-825140'
//     },
//     {
//       district: 'Mubende',
//       region: 'Western Region',
//       hospital_name: 'True Vine Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Emmanuel',
//       hospital_address: 'Mubende municipality. P.O. Box 1665 Masaka',
//       hospital_contact: '0704 284351'
//     },
//     {
//       district: 'Kiryadongo',
//       region: 'Western Region',
//       hospital_name: 'Kiryadondo Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Gamel',
//       hospital_address: 'Kiryandongo town center',
//       hospital_contact: '0782-506-093'
//     }
//   ],
//   "Eastern Region": [
//     {
//       district: 'KAYUNGA',
//       region: 'Eastern Region',
//       hospital_name: 'Jonathan Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Patrick/Kakooza',
//       hospital_address: 'Hospital lane next to Umeme Offices ',
//       hospital_contact: '0756-649-688/0706-730-664'
//     },
//     {
//       district: 'KAYUNGA',
//       region: 'Eastern Region',
//       hospital_name: 'Suubi medical center',
//       category: 'IP ',
//       hospital_contact_person: 'Mpooya Simon',
//       hospital_address: 'Kayunga Town Council ',
//       hospital_contact: '0772-670-744'
//     },
//     {
//       district: 'BUGIRI',
//       region: 'Eastern Region',
//       hospital_name: 'Fastline Medical Center',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Isabirye Stephen',
//       hospital_address: 'Plot 99 Kaune Wakooli Road',
//       hospital_contact: '0772 664318 /0783 375332'
//     },
//     {
//       district: 'Namayingo',
//       region: 'Eastern Region',
//       hospital_name: 'Santa Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Dr John Paul',
//       hospital_address: 'Namayingo Town',
//       hospital_contact: '0788-322099'
//     },
//     {
//       district: 'IGANGA',
//       region: 'Eastern Region',
//       hospital_name: 'Mercy  Health Center',
//       category: 'IP ',
//       hospital_contact_person: 'Innocent Mugabi',
//       hospital_address: 'Plot 7/9 bulamu Iganda',
//       hospital_contact: '0703-895-928'
//     },
//     {
//       district: 'Kaliro',
//       region: 'Eastern Region',
//       hospital_name: 'Dr Ambosoli Health Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Dr Ambrose/Bruno',
//       hospital_address: 'Kaliro Town council, Munayeka Rd near Kaliro High school',
//       hospital_contact: '0782-867978/0785-083-087'
//     },
//     {
//       district: 'Mayuge',
//       region: 'Eastern Region',
//       hospital_name: 'JK Pancrass Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Joseph',
//       hospital_address: 'Mayuge Town Council, Kaguta Rd',
//       hospital_contact: '0774 931798'
//     },
//     {
//       district: 'KAMULI',
//       region: 'Eastern Region',
//       hospital_name: 'Kamuli Mission Hospital(Lubaga)',
//       category: 'IP ',
//       hospital_contact_person: 'Ronald',
//       hospital_address: 'P.O BOX 99, Kamuli town',
//       hospital_contact: '0774-187-499/0755-187-499'
//     },
//     {
//       district: 'JINJA',
//       region: 'Eastern Region',
//       hospital_name: 'Crescent medical centre',
//       category: 'IP ',
//       hospital_contact_person: 'Abdallah/ Ssjjabi',
//       hospital_address: 'Jinja Town',
//       hospital_contact: '0702 678240/0702 417284'
//     },
//     {
//       district: 'BUSIA',
//       region: 'Eastern Region',
//       hospital_name: "Emram Doctor's clinic",
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Tusiime Emmanuel',
//       hospital_address: 'Busia Municipality',
//       hospital_contact: '0773-375551'
//     },
//     {
//       district: 'JINJA',
//       region: 'Eastern Region',
//       hospital_name: 'International Medical Centre',
//       category: 'IP ',
//       hospital_contact_person: 'Joseph Nyanzi/ Agasha Carol',
//       hospital_address: 'Plot 14 Circular Road',
//       hospital_contact: '0434-122-499 /0712-856-200/ 0712-484-846'
//     },
//     {
//       district: 'PALLISA',
//       region: 'Eastern Region',
//       hospital_name: 'Townside Clinic',
//       category: 'IP ',
//       hospital_contact_person: 'Dr. Samuel Okoit',
//       hospital_address: 'Paliisa town',
//       hospital_contact: '0704-556-667'
//     },
//     {
//       district: 'TORORO',
//       region: 'Eastern Region',
//       hospital_name: 'Divine Mercy Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Josue',
//       hospital_address: 'Tororo',
//       hospital_contact: '0772413166'
//     },
//     {
//       district: 'MBALE',
//       region: 'Eastern Region',
//       hospital_name: 'International medical centre',
//       category: 'IP',
//       hospital_contact_person: 'Sylvia',
//       hospital_address: 'Mbale town',
//       hospital_contact: '0781 221 703/0392 000 054'
//     },
//     {
//       district: 'KUMI',
//       region: 'Eastern Region',
//       hospital_name: 'Kumi Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Robert',
//       hospital_address: 'P.O BOX 09, Ongino',
//       hospital_contact: '0776-221443'
//     },
//     {
//       district: 'KAPCHORWA',
//       region: 'Eastern Region',
//       hospital_name: 'Masha Clinic',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Boyo Alfred',
//       hospital_address: 'Plot 5 Chemonges Road',
//       hospital_contact: '0772 984 947'
//     }
//   ],
//   "Karamoja Region": [
//     {
//       district: 'Moroto',
//       region: 'Karamoja Region',
//       hospital_name: 'Amudat Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Jane',
//       hospital_address: 'Amudat, P.O Box 44 Moroto',
//       hospital_contact: '0782187876'
//     },
//     {
//       district: 'Moroto',
//       region: 'Karamoja Region',
//       hospital_name: 'Rainbow Empirical Medical Centre',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Paul Olong',
//       hospital_address: 'Huzafrans House Plot 9 Jie Road Campswahili Juu',
//       hospital_contact: ' 0750-584045 '
//     },
//     {
//       district: 'Moroto',
//       region: 'Karamoja Region',
//       hospital_name: 'Fitzmann Medical Services',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Nuwagaba Charles',
//       hospital_address: 'Former mariestopes offices',
//       hospital_contact: '0774 309 908'
//     }
//   ],
//   "West Nile Region": [
//     {
//       district: 'Nebbi',
//       region: 'West Nile Region',
//       hospital_name: 'Nebbi Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Peace Nikum',
//       hospital_address: 'Nebbi town',
//       hospital_contact: '0784 219998'
//     },
//     {
//       district: 'Zombo',
//       region: 'West Nile Region',
//       hospital_name: 'Nyapea Mission Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Dr Omara ',
//       hospital_address: 'Paidha /Zombo',
//       hospital_contact: '0783-725018'
//     },
//     {
//       district: 'ARUA',
//       region: 'West Nile Region',
//       hospital_name: 'Pioneer Medical Centre Arua',
//       category: 'IP',
//       hospital_contact_person: 'Dr. Aldo Pariyo',
//       hospital_address: 'P.O BOX 1124 KOBOKO',
//       hospital_contact: '0392 961427'
//     }
//   ],
//   "Northern Region": [
//     {
//       district: 'Gulu',
//       region: 'Northern Region',
//       hospital_name: 'St.Mary’s Lacor Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Mrs. Iris/Beatrice/Jackie',
//       hospital_address: 'Gulu',
//       hospital_contact: '0471-432-310/0772-365-480/0787-576-636/0777-326438'
//     },
//     {
//       district: 'Oyam',
//       region: 'Northern Region',
//       hospital_name: 'St John Paul Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Sarah',
//       hospital_address: 'Oyam town',
//       hospital_contact: '0780 590859'
//     },
//     {
//       district: 'Amolatar',
//       region: 'Northern Region',
//       hospital_name: 'Hope Charity Medicare',
//       category: 'IP',
//       hospital_contact_person: 'Aloka Bonny Obongi',
//       hospital_address: 'Amolatar',
//       hospital_contact: '0782 807490'
//     },
//     {
//       district: 'Apac',
//       region: 'Northern Region',
//       hospital_name: 'Florence Nightingale Hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Sr. Margaret/Okello Dickson',
//       hospital_address: 'Apac town, P.O BOX 20',
//       hospital_contact: '0772-539-049/0773-875-601'
//     },
//     {
//       district: 'Kitgum',
//       region: 'Northern Region',
//       hospital_name: 'St. Joseph’s Hospital',
//       category: 'IP',
//       hospital_contact_person: 'Dr.Pamela Atim/Robert',
//       hospital_address: 'Mission Road Nyenyiki Village',
//       hospital_contact: '0772-591493/0772-054-72'
//     },
//     {
//       district: 'Agago',
//       region: 'Northern Region',
//       hospital_name: 'St.Ambrosoli Kalongo hospital',
//       category: 'IP ',
//       hospital_contact_person: 'Sr Pamela/Ojok',
//       hospital_address: 'Mission Ward, Kalongo Town Council',
//       hospital_contact: '0772-323072/0782840036'
//     }
//   ],
// };
// for (const region in hospitalList) {
//   const hospitals = hospitalList[region];
//   hospitals.forEach(async (hospital) => {
//     await Hospitals.create({
//       hospital_id: uuidv4(),
//       hospital_name: hospital.hospital_name,
//       category: hospital.category,
//       hospital_contact_person: hospital.hospital_contact_person,
//       hospital_address: hospital.hospital_address,
//       hospital_contact: hospital.hospital_contact,
//       district: hospital.district,
//       region: hospital.region,
//       country: "UGANDA",
//     });
//   });
// }
