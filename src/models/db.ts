const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize')
import cron from 'node-cron';
import { createDependant, fetchMemberStatusData, registerDependant, registerPrincipal, updatePremium } from '../services/aar';
import SMSMessenger from '../services/sendSMS';
import axios from 'axios';
const Agenda = require('agenda');
require('dotenv').config()
const fs = require('fs/promises'); // Use promises-based fs


const sequelize = new Sequelize(process.env.DB_URL, { dialect: "postgres" })

//checking if connection is done
sequelize.authenticate().then(() => {
  console.log(`Database connected to Bluewave! time: ${new Date()}`)
}).catch((err) => {
  console.log(err)
})

export const db: any = {}
db.Sequelize = Sequelize;
db.sequelize = sequelize;

//connecting to model
db.users = require('./User')(sequelize, DataTypes)
db.policies = require('./Policy')(sequelize, DataTypes)
db.claims = require('./Claim')(sequelize, DataTypes)
db.payments = require('./Payment')(sequelize, DataTypes)
db.sessions = require('./Session')(sequelize, DataTypes)
db.beneficiaries = require('./Beneficiary')(sequelize, DataTypes)
db.partners = require('./Partner')(sequelize, DataTypes)
db.products = require('./Product')(sequelize, DataTypes)
db.logs = require('./Log')(sequelize, DataTypes)
db.transactions = require('./Transaction')(sequelize, DataTypes)
db.installments = require('./Installment')(sequelize, DataTypes)
db.user_hospitals = require('./UserHospital')(sequelize, DataTypes)
db.hospitals = require('./Hospital')(sequelize, DataTypes)
db.hospitals_kenya = require('./HospitalKenya')(sequelize, DataTypes)
db.policy_schedules = require('./PolicySchedule')(sequelize, DataTypes)
db.vehicles = require('./Vehicle')(sequelize, DataTypes)


db.users.hasMany(db.policies, { foreignKey: 'user_id' });
db.policies.belongsTo(db.users, { foreignKey: 'user_id' });
db.payments.belongsTo(db.users, { foreignKey: 'user_id' });
db.payments.belongsTo(db.policies, { foreignKey: 'policy_id' });
db.policies.hasMany(db.payments, { foreignKey: 'policy_id' });
db.policies.hasMany(db.claims, { foreignKey: 'policy_id' });
db.claims.belongsTo(db.policies, { foreignKey: 'policy_id' });
db.users.hasMany(db.claims, { foreignKey: 'user_id' });
db.claims.belongsTo(db.users, { foreignKey: 'user_id' });
db.users.hasMany(db.sessions, { foreignKey: 'user_id' });
db.sessions.belongsTo(db.users, { foreignKey: 'user_id' });
db.users.hasMany(db.beneficiaries, { foreignKey: 'user_id' });
db.beneficiaries.belongsTo(db.users, { foreignKey: 'user_id' });
db.users.hasMany(db.transactions, { foreignKey: 'user_id' });
db.transactions.belongsTo(db.users, { foreignKey: 'user_id' });
db.policies.hasMany(db.transactions, { foreignKey: 'policy_id' });
db.transactions.belongsTo(db.policies, { foreignKey: 'policy_id' });


// Your actual code
// const updatePolicies = () => {
//   db.sync() // This ensures that the tables are created before running the queries
//     .then(() => {
//       return db.payments.findAll({
//         where: {
//           payment_status: 'paid',
//         },
//       });
//     })
//     .then((payments) => {
//       return Promise.all(
//         payments.map((payment) => {
//           return db.policies.findAll({
//             where: {
//               policy_id: payment.policy_id,
//               policy_status: 'paid',
//             },
//           })
//             .then((policies) => {
//               return db.users.update(
//                 { number_of_policies: policies.length },
//                 { where: { user_id: payment.user_id } }
//               );
//             })
//             .catch((err) => {
//               console.log(err);
//             });
//         })
//       );
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// };
// let phones =[ 



