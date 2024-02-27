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
exports.playground = exports._sendPolicyRenewalReminder = void 0;
const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize');
const aar_1 = require("./aar");
const sendSMS_1 = __importDefault(require("./sendSMS"));
const db_1 = require("../models/db");
const uuid_1 = require("uuid");
// import { google } from 'googleapis';
// const serviceAccountKeyFile = "./aitel-payment-reconciliation-abe90c6ab59e.json"
// const sheetId = '1Q4IB0vzghTIIirbGdU49UY2FPfESViXaY77oGy44J3I'
// const tabName = 'Ddwaliro Care Airtel Payments'
// const range = 'A:R'
const _sendPolicyRenewalReminder = (phone_number, type = 'reminder') => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const policy = yield db_1.db.policies.findOne({
            where: {
                phone_number: phone_number,
                policy_status: 'paid',
                installment_type: 2,
                //installment_order: 1,
                partner_id: 2,
            }
        });
        if (!policy) {
            return {
                status: false,
                message: "policy not found"
            };
        }
        let message;
        if (type == 'reminder') {
            const reminder_message = `Dear ${policy.first_name} ${policy.last_name}, your monthly premium payment for ${policy.beneficiary} ${policy.policy_type} Medical cover of UGX ${policy.premium} is DUE. Dial *185*7*6*3# to renew.`;
            console.log(reminder_message);
            message = reminder_message;
        }
        else if (type == "policy_number") {
            const customer = yield db_1.db.users.findOne({
                phone_number: phone_number.substring(3)
            });
            if (!customer.arr_member_number) {
                const arrMember = yield (0, aar_1.getMemberNumberData)(phone_number);
                console.log(arrMember);
                if (arrMember.code == 624 || arrMember.code == 400) {
                    yield (0, aar_1.registerPrincipal)(customer, policy);
                    return {
                        status: true,
                        message: "successfully resent reminder sms"
                    };
                }
                else {
                    console.log("arr member number", arrMember.data.member_number);
                    const policy_number_message = `Dear customer, your Ddwaliro Care Policy number is ${customer.arr_member_number}. Present this to the hospital whenever you have a claim. To renew, dial *185*7*6*3# and check on My Policy.`;
                    message = policy_number_message;
                }
            }
            else {
                const policy_number_message = `Dear customer, your Ddwaliro Care Policy number is ${customer.arr_member_number}. Present this to the hospital whenever you have a claim. To renew, dial *185*7*6*3# and check on My Policy.`;
                message = policy_number_message;
            }
        }
        else {
            throw new Error("type not recognized");
        }
        if (message == undefined) {
            throw new Error("message not defined");
        }
        sendSMS_1.default.sendSMS(2, policy.phone_number, message);
        return {
            status: true,
            message: "successfully resent reminder sms"
        };
    }
    catch (error) {
        console.log(error);
    }
});
exports._sendPolicyRenewalReminder = _sendPolicyRenewalReminder;
// /*
// function to pull data from google sheets and update the database
// Workflow:
// 1. The cron job will run every 24 hours
// 2. The cron job will pull data from the google sheets
// 3. The cron job will update the database with the new data
// */
// async function main() {
//   try {
//     // Generating google sheet client
//     const googleSheetClient = await _getGoogleSheetClient();
//     // Reading Google Sheet from a specific range
//     const data = await _readGoogleSheet(googleSheetClient, sheetId, tabName, range);
//     console.log(data.length);
//     data.forEach(async (row) => {
//       let paymentData = {
//         id: row[0],
//         transaction_id: row[1],
//         external_reference: row[2],
//         transaction_date: row[3],
//         phone_number_mobile_number: row[4],
//         transaction_amount: row[6],
//         payment_status: row[13],
//         buyer_details: row[14],
//       }
//       console.log(paymentData);
//       // check if the data is in the database policy table paid
//       let policies = await db.policies.findAll({
//         where: {
//           phone_number: `+256${paymentData.phone_number_mobile_number}`,
//           policy_status: 'paid',
//           premium: parseInt(paymentData.transaction_amount.replace(/,/g, ''), 10)
//         }
//       })
//       console.log("POLICIES", policies);
//       if (policies.length == 0) {
//         // update the policy table with the transaction id and the external reference
//         //   await db.policies.update({
//         //     transaction_id: paymentData.transaction_id,
//         //     external_reference: paymentData.external_reference,
//         //     payment_status: paymentData.payment_status
//         //   }, {
//         //     where: {
//         //       phone_number:  `+256${paymentData.phone_number_mobile_number}`,
//         //       policy_status: 'paid',
//         //       premium:  parseInt(paymentData.transaction_amount.replace(/,/g, ''), 10)
//         //     }
//         //   })
//         // }
//         // create file with the data
//         let data = JSON.stringify(paymentData);
//         await fs.writeFile('paymentData.json', data);
//         console.log('Data written to file');
//       } else {
//         console.log(" policies found");
//       }
//     })
//   } catch (error) {
//     console.log(error);
//   }
//   // Adding a new row to Google Sheet
//   // const dataToBeInserted = [
//   //    ['11', 'rohith', 'Rohith', 'Sharma', 'Active'],
//   //    ['12', 'virat', 'Virat', 'Kohli', 'Active']
//   // ]
//   //await _writeGoogleSheet(googleSheetClient, sheetId, tabName, range, dataToBeInserted);
// }
// async function _getGoogleSheetClient() {
//   const auth = new google.auth.GoogleAuth({
//     keyFile: serviceAccountKeyFile,
//     scopes: ['https://www.googleapis.com/auth/spreadsheets'],
//   });
//   const authClient = await auth.getClient();
//   return google.sheets({
//     version: 'v4',
//     auth: authClient,
//   });
// }
// async function _readGoogleSheet(googleSheetClient, sheetId, tabName, range) {
//   const res = await googleSheetClient.spreadsheets.values.get({
//     spreadsheetId: sheetId,
//     range: `${tabName}!${range}`,
//   });
//   return res.data.values;
// }
// async function _writeGoogleSheet(googleSheetClient, sheetId, tabName, range, data) {
//   await googleSheetClient.spreadsheets.values.append({
//     spreadsheetId: sheetId,
//     range: `${tabName}!${range}`,
//     valueInputOption: 'USER_ENTERED',
//     insertDataOption: 'INSERT_ROWS',
//     resource: {
//       "majorDimension": "ROWS",
//       "values": data
//     },
//   })
// }
// phone_number premium
// fill in the transaction_id , phone numbers and the premium
// 99706713701	743605818		14,000
// 99702903262	704379711		5,000
// 99702771221	740274440		10,000
// 99701498799	758193603		18,000
// 99701194110	750871439		5,000
// 99699897109	708574904		18,000
// 99699759088	750934069		5,000
// 99699000069	706563820		18,000
// 99697829262	709333141		18,000
// 99697691588	709811875		14,000
// 99696720163	700230867		18,000
// 99693717821	759487327		5,000
// 99692718638	757234345		5,000
// 99690912771	703584528		20,000
// 99690507400	756962941		5,000
// 99682997474	708017804		5,000
// 99681448902	744729696		5,000
// 99680391513	755058451		5,000
// 99678908539	744670903		10,000
// 99677909010	709333141		18,000
// 99677368315	701451776		65,000
// 99677355485	744501377		5,000
// 99677115870	703649061		10,000
// 99676356286	707263943		10,000
// 99674844120	741304386		5,000
// 99673447090	755721870		10,000
// 99672784765	707002025		5,000
// 99672253815	703125759		5,000
// 99671963571	703125759		5,000
// 99671839380	743424215		5,000
// 99670911344	700841681		5,000
// 99669985313	708674069		5,000
// 99669569816	707146440		5,000
// 99668472962	754836948		10,000
// 99668139458	708454872		5,000
// 99668129302	755083270		5,000
// 99667945067	743180310		5,000
// 99667842787	755083270		5,000
// 99667657427	759785066		5,000
// 99667418787	753016712		5,000
// 99667413516	752511177		10,000
// 99667335759	756085109		5,000
// 99667095974	707336310		5,000
// 99667041167	701083382		5,000
// 99666810130	700432984		10,000
// 99666133993	703058380		18,000
// 99664365475	708948005		10,000
// 99664234337	708948005		10,000
// 99663222901	751945983		5,000
// 99661400192	702832923		18,000
// 99660961529	750961840		10,000
// 99659608238	752288821		20,000
// 99656471947	752625431		5,000
// 99655877331	752625431		5,000
// 99655682449	709169637		5,000
// 99655516021	709169637		5,000
// 99655487834	706324764		5,000
// 99654907991	701476961		10,000
// 99654755483	702153864		5,000
// 99654470604	709005552		14,000
// 99654216851	759940397		18,000
// 99647093840	759940397		18,000
// 99646093486	708017804		18,000
// 99645913483	740652878		10,000
// 99645841757	742904522		14,000
// 99645518538	707048544		5,000
// 99645403443	752759470		5,000
// 99644243356	752588827		5,000
// 99644193506	756885097		10,000
// 99643892324	756885097		10,000
// 99641070567	754724152		5,000
// 99641005514	708017804		18,000
// 99640386630	701539367		18,000
// 99638752941	752674759		20,000
// 99624740562	702555180		65,000
// 99621489756	705602877		18,000
// 99620277854	703714328		5,000
// 99619851776	701977141		5,000
// 99618444739	705165303		5,000
// 99617417649	752300704		10,000
// 99616602894	757605064		18,000
// 99613302599	750908111		5,000
// 99612813712	752385001		10,000
// 99611561064	707232204		10,000
// 99611317433	700990835		5,000
// 99611291760	751015977		5,000
// 99610240366	702477246		5,000
// 99608020503	708773775		18,000
// 99606855532	759564947		18,000
// 99599828134	709751669		5,000
// 99597535198	755762807		5,000
// 99596770864	759792202		5,000
// 99596027407	752080578		5,000
// 99595938405	757805494		10,000
// 99593983961	741323875		5,000
// 99590846311	702655422		14,000
// 99590207501	759792202		5,000
// 99589357784	701125080		18,000
// 99588835709	701125080		18,000
// 99587378384	753034802		5,000
// 99585549213	754548397		18,000
// 99585051527	704195561		5,000
// 99584684052	704195561		5,000
// 99584434597	741172063		10,000
// 99584232170	742770092		10,000
// 99581091743	700422327		5,000
// 99579984888	755181187		18,000
// 99579782709	744071200		5,000
// 99579762063	753237625		14,000
// 99579648205	753918935		14,000
// 99578478670	704070028		5,000
// 99575383211	753911631		5,000
// 99573787204	750474904		14,000
// 99561662287	705421663		5,000
// 99559692877	702291290		5,000
// 99549425415	701539367		5,000
// 99540722018	744021641		18,000
// 99529371974	702598312		14,000
// 99522313596	703930541		5,000
// 99516723329	755567734		10,000
// 99516264162	757457134		5,000
// 99515731731	702382943		10,000
// 99506633803	757991700		18,000
// 99501285323	709003772		10,000
// 99501145653	709003772		14,000
// 99494914034	751768075		10,000
// 99490044134	740543452		10,000
// 99486607157	755756614		5,000
// 99485489548	709896417		10,000
// 99481431568	700445683		5,000
// 99477237488	744844696		5,000
// 99468669603	708090515		5,000
// 99467818207	741349887		18,000
// 99461508606	709845531		40,000
// 99460273523	757422629		10,000
// 99458597303	740672809		5,000
// 99458339221	704036045		5,000
// 99458265142	754686588		5,000
// 99457455167	700735909		5,000
// 99455912965	744696834		5,000
// 99451726085	706473534		10,000
// 99433399504	744844696		5,000
// 99427394883	742255640		10,000
// 99423028908	752695459		5,000
// 99421805529	752906699		10,000
// 99421569830	701471443		10,000
// 99416808831	750224639		18,000
// 99415894659	752385211		10,000
// 99415011494	752602764		5,000
// 99414272385	750615474		5,000
// 99414007435	753272616		18,000
// 99413639085	700964467		5,000
// 99413398970	743944531		18,000
// 99410788624	750615474		5,000
// 99405859814	756885097		10,000
// 99397127131	709751243		5,000
// 99394283910	750391342		10,000
// 99387356023	757700832		10,000
// 99378892254	740320510		14,000
// 99378461861	742249990		35,000
// 99373490241	753552367		5,000
// 99369952283	704997366		10,000
// 99369433155	758040870		5,000
// 99368858847	751271947		5,000
// 99367380470	702382943		10,000
// 99365438835	704962406		18,000
// 99365420558	756629997		5,000
// 99365392240	709295910		5,000
// 99364360459	703546257		5,000
// 99361239620	751085696		5,000
// 99344002721	705016199		10,000
// 99332728652		701966349		10,000
// 99329052397		750949243		5,000
// 99328265397		750949243		5,000
// 99326079942		706438203		5,000
// 99325484171		709375625		10,000
// 99321682860		742770092		10,000
// 99317336310		744514495		20,000
// 99315990219		705261472		14,000
// 99312600911		706470044		10,000
// 99308426079		752759470		5,000
// 99294416503		751449619		5,000
// 99294332503		751449619		5,000
// 99280464493		707148731		5,000
// 99269350528		707459671		5,000
// 99263147348		708804596		5,000
// 99258799629		741564926		14,000
// 99246494549	700107773		5,000
// 99245431710	705409044		10,000
// 99244928340	752874433		5,000
// 99242246191		709259294		18,000
// 99241545909		701148676		5,000
// 99238152565		750997514		18,000
// 99237511006		744217621		10,000
// 99222066434		751580313		10,000
// 99221647010		701734676		5,000
// 99218016450		706390288		14,000
// 99216965079		708804883		5,000
// 99216924909		741181439		18,000
// 99215304385		750391342		10,000
// 99207878373		750353494		5,000
// 99192153166	754286570		5,000
// 99188301324	750526852		10,000
// 99183542298	702756075		14,000
// 99183160670	752820398		5,000
// 99181925086	752200859		20,000
// 99180774297	756891970		5,000
// 99180740937	756007373		5,000
// 99178271435	756799788		10,000
// 99176139726	753179029		25,000
// 99175955155	741135828		5,000
// 99171916106	756325137		14,000
// 99170766656	759309187		18,000
// 99169475208	753591573		10,000
// 99168486167	700348993		5,000
// 99167326677	753369439		14,000
// 99167257239	753632774		10,000
// 99167022844	743015929		5,000
// 99163885615	708072795		10,000
// 99163035778	742870415		35,000
// 99160479509	743451103		5,000
// 99158736425	740042971		10,000
// 99153071698	701788229		60,000
// 99150404297	756891970		5,000
// 99135592425	758929894		10,000
// 99123846113	750867867		10,000
// 99122395747	704242116		10,000
// 99120408159	755790714		14,000
// 99118308822	758063324		14,000
// 99116702050	701422210		18,000
// 99109097420	707747872		14,000
// 99108941697	702846970		10,000
// 99103426273	755326045		10,000
// 99097530841	702326336		18,000
// 9909166913	706350794		40,000
// 99083616084	743452109		10,000
// 99081700182	702453962		10,000
// 99081171292	742346415		10,000
// 99075456804	757351174		35,000
// 99066954568	740430913		10,000
// 99058366046	707515769		10,000
// 99058356046	707515769		10,000
// 99053426608	759819993		10,000
// 99052906306	752928241		10,000
// 99050992335	709921132		18,000
// 99046591423	705867461		14,000
// 99045683107	754687805		18,000
// 9904218731	707337877		10,000
// 9904131931	700553748		10,000
// 99027095953	742374012		10,000
// 99023066248	750094022		10,000
// 99013850972	709982024		18,000
// 99007543379	702622662		10,000
// 99001689751	754536753		18,000
// 99000971056	709594217		18,000
// 98998614479	758820705		10,000
// 98996292187	740064665		18,000
// 98995982187	740064665		18,000
// 98960822416	758960852		10,000
// 98960242416	758960852		10,000
// 98955696246	708797328		18,000
// 98955394810	759271197		5,000
// 98954707657	742393730		18,000
// 98952120599	741338697		5,000
// 98951881022	756974709		10,000
// 98951101002	753041936		5,000
// 9894431345	  759640308		14,000
// 9893997885	  701132458		10,000
// 98931136884	759309187		10,000
// 98930756656	759309187		18,000
// 98930516656	759309187		18,000
// 98920485028	709660722		18,000
// 98912335028	709660722		18,000
// 98900472931	759232446		10,000
// 98897033107	754687805		18,000
// 9888811391	 750722088		10,000
// 98879453553	752673009		10,000
// 98875305028	742046386		10,000
// 98875153218	709671400		10,000
// 98871372384	702313410		10,000
// 98869522477	751381257		10,000
// 98868647043	706217626		14,000
// 98865598034	759416097		10,000
// 98862253853	705494401		108,000
// 98858651476	750822561		14,000
// 98858490173	706704906		10,000
// 98852469840	703156645		10,000
// 98850382066	743102689		10,000
// 98849637126	705509981		10,000
// 98849037281	754288488		18,000
// 98847072751	706473534		10,000
// 98834975381	758669477		18,000
// 9883101810	752322768		10,000
// 98824440007	751340756		18,000
// 98822280806	754155391		18,000
// 98792761621	706452629		10,000
// 98792572326	740105366		10,000
// 98792148297	743098988		18,000
// 98792011278	702025183		10,000
// 9877421255	754448860		10,000
// 98773213194	752240527		10,000
// 98772706495	744847714		10,000
// 98770367727	753674458		10,000
// 98766478261	755733412		10,000
// 98754581917	752445841		10,000
// 98752445021	707183900		10,000
// 98749197223	756681409		10,000
// 98748911917	752445841		10,000
// 98742239196	751825675		18,000
// 98741899508	753287232		10,000
// 98741649508	753287232		10,000
// 98739054412	742249990		35,000
// 98735954689	757700832		10,000
// 98735031659	753445947		18,000
// 98731310397	757316815		10,000
// 9873026963	  756225704		10,000
// 9872375361	  743102689		35,000
// 9872365361	  743102689		60,000
// 9872354206	  743102689		30,000
// 9872344206	  743102689		15,000
// 9872334206	  743102689		60,000
// 9872304206	  743102689		60,000
// 9872254206	  743102689		5,000
// 98720242804	703673807		10,000
// 98708775413	754548397		18,000
// 98705632709	753894746		18,000
// 98702912991	707916644		10,000
// 98691777775	743988741		18,000
// 98691649892	757316815		10,000
// 98684129075	708445172		14,000
// 98683044705	757054083		30,000
// 98677479822	702020193		10,000
// 98676572997	740464840		10,000
// 98668770832	758458320		10,000
// 98658870502	757176888		10,000
// 98648589417	705792536		14,000
// 98641542161	706558484		18,000
// 98638788219	751624278		10,000
// 98636693333	707061541		10,000
// 98633573967	753325282		18,000
// 98632515515	742157279		35,000
// 98607510069	758256448		14,000
// 98599098694	755972674		10,000
// 98598795483	755972674		10,000
// 98598286291	754232893		10,000
// 98593390180	704151547		14,000
// 98586547615	759242360		10,000
// 98581924942	759584431		10,000
// 98581219998	703667078		10,000
// 98580057889	706739042		10,000
// 98579849249	708588984		10,000
// 98578787462	754727344		18,000
// 98576627708	751060363		10,000
// 98565324687	708564337		10,000
// 98563973855	708564337		10,000
// 98555008623	743805039		18,000
// 98542555830	744527784		10,000
// 98536599504	758328972		10,000
// 98526406693	703545399		14,000
// 98518554965	741491601		10,000
// 98513014937	741838202		10,000
// 98505145644	707844371		14,000
// 98504902386	707844371		14,000
// 98504525017	758702997		10,000
// 98504146329	707844371		20,000
// 98486820558	742266886		14,000
// 98483562886	750191226		18,000
// 98482173257	751878278		14,000
// 98480297521	703571290		10,000
// 98474077212	740370315		18,000
// 98472051804	740370315		18,000
// 98470420437	757082835		20,000
// 98461283637	753918935		14,000
// 98456151709	741853521		18,000
// 98455345803	759904866		10,000
// 98453853785	751969417		10,000
// 98453345384	751969417		10,000
// 98442150902	707928643		14,000
// 98441749114	702974423		50,000
// 98438407929	707515769		10,000
// 98435109201	709575040		10,000
// 98434252464	741567893		10,000
// 98433887107	741567893		10,000
// 98431074694	702655422		14,000
// 98426536701	701148676		18,000
// 98422827126	742935120		10,000
// 98417490123	706203037		10,000
// 98417326093	707061541		10,000
// 98415554373	751763727		18,000
// 98413882881	708026523		10,000
// 98412447146	702242511		10,000
// 98411513566	709226383		10,000
// 98410936772	709226383		10,000
// 98410723080	754212429		10,000
// 98407779169	753439109		10,000
// 98406811677	709797230		18,000
// 98403393313	757754324		18,000
// 98402860284	755525587		10,000
// 98391426894	743016943		10,000
// 98384403828	744577638		10,000
// 98381554615	700611306		18,000
// 98372183093	758453207		10,000
// 98364358119	742935120		10,000
// 98364289758	742935120		10,000
// 98364219025	742935120		10,000
// 98364157331	742935120		10,000
// 98364049925	742935120		10,000
// 98363983912	742935120		10,000
// 98363840461	742935120		10,000
// 98363786530	742935120		10,000
// 98363696096	742935120		10,000
// 98363653821	742935120		10,000
// 98363590039	742935120		10,000
// 98363473866	742935120		10,000
// 98359790408	754777661		18,000
// 98359682887	701106857		10,000
// 98359511354	742935120		10,000
// 98359361993	742935120		10,000
// 98359305643	742935120		10,000
// 98359257199	742935120		10,000
// 98359173970	742935120		10,000
// 98358941061	742935120		10,000
// 98358915157	708826247		18,000
// 98357623672	754777661		18,000
// 98351128190	753471346		10,000
// 98339482219	753679879		10,000
// 98310192260	759309187		10,000
// 98299836845	704889876		14,000
// 98290486976	706645394		10,000
// 98278444130	702210391		10,000
// 98271341767	755789817		10,000
// 98267086413	743681451		10,000
// 98265905460	755789817		10,000
// 98259850595	702094754		18,000
// 98250248985	741493273		18,000
// 98235581680	750923008		18,000
// 98234073995	742036811		10,000
// 98233436953	742121920		10,000
// 98224484534	759482755		18,000
// 98218212655	701010616		10,000
// 98217001409	752674759		20,000
// 98212548303	709266834		10,000
// 98212156670	709266834		10,000
// 98211695215	709090932		10,000
// 98209315470	753213012		10,000
// 98209236474	702190009		14,000
// 98196787951	755701329		10,000
// 98178014969	756359588		10,000
// 98176857175	740439299		10,000
// 98174743494	708774945		10,000
// 98171926842	708127676		10,000
// 98166669109	709979705		10,000
// 98153522034	743026895		65,000
// 98146968859	704086824		18,000
// 98145129381	741934203		18,000
// 98144816633	756639749		14,000
// 98141886588	752410850		18,000
// 98141849597	701460653		50,000
// 98129673967	741284624		10,000
// 98126917124	742172663		10,000
// 98126558802	702326336		18,000
// 98100399407	744392018		14,000
// 98091778763	743159125		10,000
// 98091018930	707422700		18,000
// 98090691922	743159125		10,000
// 98079338126	701046300		10,000
// 98077168470	709843624		18,000
// 98076575513	753300083		20,000
// 98072410601	755292612		10,000
// 98068274348	703402428		10,000
// 98068175926	754292040		40,000
// 98054185888	753122043		10,000
// 98051944124	707175471		10,000
// 98041046836	709829837		10,000
// 98028201083	744340519		10,000
// 98027829648	743789815		18,000
// 98025252019	706556384		18,000
// 98021797669	741441546		10,000
// 98021299231	709484905		36,000
// 98020202680	751969417		10,000
// 98019444410	701301996		10,000
// 98015824005	753382307		18,000
// 98015197442	753382307		18,000
// 98015190419	743102689		10,000
// 98014879314	753382307		18,000
// 98001749198	706759462		30,000
// 97991660715	740708198		14,000
// 97967797179	752609663		10,000
// 97913464305	704173461		10,000
// 97875359119	754486633		10,000
const array_of_phone_numbers = [
    { airtel_money_id: '99706713701', phone_number: '743605818', premium: 14000 },
    { airtel_money_id: '99702903262', phone_number: '704379711', premium: 5000 },
    { airtel_money_id: '99702771221', phone_number: '740274440', premium: 10000 },
    { airtel_money_id: '99701498799', phone_number: '758193603', premium: 18000 },
    { airtel_money_id: '99701194110', phone_number: '750871439', premium: 5000 },
    { airtel_money_id: '99699897109', phone_number: '708574904', premium: 18000 },
    { airtel_money_id: '99699759088', phone_number: '750934069', premium: 5000 },
    { airtel_money_id: '99699000069', phone_number: '706563820', premium: 18000 },
    { airtel_money_id: '99697829262', phone_number: '709333141', premium: 18000 },
    { airtel_money_id: '99697691588', phone_number: '709811875', premium: 14000 },
    { airtel_money_id: '99697599676', phone_number: '739409079', premium: 14000 },
    { airtel_money_id: '99696419382', phone_number: '706722420', premium: 5000 },
    { airtel_money_id: '99696126719', phone_number: '703243294', premium: 10000 },
    { airtel_money_id: '99695900001', phone_number: '708842655', premium: 18000 },
    { airtel_money_id: '99695848480', phone_number: '704840536', premium: 5000 },
    { airtel_money_id: '99695773972', phone_number: '707575940', premium: 18000 },
    { airtel_money_id: '99695619657', phone_number: '705597825', premium: 5000 },
    { airtel_money_id: '99695000701', phone_number: '743446324', premium: 18000 },
    { airtel_money_id: '99694500051', phone_number: '701468443', premium: 18000 },
    { airtel_money_id: '99694487276', phone_number: '744624697', premium: 14000 }
];
// 1. get all the policies that are paid and have airtel money id as null
//select * from policies where policy_status = 'paid' and airtel_money_id is null and partner_id =2
// 2. update the airtel money id 
function updateAirtelMoneyId(array_of_phone_numbers) {
    array_of_phone_numbers.forEach((item) => __awaiter(this, void 0, void 0, function* () {
        const { phone_number, airtel_money_id, premium } = item;
        let policy = yield db_1.db.policies.update({
            airtel_transaction_id: airtel_money_id
        }, {
            where: {
                phone_number: `+256${phone_number}`,
                policy_status: 'paid',
                partner_id: 2,
                premium: premium,
                airtel_transaction_id: null
            }
        });
        console.log(policy);
    }));
}
const _checkIfPolicyExists = (array_of_phone_numbers) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        array_of_phone_numbers.forEach((item) => __awaiter(void 0, void 0, void 0, function* () {
            const { phone_number, premium } = item;
            let policy = yield db_1.db.policies.findAll({
                where: {
                    phone_number: `+256${phone_number}`,
                    policy_status: 'paid',
                    premium: premium,
                    partner_id: 2
                }
            });
            if (policy.length == 0) {
                if (premium == 5000) {
                    let policyNumber = `BW${phone_number}`;
                    let existingUser = yield db_1.db.users.findOne({
                        where: {
                            phone_number: `${phone_number}`
                        }
                    });
                    console.log(existingUser);
                    let policyObject = {
                        policy_id: (0, uuid_1.v4)(),
                        installment_type: 2,
                        installment_order: 1,
                        policy_type: "S MINI",
                        policy_deduction_amount: 5000,
                        policy_pending_premium: 55000,
                        policy_next_deduction_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                        sum_insured: 750000,
                        premium: 5000,
                        yearly_premium: 120000,
                        last_expense_insured: 50000,
                        policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
                        policy_start_date: new Date(),
                        installment_date: new Date().getMonth() + 1,
                        membership_id: existingUser.membership_id,
                        beneficiary: "SELF",
                        policy_status: "paid",
                        policy_paid_amount: 5000,
                        policy_deduction_day: new Date().getDate() - 1,
                        partner_id: 2,
                        country_code: "UGA",
                        currency_code: "UGX",
                        product_id: "d18424d6-5316-4e12-9826-302b866a380c",
                        user_id: existingUser.user_id,
                        phone_number: `+256${phone_number}`,
                        first_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.first_name,
                        last_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.last_name,
                        policy_number: policyNumber
                    };
                    yield db_1.db.policies.create(policyObject);
                }
                else if (premium == 10000) {
                    let policyNumber = `BW${phone_number}`;
                    let existingUser = yield db_1.db.users.findOne({
                        where: {
                            phone_number: `${phone_number}`
                        }
                    });
                    console.log(existingUser);
                    let policyObject = {
                        policy_id: (0, uuid_1.v4)(),
                        installment_type: 2,
                        installment_order: 1,
                        policy_type: "MINI",
                        policy_deduction_amount: 10000,
                        policy_pending_premium: 110000,
                        policy_next_deduction_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                        sum_insured: 1500000,
                        premium: 10000,
                        yearly_premium: 120000,
                        last_expense_insured: 100000,
                        policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
                        policy_start_date: new Date(),
                        installment_date: new Date().getMonth() + 1,
                        membership_id: existingUser.membership_id,
                        beneficiary: "SELF",
                        policy_status: "paid",
                        policy_paid_amount: 10000,
                        policy_deduction_day: new Date().getDate() - 1,
                        partner_id: 2,
                        country_code: "UGA",
                        currency_code: "UGX",
                        product_id: "d18424d6-5316-4e12-9826-302b866a380c",
                        user_id: existingUser.user_id,
                        phone_number: `+256${phone_number}`,
                        first_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.first_name,
                        last_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.last_name,
                        policy_number: policyNumber
                    };
                    yield db_1.db.policies.create(policyObject);
                }
                else if (premium == 14000) {
                    console.log("14,000");
                    let policyNumber = `BW${phone_number}`;
                    let existingUser = yield db_1.db.users.findOne({
                        where: {
                            phone_number: `${phone_number}`
                        }
                    });
                    let policyObject = {
                        policy_id: (0, uuid_1.v4)(),
                        installment_type: 2,
                        installment_order: 1,
                        policy_type: "MIDI",
                        policy_deduction_amount: 14000,
                        policy_pending_premium: 153000,
                        policy_next_deduction_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                        sum_insured: 3000000,
                        premium: 14000,
                        yearly_premium: 167000,
                        last_expense_insured: 1500000,
                        policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
                        policy_start_date: new Date(),
                        installment_date: new Date().getMonth() + 1,
                        membership_id: existingUser.membership_id,
                        beneficiary: "SELF",
                        policy_status: "paid",
                        policy_paid_amount: 14000,
                        policy_deduction_day: new Date().getDate() - 1,
                        partner_id: 2,
                        country_code: "UGA",
                        currency_code: "UGX",
                        product_id: "d18424d6-5316-4e12-9826-302b866a380c",
                        user_id: existingUser.user_id,
                        phone_number: `+256${phone_number}`,
                        first_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.first_name,
                        last_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.last_name,
                        policy_number: policyNumber
                    };
                    yield db_1.db.policies.create(policyObject);
                }
                else if (premium == 18000) {
                    console.log("18,000");
                    let policyNumber = `BW${phone_number}`;
                    let existingUser = yield db_1.db.users.findOne({
                        where: {
                            phone_number: `${phone_number}`
                        }
                    });
                    let policyObject = {
                        policy_id: (0, uuid_1.v4)(),
                        installment_type: 2,
                        installment_order: 1,
                        policy_type: "BIGGIE",
                        policy_deduction_amount: 18000,
                        policy_pending_premium: 190000,
                        policy_next_deduction_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                        sum_insured: 5000000,
                        premium: 18000,
                        yearly_premium: 208000,
                        last_expense_insured: 2000000,
                        policy_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate() - 1)),
                        policy_start_date: new Date(),
                        installment_date: new Date().getMonth() + 1,
                        membership_id: existingUser.membership_id,
                        beneficiary: "SELF",
                        policy_status: "paid",
                        policy_paid_amount: 18000,
                        policy_deduction_day: new Date().getDate() - 1,
                        partner_id: 2,
                        country_code: "UGA",
                        currency_code: "UGX",
                        product_id: "d18424d6-5316-4e12-9826-302b866a380c",
                        user_id: existingUser.user_id,
                        phone_number: `+256${phone_number}`,
                        first_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.first_name,
                        last_name: existingUser === null || existingUser === void 0 ? void 0 : existingUser.last_name,
                        policy_number: policyNumber
                    };
                    yield db_1.db.policies.create(policyObject);
                }
                else {
                    throw new Error("policy not found " + phone_number + " " + premium);
                }
            }
            else {
                console.log("policy found");
            }
        }));
    }
    catch (error) {
        console.log(error);
    }
});
function _updateUserNumberOfPolicies() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Retrieve paid policies and count them per user
            const userPoliciesCount = yield db_1.db.policies.findAll({
                attributes: [
                    'user_id',
                    [db_1.db.sequelize.fn('COUNT', 'user_id'), 'policy_count']
                ],
                where: {
                    policy_status: 'paid',
                },
                group: ['user_id'],
            });
            //console.log(userPoliciesCount);
            // Iterate through each user's policy count and update the corresponding user
            for (const data of userPoliciesCount) {
                const user_id = data.user_id;
                const policy_count = data.dataValues.policy_count;
                console.log(user_id, policy_count);
                if (user_id !== null && policy_count !== null) {
                    yield updateUserPolicyCount(user_id, policy_count);
                }
                else {
                    console.log("Error: Found null user_id for policy count:", policy_count);
                }
            }
            console.log("User policy counts updated successfully");
        }
        catch (error) {
            console.error("Error occurred while updating user policies:", error);
        }
    });
}
function updateUserPolicyCount(user_id, policy_count) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (policy_count == 0 || policy_count == null || policy_count == undefined) {
                return;
            }
            yield db_1.db.users.update({ number_of_policies: policy_count }, { where: { user_id } });
            console.log(`User ${user_id} updated with policy count: ${policy_count}`);
        }
        catch (error) {
            console.error(`Error updating user ${user_id} with policy count: ${policy_count}`, error);
        }
    });
}
/* check if the paid policy exists in the database
  on each policy, check if the the users table has a arr_member_number
  if the arr_member_number is not found, error code 624 is returned

*/
function _checkIfPolicyExistsInAAR() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const policies = yield db_1.db.policies.findAll({
                where: {
                    policy_status: 'paid',
                    policy_type: { [db_1.db.Sequelize.Op.ne]: 'S MINI' },
                    policy_start_date: {
                        [Op.between]: ['2023-08-01', '2024-01-01']
                    }
                },
                include: [{
                        model: db_1.db.users,
                        where: {
                            // arr_member_number: null,
                            partner_id: 2
                        }
                    }]
            });
            for (let i = 0; i < policies.length; i++) {
                const policy = policies[i];
                const customer = policy.user;
                console.log(customer.name, policy.phone_number);
                let update_premium = yield (0, aar_1.updatePremium)(customer, policy);
                console.log(update_premium);
                // let result  = await registerPrincipal(customer, policy);
                // console.log("register member",result);
                // if(result.code == 608){
                //    await getMemberNumberData(customer.phone_number);
                //  }
                // Introduce a delay of 1 second between each iteration
                yield new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        catch (error) {
            console.log(error);
        }
    });
}
// async function _checkIfPolicyExistsInAAR() {
//   try {
//     const policies = await db.policies.findAll({
//       where: {
//         policy_status: 'paid',
//         partner_id: 2,
//       }
//     });
//     for (let i = 0; i < policies.length; i++) {
//       const policy = policies[i];
//       const customer = await db.users.findOne({
//         where: {
//           phone_number: policy.phone_number.substring(4)
//         }
//       });
//       if (!customer.arr_member_number || policy.policy_type !== 'S MINI') {
//         console.log(policy.first_name, policy.last_name, policy.phone_number.substring(4));
//        let result  = await registerPrincipal(customer, policy);
//        console.log(result);
//        if(result.code == 608){
//           await getMemberNumberData(customer.phone_number);
//         }
//       }
//       // Introduce a delay of 1 second between each iteration
//       await new Promise(resolve => setTimeout(resolve, 2000));
//     }
//   } catch (error) {
//     console.log(error);
//   }
// }
const playground = () => __awaiter(void 0, void 0, void 0, function* () {
    //getNewPolicies(2, '2023-01-01', '2024-02-7')
    //numberAndValueOfFailedPayments(2, '2023-01-01', '2024-02-07')
    // sendCongratulatoryMessage(policy, user)
    // _sendPolicyRenewalReminder('757998947')
    //_checkIfPolicyExists(array_of_phone_numbers)
    //_updateUserNumberOfPolicies()
    // _checkIfPolicyExistsInAAR()
    // _updateUserNumberOfPolicies()
    //updateAirtelMoneyId(array_of_phone_numbers);
    console.log("TESTING GROUND");
});
exports.playground = playground;