//   ]
// let all_phone_numbers = [
//   701741153, 752209897, 755610648, 700963885,
//   752528015, 755554903, 758723052, 752609663, 755223010, 756388661, 754535731, 757282041, 701274674, 703196342,
//   709659950, 701058902, 757050083, 703571290, 700163893, 701274674, 703196342, 756668135, 709470334, 752579229,
//   742162833, 708588984, 704558564, 754784615, 742644828, 754302283, 741681962, 759718150, 707911901, 755605556,
//   752560013, 751596320, 756821182, 755366937, 755366937, 741185958, 759071518, 702705468, 752423562, 757353144,
//   755816648, 741827613, 709203779, 755580298, 703282513, 702889121, 757205929, 750431090, 704086824, 705814213,
//   705952252, 705211707, 701565319, 707886771, 700993744, 703695296, 757728878, 701106857, 754177440, 700787003,
//   702559647, 759750610, 709011694, 707420393, 751754051, 742877919, 709190777, 751389100, 757074034, 742660947,
//   755941923, 700456469, 707609316, 759916803, 702906710, 754008281, 707320708, 754416580, 759015513, 702790183,
//   707121789, 701072656, 702029927, 700787848, 759203499, 742316854, 742316854, 759074907, 709247131, 700659605,
//   701377572, 758303153, 709551279, 743453953, 700440544, 709278507, 759773977, 704811422, 751085268, 751194038,
//   753714841, 752883692, 707774730, 752225351, 752560013, 708510859, 742524333, 754072548, 700835797, 707640557,
//   705520531, 755014764, 701792283, 754155216, 704794563, 752909225, 702502728, 751224476, 701435756, 708504613,
//   740504201, 705100734, 752162722, 705762881, 704563728, 705758296, 742256068, 753201326, 742088772, 706617599,
//   751014859, 754997400, 759705276, 754897284, 741859475, 700787003, 740937765, 709892072, 744860116, 753177466,
//   702256430, 755168928, 742141392, 704017842, 704665960, 709358793, 754761340, 740305224, 740305224, 757802457,
//   756283736, 703174487, 704608746, 708472125, 741267721, 759799954, 750911250, 744673144, 701732579, 740601387,
//   708589868, 753324580, 704929742, 757507158, 742220443, 758222374, 753025215, 743090525, 740844901, 750623235,
//   741845024, 740434872, 703276752, 759136143, 706271701, 759010393, 753982893, 708797784, 700415511, 708800974,
//   750036676, 700508006, 705672015, 758096188, 743747835, 750555263, 755816648, 757644045, 742268243, 740221932,
//   753225052, 707870424, 703194029, 742509158, 709442925, 708765324, 707089636, 705742068, 751367007, 754350170,
//   758055077, 706065420, 744058090, 743119584, 706305075, 755897591, 751061015, 755789817, 707426133, 707823891,
//   759703643, 759003963, 753122043, 700892883, 708745039, 753316969, 705371938, 751088515, 757535290, 706203037,
//   706207210, 743581162, 702694286, 709924865, 741043747, 757762761, 708383934, 704561720, 754452522, 704066209,
//   702082482, 702283160, 707435246, 751049130, 706221424, 756256667, 752004558, 741921576, 753881127, 704054344,
//   752261049, 740733972, 755066981, 709964362, 753961676, 703232255, 752124320, 744029899, 757130372, 743566845,
//   708717752, 758122393, 700408523, 706417423, 706977279, 708127676, 704218308, 759349269, 756770737, 753081661,
//   742493662, 701046300, 704327265, 701915814, 703414915, 744706599, 701611993, 709199151, 700480272, 709171407,
//   700825044, 756611025, 705406897, 709641543, 756613732, 743711785, 709060253, 709211649, 753407715, 709104617,
//   704977612, 755450017, 753162332, 701101451, 758925177, 753066923, 759315147, 752306916, 741952443, 704674642,
//   756111390, 742921390, 708858959, 703692206, 704993584, 705900852, 708541034, 754301513, 704873781, 750247436,
//   742583470, 743058415, 759708522, 755549305, 740926173, 704703905, 701612191, 759349269, 751511450, 709118912,
//   708472056, 705235153, 700445532, 705289018, 707441525, 705382496, 753818298, 755138863, 708812139, 756579757,
//   759391420, 754122501, 709391319, 759686152, 755907412, 707287508, 706410444, 703170689, 743767634, 742770092,
//   742675445, 700786688, 756338737, 758996023, 705645432, 742859812, 754791035, 705634704, 742788543, 750620251,
//   743375864, 742692873, 701113168, 708999528, 708026028, 743814765, 740719927, 707566493, 705528994, 704703905,
//   706186932, 740621201, 752872046, 702727425, 753687310, 742449630, 707337877, 754602660, 759681061, 706358331,
//   755424614, 707851533, 703276809, 708196191, 705865163, 709720806, 759052877, 707594526, 743429050, 707594526,
//   707594526, 701448227, 741209819, 757176888, 704553694, 752972897, 757128019, 701848842, 752322768, 706421786,
//   744260248, 706115719, 744259959, 754524554, 702756152, 744259951, 706624033, 756387454, 704522458, 752674759,
//   753878429, 701776166, 708524288, 750581018, 700971789, 701424177, 743714101, 742004204, 751511450, 740060706,
//   752163731, 709398800, 743750040, 704767924, 741206226, 740581613, 741206226, 740581613, 701114820, 741534177,
//   758209165, 701798119, 740882180, 740168566, 755262744, 751354329, 708797835, 706863970, 756664374, 701044006,
//   708796141, 704679923, 709071978, 751592377, 750908439, 741611526, 753413173, 755849465, 754458663, 752385211,
//   701208835, 704181277, 759922923, 707019738, 704698178, 744260375, 750608824, 741033984, 752766008, 704443846,
//   754507549, 743954152, 752537737, 751882389, 742716619, 757274430, 750187328, 751671811, 742249990, 757159453,
//   759400303, 759280945, 706740260, 752939973, 741464976, 753305044, 705806992, 743167407, 706470044, 744397163,
//   756720651, 701349009, 705283369, 743951688, 759663348, 744053622, 750936957, 701974000, 702145122, 754382831,
//   708549663, 742276513, 754442697, 759633893, 744042513, 708854691, 752960192, 759957653, 751034967,
//   706332850, 740111391, 700736746, 742932853, 706234793, 755992935, 751123031, 751246617, 705433878,
//   743935905, 758849307, 742536986, 702615748, 708914135, 700249855, 707359014, 752961878, 705190635,
//   744390994, 708417179, 756100717, 743105154, 759785803, 743105154, 754649203, 701323264, 701585832,
//   754696066, 754034758, 704676228, 702422135, 753849297, 708166399, 706608096, 759328487, 744566816,
//   755326045, 755326045, 753193623, 702422135, 704427414, 701710882, 708847210, 750130327, 707046253,
//   707546356, 707546356, 740648803, 700114189, 756382501, 753933751, 744758018, 743085710, 700346734,
//   740538509, 744535345, 741353516, 700301829, 744387090, 743221064, 706871388, 757259108, 706000363,
//   743800625, 759020160, 704057299, 758771181, 706666923, 705354222, 752006729, 707841849, 702640983,
//   706866816, 707082130, 709425504, 708208101, 709647478, 756675109, 754131666, 740060706, 741521048,
//   752815271, 752928241, 708930717, 753737847, 753702871, 703793609, 701575696, 708437592, 757460866,
//   751358484, 744063922, 758444378, 758546762, 755979078, 740659851, 709486201, 706030750, 702072357,
//   702584602, 703273922, 743419090, 743091044, 708968403, 752169337, 701030486, 743774334, 751851144,
//   702637953, 741321213, 744848091, 701644295, 706598380, 740439467, 755945150, 706072312, 754400114,
//   751161435, 759056204, 741438374, 702601259, 744845994, 755358636, 743348242, 740719927, 702871522,
//   708554367, 704046796, 704046796, 741307430, 701471443, 759112253, 743093236, 752745529, 758598269,
//   753847669, 702494612, 707572675, 740174855, 757623931, 702218355, 706857421, 741135388, 702623800,
//   741296176, 701310915, 757687798, 704826610, 743746171, 709282624, 705086870, 753419472, 759685046,
//   708235415, 750545006, 708969575, 757497018, 740258784, 750759077, 742093892, 707423070, 753878280,
//   706312451, 703336282, 741863662, 751045196, 740868993, 708979712, 752322768, 740868993, 750924432,
//   702744954, 741908173, 700238213, 756073577, 702728821, 703245258, 759207018, 744291204, 741730491,
//   707171523, 741903253, 700115569, 750798790, 758478086, 751966786, 756676903, 709169061, 758195415,
//   705279415, 707105583, 754685152, 759881281, 707033083, 755066582, 705358503, 709833186, 703593059,
//   701774061, 705161286, 759730720, 754093939, 750722088, 704728761, 703741034, 755309306, 752883695,
//   743797986, 751374896, 743797986, 743797986, 756975915, 751736769, 758653832, 758653832, 753850675,
//   757990266, 701368830, 755903048, 708117742, 752601181, 758149530, 708389895, 741007366, 708104857,
//   702072230, 707709478, 700226929, 758049297, 706097985, 706000691, 704965086, 757891741, 758414445,
//   705857706, 753342934, 705685612, 759640308, 703658093, 704017833, 702582291, 707271181, 701168622,
//   743316982, 740729585, 701600858, 703427249, 754747002, 701109454, 743645877, 755068231, 754863995,
//   708383165, 743675045, 705670701, 757461024, 700371943, 752071226, 751060363, 753038978, 707786656,
//   742114361, 750160998, 753330942, 702020561, 752729882, 707974120, 754175276, 741051402, 704121675,
//   708464605, 706084975, 751164547, 706484411, 758364491, 707267292, 709370881, 703430090, 752374321,
//   754120461, 751611675, 753096236, 708850008, 708646256, 707583722, 758982871, 759753856, 740937212,
//   756086992, 744237497, 743787789, 742642472, 743047718, 754315234, 759604887, 743157641, 742335529,
//   700436475, 709612345, 751733533, 754178456, 755946293, 741136729, 758453207, 740827567, 757998947,
//   757244303, 757352503, 702555180, 752329881, 759928029, 700265195, 758922822, 752041994, 704096538,
//   740825822, 751100602, 707008142, 700416908, 702889121, 700549492, 743097846, 704581998, 708650868,
//   757082835, 753312297, 752423278, 705333430, 709609610, 756802504, 752375232, 754814369, 754381794,
//   709834488, 753408195, 709934133, 705299831, 706399340, 751310088, 751717053, 702542828, 754177440,
//   703688428, 744676343, 743136197, 754926594, 752493160, 709626453, 700860551, 703571290, 704201991,
//   701237357, 702210391, 740875681, 758369029, 750192578, 759691881, 701785673, 704798015, 701785673,
//   702901263, 742924472, 759541169, 756114141, 752598863, 703738003, 750255737, 700350154, 706629024,
//   704166578, 757641157, 708633631,
// ]

// users with paid policy and user phone_number not in all_phone_numbers


async function getAllUsers() {
  try {
    const usersWithMultiplePolicies = await db.users.findAll({
      attributes: ['user_id'],
      include: [
        {
          model: db.policies,
          as: 'policies',
          where: {
            policy_status: 'paid',
            partner_id: 2
            // other conditions if needed
          },
        },
      ],
      group: ['user.user_id'],
      having: Sequelize.literal('COUNT(DISTINCT policies.policy_id) > 1'),
    });

    // usersWithMultiplePolicies will contain users who have more than one policy
    console.log(usersWithMultiplePolicies);
    //write this  to a file
    fs.writeFile('usersWithMultiplePolicies.json', JSON.stringify(usersWithMultiplePolicies))
      .then(() => {
        console.log('File written successfully');
      })
      .catch((err: any) => {
        console.error('Error writing file:', err);
      });
  } catch (error) {
    console.error(error);
  }
}

//getAllUsers();



// create a function to register a principal using user and policy data
async function registerPrincipalArr(phone_numbers) {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (const phone_number of phone_numbers) {
    const existingUser = await db.users.findOne({
      where: {
        phone_number: phone_number.toString(),
        partner_id: 2,
      },
    });


    console.log("existingUser", existingUser ? `${existingUser.name} ${existingUser.phone_number} ${existingUser.user_id}` : "NO USER FOUND");

    if (!existingUser) {
      return; // Skip to the next iteration
    }

    const myPolicy = await db.policies.findOne({
      where: {
        user_id: existingUser.user_id,
        policy_status: 'paid',
        partner_id: 2,
      }
    });

    console.log("myPolicy", myPolicy ? myPolicy.phone_number : "NO POLICY FOUND");

    if (!myPolicy) {
      return; // Skip to the next iteration
    }

    // Remove the setTimeout from registerPrincipal and add a delay here
    await registerPrincipal(existingUser, myPolicy);

    // Add a delay between iterations (adjust the delay time as needed)
    await delay(2000);
  }
}


// Call the function with all_phone_numbers
let phones = [
  751440048,
703870739,
740475276,
755692926,
757204220,
754376270,
744078120,
750521580,
703007102,
703482376,
704279081,
744567065,
701011880,
754581873,
754997400,
702325987,
704043517,
741076901,
707664531,
709426127,
743791211,
744394578,
703086589,
758960852,
705645089,
744168788,
742694054,
743774267,
750793863,
708695835,
707375172,
709228486,
742935120,
759263889,
702206893,
742172942,
709879368,
706593175,
702385188,
753859177,
706394188,
704859348,
704411387,
740946342,
703229918,
742904759,
743711216,
744033279,
743392699,
700784998,
]
//registerPrincipalArr(phones);



// // // Define a function to create the dependent
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updatingAARPremium() {
  try {
    let policies = await db.policies.findAll({
      where: {
        policy_status: 'paid',
        partner_id: 2,
      },
      include: [
        {
          model: db.users,
          as: 'user',
        },
      ],
    });

    for (let myPolicy of policies) {
      let retries = 3; // Set the maximum number of retries

      while (retries > 0) {
        try {
          const result = await updatePremium(myPolicy.user, myPolicy);

          if (result.code === 200) {
            console.log("AAR UPDATE PREMIUM", result);
            break; // Exit the loop if successful
          } else {
            console.log("AAR NOT UPDATE PREMIUM", result);
            throw new Error("Failed to update premium");
          }
        } catch (error) {
          console.error("Error updating AAR premium:", error.message);
          retries--;

          if (retries > 0) {
            const backoffTime = Math.pow(2, 3 - retries) * 1000; // Exponential backoff
            console.log(`Retrying in ${backoffTime / 1000} seconds...`);
            await sleep(backoffTime);
          } else {
            console.error("Max retries reached. Unable to update AAR premium.");
          }
        }
      }
    }
  } catch (error) {
    console.error("AAR UPDATE PREMIUM timed out or encountered an error:", error.message);
  }
}

//updatingAARPremium();


async function updatePendingPremium() {
  try {

    let allPaidPolicies = await db.policies.findAll({
      where: {
        policy_status: 'paid',
        partner_id: 2,
      },
      include: [
        {
          model: db.users,
          as: 'user',
        },
      ],
    });

    for (const policy of allPaidPolicies) {
      let pending_premium = policy.yearly_premium - policy.premium
      let updatedPolicy = await db.policies.update(
        { policy_pending_premium: pending_premium },
        { where: { policy_id: policy.policy_id } }
      );
      console.log("updatedPolicy", updatedPolicy)
      await db.users.update(
        { number_of_policies: 1 },
        {
          where: {
            user_id: policy.user_id,
            partner_id: 2,
            number_of_policies: 0
          }
        }
      );
    }

  } catch (error) {

  }
}

const data = [
  { serialNumber: "UG155848-05", registrationNumber: 256750924432 },
  { serialNumber: "UG155848-06", registrationNumber: 256750924432 },
  { serialNumber: "UG155848-07", registrationNumber: 256750924432 },
  { serialNumber: "UG155848-08", registrationNumber: 256750924432 },
  { serialNumber: "UG155903-03", registrationNumber: 256740258784 },
  { serialNumber: "UG155903-04", registrationNumber: 256740258784 },
  { serialNumber: "UG155943-07", registrationNumber: 256704300201 },
  { serialNumber: "UG155943-08", registrationNumber: 256704300201 },
  { serialNumber: "UG155943-09", registrationNumber: 256704300201 },
  { serialNumber: "UG155943-10", registrationNumber: 256704300201 },
  { serialNumber: "UG155943-11", registrationNumber: 256704300201 },
  { serialNumber: "UG155943-12", registrationNumber: 256704300201 },
  { serialNumber: "UG155945-02", registrationNumber: 256708464605 },
  { serialNumber: "UG155950-02", registrationNumber: 256753778663 },
  { serialNumber: "UG155953-02", registrationNumber: 256754152168 },
  { serialNumber: "UG155962-03", registrationNumber: 256706439557 },
  { serialNumber: "UG155962-04", registrationNumber: 256706439557 },
  { serialNumber: "UG156134-01", registrationNumber: 256758771181 },
  { serialNumber: "UG156149-01", registrationNumber: 256755326045 },
  { serialNumber: "UG156149-02", registrationNumber: 256755326045 },
  { serialNumber: "UG156150-01", registrationNumber: 256708166399 },
  { serialNumber: "UG156150-02", registrationNumber: 256708166399 },
  { serialNumber: "UG156151-01", registrationNumber: 256754649203 },
  { serialNumber: "UG156151-02", registrationNumber: 256754649203 },
  { serialNumber: "UG156152-01", registrationNumber: 256759785803 },
  { serialNumber: "UG156152-02", registrationNumber: 256759785803 },
  { serialNumber: "UG156152-03", registrationNumber: 256759785803 },
  { serialNumber: "UG156178-01", registrationNumber: 256742249990 },
  { serialNumber: "UG156179-01", registrationNumber: 256751882389 },
  { serialNumber: "UG156206-02", registrationNumber: 256709190777 },
  { serialNumber: "UG156207-04", registrationNumber: 256708541034 },
  { serialNumber: "UG156207-05", registrationNumber: 256708541034 },
  { serialNumber: "UG156207-06", registrationNumber: 256708541034 },
  { serialNumber: "UG156212-04", registrationNumber: 256704674642 },
  { serialNumber: "UG156212-05", registrationNumber: 256704674642 },
  { serialNumber: "UG156212-06", registrationNumber: 256704674642 },
  { serialNumber: "UG156285-01", registrationNumber: 256759136143 },
  { serialNumber: "UG156286-01", registrationNumber: 256750911250 },
  { serialNumber: "UG156288-01", registrationNumber: 256742256068 },
  { serialNumber: "UG156288-02", registrationNumber: 256742256068 },
  { serialNumber: "UG156293-01", registrationNumber: 256751754051 },
  { serialNumber: "UG156293-02", registrationNumber: 256751754051 },
  { serialNumber: "UG157245-06", registrationNumber: 256704279081 },
  { serialNumber: "UG157290-06", registrationNumber: 256757816490 }
];

//console.log(data);
let ArrMembersWithNoPolicies = [
"UG156675-00",
"UG156676-00",
"UG156677-00",
"UG156678-00",
"UG156679-00",
"UG156680-00",
"UG156681-00",
"UG156682-00",
"UG156794-00",
]
async function updateArrPolicies() {
  for (const member of ArrMembersWithNoPolicies) {
    let user = await db.users.findOne({
      where: {
        arr_member_number: member,
        partner_id: 2,
      },
    });
    if (!user) {
      console.log("NO USER FOUND");
      continue
    }
    let policy = await db.policies.findOne({
      where: {
        policy_status: 'paid',
        partner_id: 2,
        user_id: user.user_id
      }
    });
    if (!policy) {
      console.log("NO POLICY FOUND");
      continue
    }
    console.log("user", user.phone_number);
    console.log("policy", policy.policy_number);
    await updatePremium(user, policy);

  }

}
//updateArrPolicies()


async function processUsersPolicyAAR() {
  // settimeout
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  let count =0
  let policies = await db.policies.findAll({
    where: {
      policy_status: 'paid',
    }
  });
  for (const policy of policies) {
    try {
      const user = await db.users.findOne({
        where: {
          arr_member_number: {
            [db.Sequelize.Op.not]: null,
          },
          partner_id: 2,
          user_id: policy.user_id,
        },
      });
      if (!user) {
        console.log("NO USER FOUND");
        continue
      }


      console.log("user", user.phone_number);

      await updatePremium(user, policy);
      count++
      // Add a delay between iterations (adjust the delay time as needed)
     // await delay(1000);
      console.log(`Dependant created for user with phone number: ${user.phone_number}`);
      console.log(count)
    } catch (error) {
      console.error(`Error creating dependant for user with phone number ${policy.phone_number}:`, error);
    }
  }
}

//processUsersPolicyAAR()
let arrMembersWithnoPolicy = [
  "UG155285-01",
  "UG155943-07",
  "UG155943-08",
  "UG155943-09",
  "UG155943-10",
  "UG155943-11",
  "UG155943-12",
  "UG155950-02",
  "UG155953-02",
  "UG155962-03",
  "UG155962-04",
  "UG156794-00",
]
//"UG155285-01""UG156206-02""UG155848-05""UG155848-06""UG155848-07""UG155848-08""UG155903-03""UG155903-04"
//"UG155943-07""UG155943-08""UG155943-09""UG155943-10""UG155943-11""UG155943-12""UG155945-02""UG155950-02""UG155953-02"
//"UG155962-03""UG155962-04""UG156212-04""UG156212-05""UG156212-06""UG156207-04""UG156207-05""UG156207-06""UG156285-01"
//"UG156286-01""UG156288-01""UG156288-02""UG156293-01""UG156293-02""UG156134-01""UG156149-01""UG156149-02""UG156150-01"
//"UG156150-02""UG156151-01""UG156151-02""UG156152-01""UG156152-02""UG156152-03""UG156178-01""UG156179-01""UG156180-01"
//"UG156180-02""UG156180-03""UG156180-04""UG156180-05""UG156188-01""UG156188-02""UG156190-01""UG156206-01""UG156207-01"
//"UG156207-02""UG156207-03""UG156212-01""UG156212-02""UG156212-03""UG156224-01""UG156225-01""UG156225-02""UG156225-03"
//"UG156225-04""UG156225-05""UG156225-06""UG156232-01""UG156645-01""UG156645-02""UG156675-00""UG156676-00""UG156677-00"
//"UG156678-00""UG156679-00""UG156680-00""UG156681-00""UG156682-00""UG157164-01""UG157245-01""UG157245-02""UG157245-03"
//"UG157245-04""UG157245-05""UG157245-06""UG157285-01""UG157290-01""UG157290-02""UG157290-03""UG157290-04""UG157290-05"
//"UG157290-06""UG155285-01""UG155285-01""UG155285-01""UG155285-01""UG155285-01""UG155285-01""UG155285-01""UG155285-01"

async function processUsersPolicyAARWithAANumber() {
  // settimeout
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  let count =0
 
  for (const member of  arrMembersWithnoPolicy) {

    let principal = member.replace(/-(\d+)$/, '-00');
    try {
      const user = await db.users.findOne({
        where: {
          arr_member_number: principal,
          partner_id: 2,
        },
      });
      //if useris null write to file the member
      if (!user) {
        fs.appendFile('noPolicy.json', JSON.stringify(member), function (err) {
          if (err) throw err;
          console.log('Saved!');
        }
        );
      }

       let policy = await db.policies.findOne({
       where: {
      policy_status: 'paid',
      partner_id: 2,
      user_id: user.user_id
    }
  });


      console.log("user", user.phone_number, policy.policy_number );
      const number_of_dependants = parseFloat(policy?.total_member_number.split("")[2]) || 0;
     let ultimatePremium = policy.total_member_number=="M" ?policy.premium : policy.premium/ (parseInt((policy.total_member_number).split("")[2]) + 1) 
     const main_benefit_limit =  policy.sum_insured 
     const last_expense_limit =  policy.last_expense_insured 

      const requestData = {
        member_no: member,
        unique_profile_id: user?.membership_id + "" ||user?.unique_profile_id + "",
        health_plan: "AIRTEL_" + policy.policy_type,
        health_option: "64",
        premium:ultimatePremium,
        premium_type: policy.installment_type,
        premium_installment: policy.renewal_order || 1,
        main_benefit_limit: main_benefit_limit,
        last_expense_limit: last_expense_limit,
        money_transaction_id: policy.airtel_money_id || "123456789",
      };
     console.log("requestData", requestData)
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://airtelapi.aar-insurance.ug:82/api/airtel/v1/protected/update_premium',
        headers: {
          'Authorization': 'Bearer ' +  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJhYXJ1ZyIsImV4cCI6MTcwMjMyMDQxMiwidXNlciI6W3siZnVsbF9uYW1lcyI6ImFpcnRlbCJ9XX0.R1PvCgocO5oHS3aVl2n0KxwGfnKgtW9loJ4VosNe4AHXvw4xVZ-dBC5SNawheV06DKhkik9HQC2-NYaVCc8CIXYc-6c3uCmImOa36Bh3sEsWMXASaqiumD9Dm2XuSGm1ITTAd4Rg0oMAjyocXoODM6THX7WPXGJOa-sg_Mwg10cTxtMJXc-ayThWis_SkHbHZ1MMvHZxm5dvsl4l0KaIECzHEFXsw_LR5NDJtOqP2aJDIpSk3esbvLJhWR9FzxCEiDnHKsOuZw_gyN0YAHXN9fHX2g8RhNMs1sWLUHctWppy0Rf2skVvAc3mpzIbQeppPirGX-BVJcpHBPGGmbo8LQ',
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(requestData),
      };
      const response = await axios.request(config);
      count++
      // Add a delay between iterations (adjust the delay time as needed)
     // await delay(1000);
      console.log(`Dependant created for user with phone number: ${user.phone_number}, response: ${JSON.stringify(response.data)}`);
      console.log(count)
    } catch (error) {
      console.error(`Error creating dependant for user with :`, error);
    }
  }
}
//processUsersPolicyAARWithAANumber()



// Call the function to start the process
//getAllUsers();


// let payment_amount = [
// 10000,
// 208000,
// 14000,
// 10000,
// 18000,
// 10000,
// 10000,
// 18000,
// 14000,
// 14000,
// 10000,
// 14000,
// 40000,
// 14000,
// 10000,
// 10000,
// 18000,
// 10000,
// 10000,
// 10000,
// 10000,
// 10000,
// 10000,
// 10000,
// 10000,
// 14000,
// 10000,
// 10000,
// 10000,
// 14000,
// 10000,
// 10000,
// 10000,
// 10000,
// ]

// let payment_numbers = [
//   701565319,
// 707886771,
// 700993744,
// 703695296,
// 757728878,
// 701106857,
// 754177440,
// 700787003,
// 702559647,
// 759750610,
// 709011694,
// 707420393,
// 751754051,
// 742877919,
// 755941923,
// 700456469,
// 707609316,
// 759916803,
// 702906710,
// 754008281,
// 707320708,
// 754416580,
// 759015513,
// 702790183,
// 707121789,
// 701072656,
// 702029927,
// 700787848,
// 759203499,
// 742316854,
// 742316854,
// 759074907,
// 709247131,
// 700659605,
// ]
// let combinedPayments = payment_numbers.map((phoneNumber, index) => {
//   return {
//     phone_number: phoneNumber,
//     amount: payment_amount[index],
//   };
// });

// console.log("Combined Payments:", combinedPayments);
// //write this  to a file
// fs.writeFile('payments.json', JSON.stringify(combinedPayments))
//   .then(() => {
//     console.log('File written successfully');
//   })
//   .catch((err: any) => {
//     console.error('Error writing file:', err);
//   });






// async function allPaidPolicies() {
//   try {
//     let allPaidPolicies = await db.policies.findAll({
//       where: {
//         policy_status: 'paid',
//         partner_id: 2,
//         arr_policy_number: null,
//       },
//       include: [
//         {
//           model: db.users,
//           as: 'user',
//         },
//       ],
//     });

//     async function processPolicy(policy) {
//       const policy_start_date = policy.policy_start_date;
//       const policy_end_date = policy.policy_end_date;
//       policy.policy_start_date = policy_start_date;
//       policy.policy_end_date = policy_end_date;

//       const arr_member = await registerPrincipal(policy.user, policy);
//       console.log('arr_member', arr_member);
//     }

//     async function processPoliciesSequentially() {
//       for (const policy of allPaidPolicies) {
//         await processPolicy(policy);
//         // Wait for 2 seconds before processing the next policy
//         await new Promise((resolve) => setTimeout(resolve, 2000));
//       }
//     }

//     // Start processing policies
//     await processPoliciesSequentially();

//     return 'done';
//   } catch (err) {
//     console.error('Error:', err);
//     return 'error';
//   }
// }

//allPaidPolicies()

// async function updatePremiumArr() {
//   try {
//     let allPaidPolicies = await db.policies.findAll({
//       where: {
//         policy_status: 'paid',
//         partner_id: 2,

//       },
//       include: [
//         {
//           model: db.users,
//           as: 'user',
//         },
//       ],
//     });

//     async function processPolicy(policy) {
//       const policy_start_date = policy.policy_start_date;
//       const policy_end_date = policy.policy_end_date;
//       policy.policy_start_date = policy_start_date;
//       policy.policy_end_date = policy_end_date;

//       const arr_member = await updatePremium(policy.user, policy);
//       console.log('arr_member', arr_member);
//     }

//     async function processPoliciesSequentially() {
//       for (const policy of allPaidPolicies) {
//         await processPolicy(policy);
//         // Wait for 2 seconds before processing the next policy
//         await new Promise((resolve) => setTimeout(resolve, 2000));
//       }
//     }

//     // Start processing policies
//     await processPoliciesSequentially();

//     return 'done';
//   } catch (err) {
//     console.error('Error:', err);
//     return 'error';
//   }
// }

// let combinedPayments = [
//   { "phone_number": 701565319, "amount": 10000 },
//   { "phone_number": 707886771, "amount": 208000 },
//   { "phone_number": 700993744, "amount": 14000 },
//   { "phone_number": 703695296, "amount": 10000 },
//   { "phone_number": 757728878, "amount": 18000 },
//   { "phone_number": 701106857, "amount": 10000 },
//   { "phone_number": 754177440, "amount": 10000 },
//   { "phone_number": 700787003, "amount": 18000 },
//   { "phone_number": 702559647, "amount": 14000 },
//   { "phone_number": 759750610, "amount": 14000 },
//   { "phone_number": 709011694, "amount": 10000 },
//   { "phone_number": 707420393, "amount": 14000 },
//   { "phone_number": 751754051, "amount": 40000 },
//   { "phone_number": 742877919, "amount": 14000 },
//   { "phone_number": 755941923, "amount": 10000 },
//   { "phone_number": 700456469, "amount": 10000 },
//   { "phone_number": 707609316, "amount": 18000 },
//   { "phone_number": 759916803, "amount": 10000 },
//   { "phone_number": 702906710, "amount": 10000 },
//   { "phone_number": 754008281, "amount": 10000 },
//   { "phone_number": 707320708, "amount": 10000 },
//   { "phone_number": 754416580, "amount": 10000 },
//   { "phone_number": 759015513, "amount": 10000 },
//   { "phone_number": 702790183, "amount": 10000 },
//   { "phone_number": 707121789, "amount": 10000 },
//   { "phone_number": 701072656, "amount": 14000 },
//   { "phone_number": 702029927, "amount": 10000 },
//   { "phone_number": 700787848, "amount": 10000 },
//   { "phone_number": 759203499, "amount": 10000 },
//   { "phone_number": 742316854, "amount": 14000 },
//   { "phone_number": 742316854, "amount": 10000 },
//   { "phone_number": 759074907, "amount": 10000 },
//   { "phone_number": 709247131, "amount": 10000 },
//   { "phone_number": 700659605, "amount": 10000 }
// ]


// let policies = [];
// // Function to handle errors during database operations
// const handleDbError = (error, phoneNumber, amount) => {
//   console.error(`Error processing payment (${phoneNumber}, ${amount}):`, error);

//   // Save the phone_number and amount to a file
//   const errorLog = {
//     phone_number: phoneNumber,
//     amount: amount,
//     error: error.message,
//   };

//   fs.writeFile('error_log.json', JSON.stringify(errorLog), { flag: 'a' })
//     .then(() => console.log('Error logged to file'))
//     .catch((writeError) => console.error('Error writing error log to file:', writeError));
// };

// Process combinedPayments array with delays
// const processPayments = async () => {
//   for (const payment of combinedPayments) {
//     try {
//       let user = await db.users.findOne({
//         where: {
//           phone_number: payment.phone_number.toString(),
//         },
//       });

//       let userPolicies = await db.policies.findAll({
//         where: {
//           user_id: user.user_id,// Handle the case where user is not found
//           premium: payment.amount,
//         },
//       });

//       // Add the policies for the current user to the overall policies array
//       policies.push(...userPolicies);
//     } catch (error) {
//       // Handle errors during database operations
//       handleDbError(error, payment.phone_number, payment.amount);
//     }
//   }
// };

// // Process payments with delays
// processPayments()
//   .then(async () => {
//     // Update policy_status to paid for policies with delays
//     for (const policy of policies) {
//       try {
//         // Update policy_status to 'paid' for policies
//         console.log("POLICY", policy.phone_number);
//         await db.policies.update(
//           { policy_status: 'paid' },
//           { where: { policy_id: policy.policy_id } }
//         );

//         // Update payment_status to 'paid' for corresponding payments
//         await db.payments.update(
//           { payment_status: 'paid' },
//           { where: { policy_id: policy.policy_id } }
//         );

//         // Add a delay between updates
//         await new Promise(resolve => setTimeout(resolve, 1000)); // 1000ms delay (adjust as needed)
//       } catch (error) {
//         // Handle errors during database updates
//         handleDbError(error, policy.phone_number, policy.amount);
//       }
//     }
//   })
//   .then(async () => {
//     // Write the policies to a file with a delay
//     await new Promise(resolve => setTimeout(resolve, 1000)); // 1000ms delay (adjust as needed)
//     await fs.writeFile('all_paid_policies.json', JSON.stringify(policies));
//     console.log('File written successfully');
//   })
//   .catch((error) => {
//     console.error("Error processing payments:", error);
//   });


// let policies_not_counted_for = [];

// db.policies.findAll({
//   where: {
//     policy_status: 'paid',
//   },
// }).then((policies: any) => {
//   // Function to update a policy with a delay
//   const updatePolicyWithDelay = async (policy: any) => {
//     let policyObj = {
//       phone_number: policy.phone_number,
//       amount: policy.premium,
//     };

//     if (!combinedPayments.includes(policyObj)) {
//       await db.policies.update(
//         { policy_status: 'pending' },
//         { where: { policy_id: policy.policy_id } }
//       );
//       policies_not_counted_for.push(policyObj);
//     }
//   };

//   // Set a delay of 1000 milliseconds (1 second) between updates
//   const delay = 1000;

//   // Iterate through policies with a delay
//   policies.forEach((policy: any, index: number) => {
//     setTimeout(() => {
//       updatePolicyWithDelay(policy);
//     }, index * delay);
//   });
// });


// updatePremiumArr()

// update number_of_policies in users table with the number of paid policies a user has
async function updateNumberOfPolicies() {
  try {
    // Fetch all users with partner_id = 2
    const users = await db.users.findAll({
      where: {
        partner_id: 2,
      },
    });

    // Iterate over each user
    for (const user of users) {
      try {
        // Fetch all paid policies for the current user
        const policies = await db.policies.findAndCountAll({
          where: {
            user_id: user.user_id,
            policy_status: 'paid',
          },
        });

        // Update the user with the number of policies
        await db.users.update(
          { number_of_policies: policies.count },
          { where: { user_id: user.user_id } }
        );
      } catch (policyError) {
        console.error(policyError);
      }
    }
  } catch (userError) {
    console.error(userError);
  }
}

// Call the function
//updateNumberOfPolicies();


// RENEWAL
async function sendPolicyAnniversaryReminders() {
  const query = `
    SELECT *
    FROM policies
    WHERE 
      DATE_PART('year', policy_start_date) = DATE_PART('year', CURRENT_DATE)
      AND DATE_PART('month', policy_start_date) = DATE_PART('month', CURRENT_DATE)
      AND EXTRACT(DAY FROM policy_start_date) = EXTRACT(DAY FROM CURRENT_DATE) - 3
      AND policy_status = 'paid'
      AND partner_id = 2`;

  const policies = await db.sequelize.query(query, { type: QueryTypes.SELECT });

  console.log("POLICIES", policies.length);

  policies.forEach(async (policy) => {
    const { policy_start_date, premium, policy_type, phone_number, beneficiary } = policy;

    const message = `Your monthly premium payment for ${beneficiary} ${policy_type} Medical cover of UGX ${premium} is DUE in 3-days on ${policy_start_date.toDateString()}.`;

    console.log("MESSAGE", message);

    // Call the function to send an SMS
    await SMSMessenger.sendSMS(phone_number, message);
  });

  return policies;
}


//Call the function to send policy anniversary reminders
//sendPolicyAnniversaryReminders();

// let all_phone_numbers= [

// 700860551
// 703571290
// 704201991
// 701237357

// ]


// Count occurrences of each phone number
//const length = all_phone_numbers.length;
// console.log("LENGTH",length)
// const phoneNumbersCount = all_phone_numbers.reduce((countMap, phoneNumber) => {
//   countMap[phoneNumber] = (countMap[phoneNumber] || 0) + 1;
//   return countMap;
// }, {});

// // Filter out phone numbers with count less than 2 (not repeated)
// const repeatedPhoneNumbers = Object.keys(phoneNumbersCount).filter(
//   (phoneNumber) => phoneNumbersCount[phoneNumber] > 1
// );

// // Display repeated phone numbers and their counts
// repeatedPhoneNumbers.forEach((phoneNumber) => {
//   const count = phoneNumbersCount[phoneNumber];
//   console.log(`Phone Number: ${phoneNumber}, Repeated ${count} times`);
// });

// Phone Number: 700787003, Repeated 2 times
// Phone Number: 701785673, Repeated 2 times
// Phone Number: 702422135, Repeated 2 times
// Phone Number: 704046796, Repeated 2 times
// Phone Number: 704703905, Repeated 2 times
// Phone Number: 707546356, Repeated 2 times
// Phone Number: 707594526, Repeated 3 times
// Phone Number: 740305224, Repeated 2 times
// Phone Number: 740581613, Repeated 2 times
// Phone Number: 740719927, Repeated 2 times
// Phone Number: 740868993, Repeated 2 times
// Phone Number: 741206226, Repeated 2 times
// Phone Number: 742316854, Repeated 2 times
// Phone Number: 743105154, Repeated 2 times
// Phone Number: 743797986, Repeated 3 times
// Phone Number: 751511450, Repeated 2 times
// Phone Number: 752322768, Repeated 2 times
// Phone Number: 754177440, Repeated 2 times
// Phone Number: 755326045, Repeated 2 times
// Phone Number: 758653832, Repeated 2 times
// Phone Number: 759349269, Repeated 2 times


//policy_number: "BW" + phoneNumber?.replace('+', "")?.substring(3)
async function generatePolicyNumber() {

  let allPolicies = await db.policies.findAll({
    where: {
      policy_status: 'paid',

    },


  });
  console.log("ALL POLICIES", allPolicies.length)
  for (let policy of allPolicies) {
    console.log("POLICY", policy.phone_number)
    let policy_number = "BW" + policy.phone_number?.replace('+', "")?.substring(3)
    await db.policies.update(
      { policy_number: policy_number },
      { where: { policy_id: policy.policy_id } }
    );
  }
}




async function sendWelcomeSMS() {
  try {
    let delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    console.log("i was called")
  
    let count = 0
    let allUsers = await db.users.findAll(
      {
        where: {
          partner_id: 2,
        }
      }
    )
    
console.log("ALL USERS", allUsers.length)

    for (let user of allUsers) {
      console.log(user.name, user.user_id)

        let lowFundsMessage = 'Low on cash? You can now purchase Ddwaliro Care using Airtel Quickloan. Dial *185*6*7# to learn more and get covered.'

        //let message = 'Thank you for showing interest in Ddwaliro Care. To learn more, dial *185*6*7# and get your medical insurance cover.'
        await SMSMessenger.sendSMS(`+256${user.phone_number}`, lowFundsMessage);
        console.log("SENT TO", user.phone_number, count)
        delay(1000)
      
    }
  } catch (error) {
    console.log(error)
  }
}

//sendWelcomeSMS()


async function getUsersWithoutPolicyAndSendSMS() {
  try {
    // Find users without policies
    const usersWithoutPolicy = await db.users.findAll({
      where: {
        // Assuming there's a foreign key relationship between users and policies
        // Adjust the condition based on your database schema
        '$policies.policy_id$': null,
      },
      include: [
        {
          model: db.policies,
          as: 'policies',
          required: false,
        },
      ],
    });

    // Send SMS to each user without a policy
    for (const user of usersWithoutPolicy) {
      let message = 'Thank you for showing interest in Ddwaliro Care. To learn more, dial *185*6*7# and get your medical insurance cover.'
      await SMSMessenger.sendSMS(`+256${user.phone_number}`, message);
     
    }

    console.log('SMS sent to users without policies.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Call the function to get users without policies and send SMS
//getUsersWithoutPolicyAndSendSMS();



async function getUsersWithPendingPoliciesAndSendSMS() {
  try {
    // Find users with pending policies
    console.log("i was called")
    const usersWithPendingPolicies = await db.policies.findAll({
      where: {
        '$policies.policy_status$': 'pending', // Adjust based on your policy status field
      }
    });
    console.log('usersWithPendingPolicies', usersWithPendingPolicies)

    // Send SMS to each user with pending policies
    // for (const user of usersWithPendingPolicies) {
    //   let message = 'Low on cash? You can now purchase Ddwaliro Care using Airtel Quickloan. Dial *185*6*7# to learn more and get covered.'
    //   await SMSMessenger.sendSMS(`+256${user.phone_number}`, message);
    // }

    console.log('SMS sent to users with pending policies.');
  } catch (error) {
    console.error('Error:', error);
  }
}

//getUsersWithPendingPoliciesAndSendSMS()




async function updatePolicyNumber() {
  try {
    // Find duplicate policies based on policy_number
    const duplicatePolicies = await db.policies.findAll({
      attributes: ['policy_number', [db.sequelize.fn('COUNT', 'policy_number'), 'policy_count']],
      group: ['policy_number'],
      having: db.sequelize.literal('COUNT(policy_number) > 1'),
      where: {
        policy_status: 'paid'
      },
    });

    // Update policy numbers for duplicate policies
    for (const duplicatePolicy of duplicatePolicies) {
      const policiesToUpdate = await db.policies.findAll({
        where: {
          policy_number: duplicatePolicy.policy_number,
          policy_status: 'paid'
        },
      });

      // Update policy numbers with a unique identifier (e.g., append a suffix)
      for (let i = 0; i < policiesToUpdate.length; i++) {
        console.log(policiesToUpdate[i].first_name,policiesToUpdate[i].policy_number)
        policiesToUpdate[i].policy_number = `${policiesToUpdate[i].policy_number}_${i + 1}`;
        await policiesToUpdate[i].save();
      }
    }

    console.log('Policy numbers updated for duplicates.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Call the function to update policy numbers for duplicates
//updatePolicyNumber();

//Schedule the updatePolicies function to run every hour
cron.schedule('0 1 * * *', () => {
  console.log('Running cron job...');
  //updatePendingPremium()
  console.log('Done.');
});


module.exports = { db }

