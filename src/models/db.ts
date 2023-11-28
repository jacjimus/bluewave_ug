const { Sequelize, DataTypes } = require('sequelize')
import { v4 as uuidv4 } from 'uuid'
const { Op, QueryTypes } = require("sequelize");
import cron from 'node-cron';
import { fetchMemberStatusData, registerDependant, registerPrincipal, updatePremium } from '../services/aar';
import SMSMessenger from '../services/sendSMS';


require('dotenv').config()
const fs = require('fs/promises'); // Use promises-based fs


const Agenda = require('agenda');


const sequelize = new Sequelize(process.env.DB_URL, { dialect: "postgres" })

//checking if connection is done
sequelize.authenticate().then(() => {
  console.log(`Database connected to Bluewave! time: ${new Date()}`)
}).catch((err) => {
  console.log(err)
})

export const db: any = {}
db.Sequelize = Sequelize
db.sequelize = sequelize

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


db.users.hasMany(db.policies, { foreignKey: 'user_id' });
db.policies.belongsTo(db.users, { foreignKey: 'user_id' });

// const agenda = new Agenda({
//   db: { instance: db, collection: 'beneficiaries' }, // Replace 'agendaJobs' with your table name
// });
//449 priincipal
// policy 535

// Your actual code
const updatePolicies = () => {
  db.sync() // This ensures that the tables are created before running the queries
    .then(() => {
      return db.payments.findAll({
        where: {
          payment_status: 'paid',
        },
      });
    })
    .then((payments) => {
      return Promise.all(
        payments.map((payment) => {
          return db.policies.findAll({
            where: {
              policy_id: payment.policy_id,
              policy_status: 'paid',
            },
          })
            .then((policies) => {
              return db.users.update(
                { number_of_policies: policies.length },
                { where: { user_id: payment.user_id } }
              );
            })
            .catch((err) => {
              console.log(err);
            });
        })
      );
    })
    .catch((err) => {
      console.log(err);
    });
};




// // // Define a function to create the dependent
async function createDependant(existingUser: any, myPolicy: any) {
  try {

    let arr_member: any;
    let dependant: any;
    let number_of_dependants = parseFloat(myPolicy?.total_member_number?.split("")[2]) || 0;
    console.log("number_of_dependants ", number_of_dependants)

    const updatePremiumPromise = updatePremium(existingUser, myPolicy);
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Timeout: The updatePremium process took too long"));
      }, 10000); // Adjust the timeout duration (in milliseconds) as needed
    });

    try {
      const result = await Promise.race([updatePremiumPromise, timeoutPromise]);

      if (result.code == 200) {
        console.log("AAR UPDATE PREMIUM", result);
      } else {
        console.log("AAR NOT UPDATE PREMIUM", result);
      }
    } catch (error) {
      console.error("AAR UPDATE PREMIUM timed out or encountered an error:", error.message);
    }




    if (existingUser.arr_member_number == null) {
      console.log("REGISTER PRINCIPAL");
      // Introduce a delay before calling registerPrincipal
      await new Promise(resolve => {
        setTimeout(async () => {
          arr_member = await registerPrincipal(existingUser, myPolicy);
          console.log("ARR PRINCIPAL CREATED", arr_member);
          resolve(true);
        }, 1000); // Adjust the delay as needed (1 second in this example)
      });
    } else {
      // Fetch member status data or register principal based on the condition
      await new Promise(resolve => {
        setTimeout(async () => {
          arr_member = await fetchMemberStatusData({
            member_no: existingUser.arr_member_number,
            unique_profile_id: existingUser.membership_id + "",
          });
          console.log("AAR MEMBER FOUND", arr_member);
          if (number_of_dependants > 0) {

            for (let i = 1; i <= number_of_dependants; i++) {
              let dependant_first_name = `first_name__${existingUser.membership_id}_${i}`;
              let dependant_other_names = `other_names__${existingUser.membership_id}_${i}`;
              let dependant_surname = `surname__${existingUser.membership_id}_${i}`;

              if (arr_member.policy_no != null && arr_member.code == 200) {
                // Use a Promise with setTimeout to control the creation
                await new Promise(resolve => {
                  setTimeout(async () => {
                    dependant = await registerDependant({
                      member_no: existingUser.arr_member_number,
                      surname: dependant_surname,
                      first_name: dependant_first_name,
                      other_names: dependant_other_names,
                      gender: 1,
                      dob: "1990-01-01",
                      email: "dependant@bluewave.insure",
                      pri_dep: "25",
                      family_title: "25", // Assuming all dependants are children
                      tel_no: myPolicy.phone_number,
                      next_of_kin: {
                        surname: "",
                        first_name: "",
                        other_names: "",
                        tel_no: "",
                      },
                      member_status: "1",
                      health_option: "64",
                      health_plan: "AIRTEL_" + myPolicy?.policy_type,
                      policy_start_date: myPolicy.policy_start_date,
                      policy_end_date: myPolicy.policy_end_date,
                      unique_profile_id: existingUser.membership_id + "",
                    });

                    if (dependant.code == 200) {

                      console.log(`Dependant ${i} created:`, dependant);

                      myPolicy.arr_policy_number = arr_member?.policy_no;
                      dependant.unique_profile_id = existingUser.membership_id + "";
                      let updateDependantMemberNo = []
                      updateDependantMemberNo.push(dependant.member_no)
                      await db.policies.update(
                        { dependant_member_numbers: updateDependantMemberNo },
                        { where: { policy_id: myPolicy.policy_id } }
                      );
                      let updatePremiumData = await updatePremium(dependant, myPolicy);
                      if (updatePremiumData.code == 200) {
                        console.log("AAR UPDATE PREMIUM", updatePremiumData);
                        resolve(true)
                      } else {
                        console.log("AAR NOT  UPDATE PREMIUM", updatePremiumData);
                        resolve(true)

                      }
                      resolve(true)
                    } else {
                      console.log("DEPENDANT NOT CREATED", dependant);
                      resolve(true)
                    }
                  }, 1000 * i); // Adjust the delay as needed
                });
              } else {
                console.log("NO ARR MEMBER")
              }
            }
          } else {
            let updatePremiumData = await updatePremium(existingUser, myPolicy);
            if (updatePremiumData.code == 200) {
              console.log("AAR UPDATE PREMIUM", updatePremiumData);
              resolve(true)
            } else {
              console.log("AAR NOT  UPDATE PREMIUM", updatePremiumData);
              resolve(true)
            }
          }
          resolve(true);

        }, 1000); // Adjust the delay as needed (1 second in this example)
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}





// get all user with arr_member_number is null and partner_id = 2 and email is  null
async function getAllUsers() {

  let policies = await db.policies.findAll({
    where: {
      policy_status: 'paid',
      //installment_type: 2
    }
  });

  if (!policies) {
    throw new Error("NO POLICY FOUND");
  }


  async function processUsers() {
    for (const policy of policies) {
      try {
        const user = await db.users.findOne({
          where: {
            // arr_member_number: {
            //   [db.Sequelize.Op.not]: null,
            // },
            partner_id: 2,
            user_id: policy.user_id,
          },
        });


        if (!user) {
          console.log("NO USER FOUND");
          continue
        }

        console.log("user", user.phone_number);
        await createDependant(user, policy);
        console.log(`Dependant created for user with phone number: ${user.phone_number}`);
      } catch (error) {
        console.error(`Error creating dependant for user with phone number ${policy.phone_number}:`, error);
      }
    }
  }

  try {
    await processUsers();
    console.log("All dependants created successfully.");
  } catch (err) {
    console.error("Error processing users:", err);
  }
}

// Call the function to start the process
//getAllUsers();



// let payment_data =[
//   { "phone_number": 707435246, "amount": 10000 },
//   { "phone_number": 751049130, "amount": 208000 },
//   { "phone_number": 706221424, "amount": 10000 },
//   { "phone_number": 756256667, "amount": 10000 },
//   { "phone_number": 752004558, "amount": 10000 },
//   { "phone_number": 741921576, "amount": 10000 },
//   { "phone_number": 753881127, "amount": 18000 },
//   { "phone_number": 704054344, "amount": 18000 },
//   { "phone_number": 752261049, "amount": 10000 },
//   { "phone_number": 740733972, "amount": 10000 },
//   { "phone_number": 755066981, "amount": 10000 },
//   { "phone_number": 709964362, "amount": 10000 },
//   { "phone_number": 753961676, "amount": 14000 },
//   { "phone_number": 703232255, "amount": 10000 },
//   { "phone_number": 752124320, "amount": 18000 },
//   { "phone_number": 744029899, "amount": 10000 },
//   { "phone_number": 757130372, "amount": 10000 },
//   { "phone_number": 743566845, "amount": 10000 },
//   { "phone_number": 708717752, "amount": 120000 },
//   { "phone_number": 758122393, "amount": 18000 },
//   { "phone_number": 700408523, "amount": 10000 },
//   { "phone_number": 706417423, "amount": 10000 },
//   { "phone_number": 706977279, "amount": 18000 },
//   { "phone_number": 708127676, "amount": 10000 },
//   { "phone_number": 704218308, "amount": 108000 },
//   { "phone_number": 759349269, "amount": 10000 },
//   { "phone_number": 756770737, "amount": 18000 },
//   { "phone_number": 753081661, "amount": 10000 },
//   { "phone_number": 742493662, "amount": 10000 },
//   { "phone_number": 701046300, "amount": 10000 },
//   { "phone_number": 704327265, "amount": 10000 },
//   { "phone_number": 701915814, "amount": 18000 },
//   { "phone_number": 703414915, "amount": 18000 },
//   { "phone_number": 744706599, "amount": 10000 },
//   { "phone_number": 701611993, "amount": 10000 },
//   { "phone_number": 709199151, "amount": 10000 },
//   { "phone_number": 700480272, "amount": 14000 },
//   { "phone_number": 709171407, "amount": 20000 },
//   { "phone_number": 700825044, "amount": 18000 },
//   { "phone_number": 756611025, "amount": 18000 },
//   { "phone_number": 705406897, "amount": 10000 },
//   { "phone_number": 709641543, "amount": 10000 },
//   { "phone_number": 756613732, "amount": 18000 },
//   { "phone_number": 743711785, "amount": 10000 },
//   { "phone_number": 709060253, "amount": 10000 },
//   { "phone_number": 709211649, "amount": 14000 },
//   { "phone_number": 753407715, "amount": 10000 },
//   { "phone_number": 709104617, "amount": 10000 },
//   { "phone_number": 704977612, "amount": 10000 },
//   { "phone_number": 755450017, "amount": 10000 },
//   { "phone_number": 753162332, "amount": 10000 },
//   { "phone_number": 701101451, "amount": 18000 },
//   { "phone_number": 758925177, "amount": 10000 },
//   { "phone_number": 753066923, "amount": 10000 },
//   { "phone_number": 759315147, "amount": 18000 },
//   { "phone_number": 752306916, "amount": 10000 },
//   { "phone_number": 741952443, "amount": 14000 },
//   { "phone_number": 704674642, "amount": 40000 },
//   { "phone_number": 756111390, "amount": 10000 }
// ]
// let payment_data = [
//   { "phone_number": 701377572, "amount": 10000 },
//   { "phone_number": 758303153, "amount": 10000 },
//   { "phone_number": 709551279, "amount": 10000 },
//   { "phone_number": 743453953, "amount": 14000 },
//   { "phone_number": 700440544, "amount": 10000 },
//   { "phone_number": 709278507, "amount": 10000 },
//   { "phone_number": 759773977, "amount": 10000 },
//   { "phone_number": 704811422, "amount": 10000 },
//   { "phone_number": 751085268, "amount": 10000 },
//   { "phone_number": 751194038, "amount": 10000 },
//   { "phone_number": 753714841, "amount": 14000 },
//   { "phone_number": 752883692, "amount": 10000 },
//   { "phone_number": 707774730, "amount": 10000 },
//   { "phone_number": 752225351, "amount": 10000 },
//   { "phone_number": 752560013, "amount": 10000 },
//   { "phone_number": 708510859, "amount": 14000 },
//   { "phone_number": 742524333, "amount": 10000 },
//   { "phone_number": 754072548, "amount": 10000 },
//   { "phone_number": 700835797, "amount": 10000 },
//   { "phone_number": 707640557, "amount": 10000 },
//   { "phone_number": 705520531, "amount": 14000 },
//   { "phone_number": 755014764, "amount": 10000 },
//   { "phone_number": 701792283, "amount": 35000 },
//   { "phone_number": 754155216, "amount": 10000 },
//   { "phone_number": 704794563, "amount": 10000 },
//   { "phone_number": 752909225, "amount": 14000 },
//   { "phone_number": 702502728, "amount": 10000 },
//   { "phone_number": 751224476, "amount": 10000 },
//   { "phone_number": 701435756, "amount": 10000 },
//   { "phone_number": 708504613, "amount": 14000 },
//   { "phone_number": 740504201, "amount": 14000 },
//   { "phone_number": 705100734, "amount": 10000 },
//   { "phone_number": 752162722, "amount": 10000 },
//   { "phone_number": 705762881, "amount": 10000 },
//   { "phone_number": 704563728, "amount": 10000 },
//   { "phone_number": 705758296, "amount": 10000 },
//   { "phone_number": 742256068, "amount": 30000 },
//   { "phone_number": 753201326, "amount": 10000 },
//   { "phone_number": 742088772, "amount": 10000 },
//   { "phone_number": 706617599, "amount": 10000 },
//   { "phone_number": 751014859, "amount": 10000 },
//   { "phone_number": 754997400, "amount": 18000 },
//   { "phone_number": 759705276, "amount": 10000 },
//   { "phone_number": 754897284, "amount": 18000 },
//   { "phone_number": 741859475, "amount": 10000 },
//   { "phone_number": 700787003, "amount": 10000 },
//   { "phone_number": 740937765, "amount": 10000 },
//   { "phone_number": 709892072, "amount": 10000 },
//   { "phone_number": 744860116, "amount": 10000 },
//   { "phone_number": 753177466, "amount": 10000 },
//   { "phone_number": 702256430, "amount": 18000 },
//   { "phone_number": 755168928, "amount": 65000 },
//   { "phone_number": 742141392, "amount": 10000 },
//   { "phone_number": 704017842, "amount": 10000 },
//   { "phone_number": 704665960, "amount": 10000 },
//   { "phone_number": 709358793, "amount": 14000 },
//   { "phone_number": 754761340, "amount": 10000 },
//   { "phone_number": 740305224, "amount": 10000 },
//   { "phone_number": 740305224, "amount": 18000 },
//   { "phone_number": 757802457, "amount": 10000 },
//   { "phone_number": 756283736, "amount": 18000 },
//   { "phone_number": 703174487, "amount": 10000 },
//   { "phone_number": 704608746, "amount": 10000 },
//   { "phone_number": 708472125, "amount": 18000 },
//   { "phone_number": 741267721, "amount": 10000 },
//   { "phone_number": 759799954, "amount": 10000 },
//   { "phone_number": 750911250, "amount": 28000 },
//   { "phone_number": 744673144, "amount": 10000 },
//   { "phone_number": 701732579, "amount": 10000 },
//   { "phone_number": 740601387, "amount": 20000 },
//   { "phone_number": 708589868, "amount": 10000 },
//   { "phone_number": 753324580, "amount": 10000 },
//   { "phone_number": 704929742, "amount": 14000 },
//   { "phone_number": 757507158, "amount": 10000 },
//   { "phone_number": 742220443, "amount": 10000 },
//   { "phone_number": 758222374, "amount": 10000 },
//   { "phone_number": 753025215, "amount": 14000 },
//   { "phone_number": 743090525, "amount": 10000 },
//   { "phone_number": 740844901, "amount": 14000 },
//   { "phone_number": 750623235, "amount": 14000 },
//   { "phone_number": 741845024, "amount": 10000 },
//   { "phone_number": 740434872, "amount": 10000 },
//   { "phone_number": 703276752, "amount": 10000 },
//   { "phone_number": 759136143, "amount": 20000 },
//   { "phone_number": 706271701, "amount": 10000 },
//   { "phone_number": 759010393, "amount": 10000 },
//   { "phone_number": 753982893, "amount": 10000 },
//   { "phone_number": 708797784, "amount": 10000 },
//   { "phone_number": 700415511, "amount": 10000 },
//   { "phone_number": 708800974, "amount": 10000 },
//   { "phone_number": 750036676, "amount": 10000 },
//   { "phone_number": 700508006, "amount": 10000 },
//   { "phone_number": 705672015, "amount": 10000 },
//   { "phone_number": 758096188, "amount": 10000 },
//   { "phone_number": 743747835, "amount": 18000 },
//   { "phone_number": 750555263, "amount": 18000 },
//   { "phone_number": 755816648, "amount": 10000 },
//   { "phone_number": 757644045, "amount": 10000 },
//   { "phone_number": 742268243, "amount": 40000 },
//   { "phone_number": 740221932, "amount": 10000 },
//   { "phone_number": 753225052, "amount": 18000 },
//   { "phone_number": 707870424, "amount": 10000 },
//   { "phone_number": 703194029, "amount": 40000 },
//   { "phone_number": 742509158, "amount": 10000 },
//   { "phone_number": 709442925, "amount": 18000 },
//   { "phone_number": 708765324, "amount": 10000 },
//   { "phone_number": 707089636, "amount": 20000 },
//   { "phone_number": 705742068, "amount": 10000 },
//   { "phone_number": 751367007, "amount": 208000 },
//   { "phone_number": 754350170, "amount": 10000 },
//   { "phone_number": 758055077, "amount": 10000 },
//   { "phone_number": 706065420, "amount": 10000 },
//   { "phone_number": 744058090, "amount": 14000 },
//   { "phone_number": 743119584, "amount": 10000 },
//   { "phone_number": 706305075, "amount": 10000 },
//   { "phone_number": 755897591, "amount": 14000 },
//   { "phone_number": 751061015, "amount": 10000 },
//   { "phone_number": 755789817, "amount": 10000 },
//   { "phone_number": 707426133, "amount": 10000 },
//   { "phone_number": 707823891, "amount": 10000 },
//   { "phone_number": 759703643, "amount": 10000 },
//   { "phone_number": 759003963, "amount": 10000 },
//   { "phone_number": 753122043, "amount": 10000 },
//   { "phone_number": 700892883, "amount": 10000 },
//   { "phone_number": 708745039, "amount": 10000 },
//   { "phone_number": 753316969, "amount": 10000 },
//   { "phone_number": 705371938, "amount": 10000 },
//   { "phone_number": 751088515, "amount": 10000 },
//   { "phone_number": 757535290, "amount": 10000 },
//   { "phone_number": 706203037, "amount": 10000 },
//   { "phone_number": 706207210, "amount": 10000 },
//   { "phone_number": 743581162, "amount": 14000 },
//   { "phone_number": 702694286, "amount": 18000 },
//   { "phone_number": 709924865, "amount": 10000 },
//   { "phone_number": 741043747, "amount": 20000 },
//   { "phone_number": 757762761, "amount": 30000 },
//   { "phone_number": 708383934, "amount": 10000 },
//   { "phone_number": 704561720, "amount": 10000 },
//   { "phone_number": 754452522, "amount": 10000 },
//   { "phone_number": 704066209, "amount": 93000 },
//   { "phone_number": 702082482, "amount": 10000 },
//   { "phone_number": 702283160, "amount": 18000 }
// ]


// let combinedPayments = payment_numbers.map((phoneNumber, index) => {
//   return {
//     phone_number: phoneNumber,
//     amount: payment_amount[index],
//   };
// });

// console.log("Combined Payments:", combinedPayments);
//write this  to a file
// fs.writeFile('payments.json', JSON.stringify(combinedPayments))
//   .then(() => {
//     console.log('File written successfully');
//   })
//   .catch((err: any) => {
//     console.error('Error writing file:', err);
//   });


// let combinedPayments = [
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
//   { "phone_number": 700659605, "amount": 10000 },
//   { "phone_number": 701377572, "amount": 10000 },
//   { "phone_number": 758303153, "amount": 10000 },
//   { "phone_number": 709551279, "amount": 10000 },
//   { "phone_number": 743453953, "amount": 14000 },
//   { "phone_number": 700440544, "amount": 10000 },
//   { "phone_number": 709278507, "amount": 10000 },
//   { "phone_number": 759773977, "amount": 10000 },
//   { "phone_number": 704811422, "amount": 10000 },
//   { "phone_number": 751085268, "amount": 10000 },
//   { "phone_number": 751194038, "amount": 10000 },
//   { "phone_number": 753714841, "amount": 14000 },
//   { "phone_number": 752883692, "amount": 10000 },
//   { "phone_number": 707774730, "amount": 10000 },
//   { "phone_number": 752225351, "amount": 10000 },
//   { "phone_number": 752560013, "amount": 10000 },
//   { "phone_number": 708510859, "amount": 14000 },
//   { "phone_number": 742524333, "amount": 10000 },
//   { "phone_number": 754072548, "amount": 10000 },
//   { "phone_number": 700835797, "amount": 10000 },
//   { "phone_number": 707640557, "amount": 10000 },
//   { "phone_number": 705520531, "amount": 14000 },
//   { "phone_number": 755014764, "amount": 10000 },
//   { "phone_number": 701792283, "amount": 35000 },
//   { "phone_number": 754155216, "amount": 10000 },
//   { "phone_number": 704794563, "amount": 10000 },
//   { "phone_number": 752909225, "amount": 14000 },
//   { "phone_number": 702502728, "amount": 10000 },
//   { "phone_number": 751224476, "amount": 10000 },
//   { "phone_number": 701435756, "amount": 10000 },
//   { "phone_number": 708504613, "amount": 14000 },
//   { "phone_number": 740504201, "amount": 14000 },
//   { "phone_number": 705100734, "amount": 10000 },
//   { "phone_number": 752162722, "amount": 10000 },
//   { "phone_number": 705762881, "amount": 10000 },
//   { "phone_number": 704563728, "amount": 10000 },
//   { "phone_number": 705758296, "amount": 10000 },
//   { "phone_number": 742256068, "amount": 30000 },
//   { "phone_number": 753201326, "amount": 10000 },
//   { "phone_number": 742088772, "amount": 10000 },
//   { "phone_number": 706617599, "amount": 10000 },
//   { "phone_number": 751014859, "amount": 10000 },
//   { "phone_number": 754997400, "amount": 18000 },
//   { "phone_number": 759705276, "amount": 10000 },
//   { "phone_number": 754897284, "amount": 18000 },
//   { "phone_number": 741859475, "amount": 10000 },
//   { "phone_number": 700787003, "amount": 10000 },
//   { "phone_number": 740937765, "amount": 10000 },
//   { "phone_number": 709892072, "amount": 10000 },
//   { "phone_number": 744860116, "amount": 10000 },
//   { "phone_number": 753177466, "amount": 10000 },
//   { "phone_number": 702256430, "amount": 18000 },
//   { "phone_number": 755168928, "amount": 65000 },
//   { "phone_number": 742141392, "amount": 10000 },
//   { "phone_number": 704017842, "amount": 10000 },
//   { "phone_number": 704665960, "amount": 10000 },
//   { "phone_number": 709358793, "amount": 14000 },
//   { "phone_number": 754761340, "amount": 10000 },
//   { "phone_number": 740305224, "amount": 10000 },
//   { "phone_number": 740305224, "amount": 18000 },
//   { "phone_number": 757802457, "amount": 10000 },
//   { "phone_number": 756283736, "amount": 18000 },
//   { "phone_number": 703174487, "amount": 10000 },
//   { "phone_number": 704608746, "amount": 10000 },
//   { "phone_number": 708472125, "amount": 18000 },
//   { "phone_number": 741267721, "amount": 10000 },
//   { "phone_number": 759799954, "amount": 10000 },
//   { "phone_number": 750911250, "amount": 28000 },
//   { "phone_number": 744673144, "amount": 10000 },
//   { "phone_number": 701732579, "amount": 10000 },
//   { "phone_number": 740601387, "amount": 20000 },
//   { "phone_number": 708589868, "amount": 10000 },
//   { "phone_number": 753324580, "amount": 10000 },
//   { "phone_number": 704929742, "amount": 14000 },
//   { "phone_number": 757507158, "amount": 10000 },
//   { "phone_number": 742220443, "amount": 10000 },
//   { "phone_number": 758222374, "amount": 10000 },
//   { "phone_number": 753025215, "amount": 14000 },
//   { "phone_number": 743090525, "amount": 10000 },
//   { "phone_number": 740844901, "amount": 14000 },
//   { "phone_number": 750623235, "amount": 14000 },
//   { "phone_number": 741845024, "amount": 10000 },
//   { "phone_number": 740434872, "amount": 10000 },
//   { "phone_number": 703276752, "amount": 10000 },
//   { "phone_number": 759136143, "amount": 20000 },
//   { "phone_number": 706271701, "amount": 10000 },
//   { "phone_number": 759010393, "amount": 10000 },
//   { "phone_number": 753982893, "amount": 10000 },
//   { "phone_number": 708797784, "amount": 10000 },
//   { "phone_number": 700415511, "amount": 10000 },
//   { "phone_number": 708800974, "amount": 10000 },
//   { "phone_number": 750036676, "amount": 10000 },
//   { "phone_number": 700508006, "amount": 10000 },
//   { "phone_number": 705672015, "amount": 10000 },
//   { "phone_number": 758096188, "amount": 10000 },
//   { "phone_number": 743747835, "amount": 18000 },
//   { "phone_number": 750555263, "amount": 18000 },
//   { "phone_number": 755816648, "amount": 10000 },
//   { "phone_number": 757644045, "amount": 10000 },
//   { "phone_number": 742268243, "amount": 40000 },
//   { "phone_number": 740221932, "amount": 10000 },
//   { "phone_number": 753225052, "amount": 18000 },
//   { "phone_number": 707870424, "amount": 10000 },
//   { "phone_number": 703194029, "amount": 40000 },
//   { "phone_number": 742509158, "amount": 10000 },
//   { "phone_number": 709442925, "amount": 18000 },
//   { "phone_number": 708765324, "amount": 10000 },
//   { "phone_number": 707089636, "amount": 20000 },
//   { "phone_number": 705742068, "amount": 10000 },
//   { "phone_number": 751367007, "amount": 208000 },
//   { "phone_number": 754350170, "amount": 10000 },
//   { "phone_number": 758055077, "amount": 10000 },
//   { "phone_number": 706065420, "amount": 10000 },
//   { "phone_number": 744058090, "amount": 14000 },
//   { "phone_number": 743119584, "amount": 10000 },
//   { "phone_number": 706305075, "amount": 10000 },
//   { "phone_number": 755897591, "amount": 14000 },
//   { "phone_number": 751061015, "amount": 10000 },
//   { "phone_number": 755789817, "amount": 10000 },
//   { "phone_number": 707426133, "amount": 10000 },
//   { "phone_number": 707823891, "amount": 10000 },
//   { "phone_number": 759703643, "amount": 10000 },
//   { "phone_number": 759003963, "amount": 10000 },
//   { "phone_number": 753122043, "amount": 10000 },
//   { "phone_number": 700892883, "amount": 10000 },
//   { "phone_number": 708745039, "amount": 10000 },
//   { "phone_number": 753316969, "amount": 10000 },
//   { "phone_number": 705371938, "amount": 10000 },
//   { "phone_number": 751088515, "amount": 10000 },
//   { "phone_number": 757535290, "amount": 10000 },
//   { "phone_number": 706203037, "amount": 10000 },
//   { "phone_number": 706207210, "amount": 10000 },
//   { "phone_number": 743581162, "amount": 14000 },
//   { "phone_number": 702694286, "amount": 18000 },
//   { "phone_number": 709924865, "amount": 10000 },
//   { "phone_number": 741043747, "amount": 20000 },
//   { "phone_number": 757762761, "amount": 30000 },
//   { "phone_number": 708383934, "amount": 10000 },
//   { "phone_number": 704561720, "amount": 10000 },
//   { "phone_number": 754452522, "amount": 10000 },
//   { "phone_number": 704066209, "amount": 93000 },
//   { "phone_number": 702082482, "amount": 10000 },
//   { "phone_number": 702283160, "amount": 18000 },
//   { "phone_number": 707435246, "amount": 10000 },
//   { "phone_number": 751049130, "amount": 208000 },
//   { "phone_number": 706221424, "amount": 10000 },
//   { "phone_number": 756256667, "amount": 10000 },
//   { "phone_number": 752004558, "amount": 10000 },
//   { "phone_number": 741921576, "amount": 10000 },
//   { "phone_number": 753881127, "amount": 18000 },
//   { "phone_number": 704054344, "amount": 18000 },
//   { "phone_number": 752261049, "amount": 10000 },
//   { "phone_number": 740733972, "amount": 10000 },
//   { "phone_number": 755066981, "amount": 10000 },
//   { "phone_number": 709964362, "amount": 10000 },
//   { "phone_number": 753961676, "amount": 14000 },
//   { "phone_number": 703232255, "amount": 10000 },
//   { "phone_number": 752124320, "amount": 18000 },
//   { "phone_number": 744029899, "amount": 10000 },
//   { "phone_number": 757130372, "amount": 10000 },
//   { "phone_number": 743566845, "amount": 10000 },
//   { "phone_number": 708717752, "amount": 120000 },
//   { "phone_number": 758122393, "amount": 18000 },
//   { "phone_number": 700408523, "amount": 10000 },
//   { "phone_number": 706417423, "amount": 10000 },
//   { "phone_number": 706977279, "amount": 18000 },
//   { "phone_number": 708127676, "amount": 10000 },
//   { "phone_number": 704218308, "amount": 108000 },
//   { "phone_number": 759349269, "amount": 10000 },
//   { "phone_number": 756770737, "amount": 18000 },
//   { "phone_number": 753081661, "amount": 10000 },
//   { "phone_number": 742493662, "amount": 10000 },
//   { "phone_number": 701046300, "amount": 10000 },
//   { "phone_number": 704327265, "amount": 10000 },
//   { "phone_number": 701915814, "amount": 18000 },
//   { "phone_number": 703414915, "amount": 18000 },
//   { "phone_number": 744706599, "amount": 10000 },
//   { "phone_number": 701611993, "amount": 10000 },
//   { "phone_number": 709199151, "amount": 10000 },
//   { "phone_number": 700480272, "amount": 14000 },
//   { "phone_number": 709171407, "amount": 20000 },
//   { "phone_number": 700825044, "amount": 18000 },
//   { "phone_number": 756611025, "amount": 18000 },
//   { "phone_number": 705406897, "amount": 10000 },
//   { "phone_number": 709641543, "amount": 10000 },
//   { "phone_number": 756613732, "amount": 18000 },
//   { "phone_number": 743711785, "amount": 10000 },
//   { "phone_number": 709060253, "amount": 10000 },
//   { "phone_number": 709211649, "amount": 14000 },
//   { "phone_number": 753407715, "amount": 10000 },
//   { "phone_number": 709104617, "amount": 10000 },
//   { "phone_number": 704977612, "amount": 10000 },
//   { "phone_number": 755450017, "amount": 10000 },
//   { "phone_number": 753162332, "amount": 10000 },
//   { "phone_number": 701101451, "amount": 18000 },
//   { "phone_number": 758925177, "amount": 10000 },
//   { "phone_number": 753066923, "amount": 10000 },
//   { "phone_number": 759315147, "amount": 18000 },
//   { "phone_number": 752306916, "amount": 10000 },
//   { "phone_number": 741952443, "amount": 14000 },
//   { "phone_number": 704674642, "amount": 40000 },
//   { "phone_number": 756111390, "amount": 10000 },
//   { "phone_number": 742921390, "amount": 10000 },
//   { "phone_number": 708858959, "amount": 18000 },
//   { "phone_number": 703692206, "amount": 10000 },
//   { "phone_number": 704993584, "amount": 10000 },
//   { "phone_number": 705900852, "amount": 10000 },
//   { "phone_number": 708541034, "amount": 65000 },
//   { "phone_number": 754301513, "amount": 10000 },
//   { "phone_number": 704873781, "amount": 65000 },
//   { "phone_number": 750247436, "amount": 18000 },
//   { "phone_number": 709190777, "amount": 28000 },
//   { "phone_number": 751389100, "amount": 18000 },
//   { "phone_number": 751389100, "amount": 18000 },
//   { "phone_number": 757074034, "amount": 10000 },
//   { "phone_number": 742660947, "amount": 10000 },
//   { "phone_number": 752528015, "amount": 10000 },
//   { "phone_number": 755554903, "amount": 18000 },
//   { "phone_number": 754131666, "amount": 10000 },
//   { "phone_number": 740060706, "amount": 14000 },
//   { "phone_number": 741534177, "amount": 10000 },
//   { "phone_number": 743167407, "amount": 18000 },
//   { "phone_number": 742583470, "amount": 10000 },
//   { "phone_number": 743058415, "amount": 10000 },
//   { "phone_number": 759708522, "amount": 14000 },
//   { "phone_number": 755549305, "amount": 10000 },
//   { "phone_number": 740926173, "amount": 14000 },
//   { "phone_number": 704703905, "amount": 18000 },
//   { "phone_number": 701612191, "amount": 10000 },
//   { "phone_number": 759349269, "amount": 28000 },
//   { "phone_number": 751511450, "amount": 14000 },
//   { "phone_number": 709118912, "amount": 18000 },
//   { "phone_number": 708472056, "amount": 10000 },
//   { "phone_number": 705235153, "amount": 14000 },
//   { "phone_number": 700445532, "amount": 18000 },
//   { "phone_number": 705289018, "amount": 10000 },
//   { "phone_number": 707441525, "amount": 10000 },
//   { "phone_number": 705382496, "amount": 10000 },
//   { "phone_number": 753818298, "amount": 10000 },
//   { "phone_number": 755138863, "amount": 120000 },
//   { "phone_number": 708812139, "amount": 10000 },
//   { "phone_number": 756579757, "amount": 18000 },
//   { "phone_number": 759391420, "amount": 10000 },
//   { "phone_number": 754122501, "amount": 10000 },
//   { "phone_number": 709391319, "amount": 10000 },
//   { "phone_number": 759686152, "amount": 10000 },
//   { "phone_number": 755907412, "amount": 18000 },
//   { "phone_number": 707287508, "amount": 10000 },
//   { "phone_number": 706410444, "amount": 10000 },
//   { "phone_number": 703170689, "amount": 18000 },
//   { "phone_number": 743767634, "amount": 10000 },
//   { "phone_number": 742770092, "amount": 10000 },
//   { "phone_number": 742675445, "amount": 10000 },
//   { "phone_number": 700786688, "amount": 18000 },
//   { "phone_number": 756338737, "amount": 10000 },
//   { "phone_number": 758996023, "amount": 28000 },
//   { "phone_number": 705645432, "amount": 10000 },
//   { "phone_number": 742859812, "amount": 18000 },
//   { "phone_number": 754791035, "amount": 18000 },
//   { "phone_number": 705634704, "amount": 10000 },
//   { "phone_number": 742788543, "amount": 14000 },
//   { "phone_number": 750620251, "amount": 10000 },
//   { "phone_number": 743375864, "amount": 10000 },
//   { "phone_number": 742692873, "amount": 14000 },
//   { "phone_number": 701113168, "amount": 18000 },
//   { "phone_number": 708999528, "amount": 10000 },
//   { "phone_number": 708026028, "amount": 10000 },
//   { "phone_number": 743814765, "amount": 10000 },
//   { "phone_number": 740719927, "amount": 18000 },
//   { "phone_number": 707566493, "amount": 10000 },
//   { "phone_number": 705528994, "amount": 10000 },
//   { "phone_number": 704703905, "amount": 18000 },
//   { "phone_number": 706186932, "amount": 18000 },
//   { "phone_number": 740621201, "amount": 20000 },
//   { "phone_number": 752872046, "amount": 14000 },
//   { "phone_number": 702727425, "amount": 10000 },
//   { "phone_number": 753687310, "amount": 10000 },
//   { "phone_number": 742449630, "amount": 10000 },
//   { "phone_number": 707337877, "amount": 10000 },
//   { "phone_number": 754602660, "amount": 14000 },
//   { "phone_number": 759681061, "amount": 10000 },
//   { "phone_number": 706358331, "amount": 18000 },
//   { "phone_number": 755424614, "amount": 10000 },
//   { "phone_number": 707851533, "amount": 10000 },
//   { "phone_number": 707851533, "amount": 10000 },
//   { "phone_number": 703276809, "amount": 18000 },
//   { "phone_number": 708196191, "amount": 18000 },
//   { "phone_number": 705865163, "amount": 10000 },
//   { "phone_number": 709720806, "amount": 18000 },
//   { "phone_number": 759052877, "amount": 10000 },
//   { "phone_number": 707594526, "amount": 10000 },
//   { "phone_number": 743429050, "amount": 14000 },
//   { "phone_number": 707594526, "amount": 10000 },
//   { "phone_number": 707594526, "amount": 20000 },
//   { "phone_number": 701448227, "amount": 10000 },
//   { "phone_number": 741209819, "amount": 10000 },
//   { "phone_number": 757176888, "amount": 10000 },
//   { "phone_number": 704553694, "amount": 10000 },
//   { "phone_number": 752972897, "amount": 10000 },
//   { "phone_number": 757128019, "amount": 20000 },
//   { "phone_number": 701848842, "amount": 18000 },
//   { "phone_number": 752322768, "amount": 10000 },
//   { "phone_number": 758723052, "amount": 10000 },
//   { "phone_number": 706421786, "amount": 10000 },
//   { "phone_number": 744260248, "amount": 10000 },
//   { "phone_number": 706115719, "amount": 10000 },
//   { "phone_number": 744259959, "amount": 10000 },
//   { "phone_number": 754524554, "amount": 10000 },
//   { "phone_number": 702756152, "amount": 10000 },
//   { "phone_number": 744259951, "amount": 10000 },
//   { "phone_number": 706624033, "amount": 10000 },
//   { "phone_number": 756387454, "amount": 14000 },
//   { "phone_number": 704522458, "amount": 10000 },
//   { "phone_number": 752674759, "amount": 20000 },
//   { "phone_number": 753878429, "amount": 10000 },
//   { "phone_number": 701776166, "amount": 14000 },
//   { "phone_number": 708524288, "amount": 10000 },
//   { "phone_number": 750581018, "amount": 10000 },
//   { "phone_number": 700971789, "amount": 10000 },
//   { "phone_number": 701424177, "amount": 10000 },
//   { "phone_number": 743714101, "amount": 10000 },
//   { "phone_number": 742004204, "amount": 10000 },
//   { "phone_number": 751511450, "amount": 18000 },
//   { "phone_number": 752609663, "amount": 10000 },
//   { "phone_number": 752163731, "amount": 10000 },
//   { "phone_number": 709398800, "amount": 10000 },
//   { "phone_number": 743750040, "amount": 10000 },
//   { "phone_number": 704767924, "amount": 20000 },
//   { "phone_number": 741206226, "amount": 18000 },
//   { "phone_number": 740581613, "amount": 35000 },
//   { "phone_number": 741206226, "amount": 18000 },
//   { "phone_number": 740581613, "amount": 10000 },
//   { "phone_number": 701114820, "amount": 10000 },
//   { "phone_number": 758209165, "amount": 40000 },
//   { "phone_number": 701798119, "amount": 10000 },
//   { "phone_number": 740882180, "amount": 18000 },
//   { "phone_number": 740168566, "amount": 10000 },
//   { "phone_number": 755262744, "amount": 10000 },
//   { "phone_number": 751354329, "amount": 10000 },
//   { "phone_number": 708797835, "amount": 10000 },
//   { "phone_number": 706863970, "amount": 10000 },
//   { "phone_number": 756664374, "amount": 10000 },
//   { "phone_number": 701044006, "amount": 14000 },
//   { "phone_number": 708796141, "amount": 30000 },
//   { "phone_number": 704679923, "amount": 10000 },
//   { "phone_number": 709071978, "amount": 10000 },
//   { "phone_number": 751592377, "amount": 10000 },
//   { "phone_number": 750908439, "amount": 18000 },
//   { "phone_number": 741611526, "amount": 10000 },
//   { "phone_number": 753413173, "amount": 10000 },
//   { "phone_number": 755849465, "amount": 10000 },
//   { "phone_number": 754458663, "amount": 10000 },
//   { "phone_number": 752385211, "amount": 10000 },
//   { "phone_number": 701208835, "amount": 10000 },
//   { "phone_number": 704181277, "amount": 10000 },
//   { "phone_number": 759922923, "amount": 14000 },
//   { "phone_number": 707019738, "amount": 18000 },
//   { "phone_number": 704698178, "amount": 18000 },
//   { "phone_number": 744260375, "amount": 10000 },
//   { "phone_number": 750608824, "amount": 10000 },
//   { "phone_number": 741033984, "amount": 10000 },
//   { "phone_number": 752766008, "amount": 18000 },
//   { "phone_number": 704443846, "amount": 18000 },
//   { "phone_number": 754507549, "amount": 60000 },
//   { "phone_number": 743954152, "amount": 10000 },
//   { "phone_number": 752537737, "amount": 10000 },
//   { "phone_number": 751882389, "amount": 35000 },
//   { "phone_number": 742716619, "amount": 10000 },
//   { "phone_number": 757274430, "amount": 10000 },
//   { "phone_number": 750187328, "amount": 10000 },
//   { "phone_number": 751671811, "amount": 18000 },
//   { "phone_number": 742249990, "amount": 35000 },
//   { "phone_number": 757159453, "amount": 10000 },
//   { "phone_number": 759400303, "amount": 10000 },
//   { "phone_number": 759280945, "amount": 10000 },
//   { "phone_number": 706740260, "amount": 10000 },
//   { "phone_number": 752939973, "amount": 10000 },
//   { "phone_number": 741464976, "amount": 10000 },
//   { "phone_number": 753305044, "amount": 10000 },
//   { "phone_number": 705806992, "amount": 10000 },
//   { "phone_number": 703196342, "amount": 10000 },
//   { "phone_number": 706470044, "amount": 10000 },
//   { "phone_number": 744397163, "amount": 18000 },
//   { "phone_number": 708549663, "amount": 14000 },
//   { "phone_number": 742276513, "amount": 18000 },
//   { "phone_number": 754442697, "amount": 14000 },
//   { "phone_number": 759633893, "amount": 10000 },
//   { "phone_number": 744042513, "amount": 10000 },
//   { "phone_number": 708854691, "amount": 10000 },
//   { "phone_number": 752960192, "amount": 208000 },
//   { "phone_number": 759957653, "amount": 18000 },
//   { "phone_number": 751034967, "amount": 10000 },
//   { "phone_number": 750936957, "amount": 10000 },
//   { "phone_number": 706332850, "amount": 10000 },
//   { "phone_number": 740111391, "amount": 18000 },
//   { "phone_number": 700736746, "amount": 18000 },
//   { "phone_number": 742932853, "amount": 10000 },
//   { "phone_number": 706234793, "amount": 10000 },
//   { "phone_number": 755992935, "amount": 10000 },
//   { "phone_number": 751123031, "amount": 10000 },
//   { "phone_number": 751246617, "amount": 10000 },
//   { "phone_number": 705433878, "amount": 10000 },
//   { "phone_number": 701974000, "amount": 14000 },
//   { "phone_number": 743935905, "amount": 10000 },
//   { "phone_number": 758849307, "amount": 10000 },
//   { "phone_number": 742536986, "amount": 10000 },
//   { "phone_number": 702615748, "amount": 10000 },
//   { "phone_number": 706556371, "amount": 122000 },
//   { "phone_number": 708914135, "amount": 10000 },
//   { "phone_number": 700249855, "amount": 18000 },
//   { "phone_number": 707359014, "amount": 18000 },
//   { "phone_number": 752961878, "amount": 10000 },
//   { "phone_number": 705190635, "amount": 10000 },
//   { "phone_number": 744390994, "amount": 10000 },
//   { "phone_number": 708417179, "amount": 10000 },
//   { "phone_number": 756100717, "amount": 10000 },
//   { "phone_number": 743105154, "amount": 18000 },
//   { "phone_number": 759785803, "amount": 65000 },
//   { "phone_number": 743105154, "amount": 18000 },
//   { "phone_number": 754649203, "amount": 30000 },
//   { "phone_number": 701323264, "amount": 10000 },
//   { "phone_number": 701585832, "amount": 10000 },
//   { "phone_number": 702145122, "amount": 10000 },
//   { "phone_number": 754696066, "amount": 14000 },
//   { "phone_number": 754034758, "amount": 10000 },
//   { "phone_number": 704676228, "amount": 10000 },
//   { "phone_number": 702422135, "amount": 10000 },
//   { "phone_number": 753849297, "amount": 10000 },
//   { "phone_number": 708166399, "amount": 30000 },
//   { "phone_number": 706608096, "amount": 10000 },
//   { "phone_number": 759328487, "amount": 18000 },
//   { "phone_number": 744566816, "amount": 18000 },
//   { "phone_number": 754382831, "amount": 10000 },
//   { "phone_number": 755326045, "amount": 30000 },
//   { "phone_number": 755326045, "amount": 10000 },
//   { "phone_number": 753193623, "amount": 10000 },
//   { "phone_number": 702422135, "amount": 10000 },
//   { "phone_number": 704427414, "amount": 10000 },
//   { "phone_number": 701710882, "amount": 18000 },
//   { "phone_number": 708847210, "amount": 18000 },
//   { "phone_number": 750130327, "amount": 10000 },
//   { "phone_number": 707046253, "amount": 10000 },
//   { "phone_number": 741521048, "amount": 10000 },
//   { "phone_number": 707546356, "amount": 10000 },
//   { "phone_number": 707546356, "amount": 18000 },
//   { "phone_number": 740648803, "amount": 10000 },
//   { "phone_number": 700114189, "amount": 18000 },
//   { "phone_number": 756382501, "amount": 10000 },
//   { "phone_number": 753933751, "amount": 18000 },
//   { "phone_number": 744758018, "amount": 10000 },
//   { "phone_number": 743085710, "amount": 10000 },
//   { "phone_number": 700346734, "amount": 10000 },
//   { "phone_number": 757641157, "amount": 208000 },
//   { "phone_number": 740538509, "amount": 14000 },
//   { "phone_number": 744535345, "amount": 10000 },
//   { "phone_number": 741353516, "amount": 10000 },
//   { "phone_number": 700301829, "amount": 10000 },
//   { "phone_number": 744387090, "amount": 10000 },
//   { "phone_number": 743221064, "amount": 10000 },
//   { "phone_number": 706871388, "amount": 10000 },
//   { "phone_number": 757259108, "amount": 10000 },
//   { "phone_number": 706000363, "amount": 18000 },
//   { "phone_number": 701741153, "amount": 120000 },
//   { "phone_number": 743800625, "amount": 10000 },
//   { "phone_number": 759020160, "amount": 10000 },
//   { "phone_number": 704057299, "amount": 10000 },
//   { "phone_number": 758771181, "amount": 35000 },
//   { "phone_number": 706666923, "amount": 10000 },
//   { "phone_number": 705354222, "amount": 10000 },
//   { "phone_number": 752006729, "amount": 18000 },
//   { "phone_number": 707841849, "amount": 18000 },
//   { "phone_number": 700197703, "amount": 18000 },
//   { "phone_number": 702640983, "amount": 10000 },
//   { "phone_number": 708633631, "amount": 10000 },
//   { "phone_number": 706866816, "amount": 10000 },
//   { "phone_number": 707082130, "amount": 14000 },
//   { "phone_number": 709425504, "amount": 208000 },
//   { "phone_number": 708208101, "amount": 10000 },
//   { "phone_number": 709647478, "amount": 10000 },
//   { "phone_number": 756675109, "amount": 10000 },
//   { "phone_number": 752815271, "amount": 10000 },
//   { "phone_number": 752928241, "amount": 10000 },
//   { "phone_number": 708930717, "amount": 10000 },
//   { "phone_number": 753737847, "amount": 14000 },
//   { "phone_number": 753702871, "amount": 10000 },
//   { "phone_number": 703793609, "amount": 10000 },
//   { "phone_number": 701575696, "amount": 10000 },
//   { "phone_number": 708437592, "amount": 10000 },
//   { "phone_number": 757460866, "amount": 10000 },
//   { "phone_number": 751358484, "amount": 10000 },
//   { "phone_number": 744063922, "amount": 10000 },
//   { "phone_number": 758444378, "amount": 10000 },
//   { "phone_number": 758546762, "amount": 10000 },
//   { "phone_number": 755979078, "amount": 14000 },
//   { "phone_number": 740659851, "amount": 18000 },
//   { "phone_number": 709486201, "amount": 10000 },
//   { "phone_number": 706030750, "amount": 10000 },
//   { "phone_number": 702072357, "amount": 10000 },
//   { "phone_number": 702584602, "amount": 10000 },
//   { "phone_number": 703273922, "amount": 10000 },
//   { "phone_number": 743419090, "amount": 10000 },
//   { "phone_number": 743091044, "amount": 10000 },
//   { "phone_number": 708968403, "amount": 30000 },
//   { "phone_number": 752169337, "amount": 10000 },
//   { "phone_number": 701030486, "amount": 10000 },
//   { "phone_number": 743774334, "amount": 18000 },
//   { "phone_number": 751851144, "amount": 10000 },
//   { "phone_number": 702637953, "amount": 10000 },
//   { "phone_number": 741321213, "amount": 18000 },
//   { "phone_number": 744848091, "amount": 10000 },
//   { "phone_number": 701644295, "amount": 10000 },
//   { "phone_number": 706598380, "amount": 10000 },
//   { "phone_number": 740439467, "amount": 10000 },
//   { "phone_number": 755945150, "amount": 10000 },
//   { "phone_number": 706072312, "amount": 10000 },
//   { "phone_number": 754400114, "amount": 10000 },
//   { "phone_number": 751161435, "amount": 18000 },
//   { "phone_number": 759056204, "amount": 208000 },
//   { "phone_number": 741438374, "amount": 18000 },
//   { "phone_number": 702601259, "amount": 18000 },
//   { "phone_number": 744845994, "amount": 10000 },
//   { "phone_number": 755358636, "amount": 10000 },
//   { "phone_number": 743348242, "amount": 10000 },
//   { "phone_number": 740719927, "amount": 10000 },
//   { "phone_number": 702871522, "amount": 10000 },
//   { "phone_number": 708554367, "amount": 10000 },
//   { "phone_number": 704046796, "amount": 10000 },
//   { "phone_number": 704046796, "amount": 10000 },
//   { "phone_number": 741307430, "amount": 10000 },
//   { "phone_number": 701471443, "amount": 10000 },
//   { "phone_number": 759112253, "amount": 10000 },
//   { "phone_number": 743093236, "amount": 10000 },
//   { "phone_number": 752745529, "amount": 10000 },
//   { "phone_number": 758598269, "amount": 18000 },
//   { "phone_number": 753847669, "amount": 10000 },
//   { "phone_number": 702494612, "amount": 10000 },
//   { "phone_number": 707572675, "amount": 10000 },
//   { "phone_number": 740174855, "amount": 18000 },
//   { "phone_number": 757623931, "amount": 10000 },
//   { "phone_number": 702218355, "amount": 10000 },
//   { "phone_number": 706857421, "amount": 70000 },
//   { "phone_number": 741135388, "amount": 10000 },
//   { "phone_number": 702623800, "amount": 18000 },
//   { "phone_number": 741296176, "amount": 40000 },
//   { "phone_number": 701310915, "amount": 10000 },
//   { "phone_number": 757687798, "amount": 10000 },
//   { "phone_number": 704826610, "amount": 14000 },
//   { "phone_number": 743746171, "amount": 10000 },
//   { "phone_number": 709282624, "amount": 14000 },
//   { "phone_number": 705086870, "amount": 14000 },
//   { "phone_number": 753419472, "amount": 18000 },
//   { "phone_number": 759685046, "amount": 10000 },
//   { "phone_number": 708235415, "amount": 14000 },
//   { "phone_number": 750545006, "amount": 10000 },
//   { "phone_number": 708969575, "amount": 10000 },
//   { "phone_number": 757497018, "amount": 10000 },
//   { "phone_number": 740258784, "amount": 30000 },
//   { "phone_number": 750759077, "amount": 18000 },
//   { "phone_number": 742093892, "amount": 10000 },
//   { "phone_number": 707423070, "amount": 18000 },
//   { "phone_number": 753878280, "amount": 10000 },
//   { "phone_number": 706312451, "amount": 10000 },
//   { "phone_number": 703336282, "amount": 10000 },
//   { "phone_number": 741863662, "amount": 10000 },
//   { "phone_number": 751045196, "amount": 30000 },
//   { "phone_number": 740868993, "amount": 10000 },
//   { "phone_number": 708979712, "amount": 18000 },
//   { "phone_number": 752322768, "amount": 10000 },
//   { "phone_number": 740868993, "amount": 18000 },
//   { "phone_number": 750924432, "amount": 50000 },
//   { "phone_number": 702744954, "amount": 10000 },
//   { "phone_number": 741908173, "amount": 10000 },
//   { "phone_number": 700238213, "amount": 10000 },
//   { "phone_number": 756073577, "amount": 10000 },
//   { "phone_number": 702728821, "amount": 18000 },
//   { "phone_number": 703245258, "amount": 10000 },
//   { "phone_number": 759207018, "amount": 10000 },
//   { "phone_number": 744291204, "amount": 10000 },
//   { "phone_number": 741730491, "amount": 10000 },
//   { "phone_number": 707171523, "amount": 18000 },
//   { "phone_number": 741903253, "amount": 10000 },
//   { "phone_number": 700115569, "amount": 14000 },
//   { "phone_number": 750798790, "amount": 10000 },
//   { "phone_number": 758478086, "amount": 10000 },
//   { "phone_number": 751966786, "amount": 10000 },
//   { "phone_number": 756676903, "amount": 10000 },
//   { "phone_number": 709169061, "amount": 18000 },
//   { "phone_number": 758195415, "amount": 10000 },
//   { "phone_number": 705279415, "amount": 18000 },
//   { "phone_number": 707105583, "amount": 10000 },
//   { "phone_number": 754685152, "amount": 10000 },
//   { "phone_number": 759881281, "amount": 10000 },
//   { "phone_number": 707033083, "amount": 10000 },
//   { "phone_number": 755066582, "amount": 10000 },
//   { "phone_number": 705358503, "amount": 18000 },
//   { "phone_number": 709833186, "amount": 10000 },
//   { "phone_number": 703593059, "amount": 14000 },
//   { "phone_number": 701774061, "amount": 10000 },
//   { "phone_number": 705161286, "amount": 18000 },
//   { "phone_number": 759730720, "amount": 10000 },
//   { "phone_number": 754093939, "amount": 10000 },
//   { "phone_number": 750722088, "amount": 10000 },
//   { "phone_number": 704728761, "amount": 10000 },
//   { "phone_number": 703741034, "amount": 10000 },
//   { "phone_number": 755309306, "amount": 10000 },
//   { "phone_number": 752883695, "amount": 10000 },
//   { "phone_number": 752374321, "amount": 10000 },
//   { "phone_number": 752209897, "amount": 10000 },
//   { "phone_number": 756720651, "amount": 10000 },
//   { "phone_number": 701349009, "amount": 18000 },
//   { "phone_number": 705283369, "amount": 10000 },
//   { "phone_number": 743951688, "amount": 18000 },
//   { "phone_number": 759663348, "amount": 10000 },
//   { "phone_number": 744053622, "amount": 10000 },
//   { "phone_number": 703430090, "amount": 10000 },
//   { "phone_number": 743797986, "amount": 10000 },
//   { "phone_number": 751374896, "amount": 10000 },
//   { "phone_number": 743797986, "amount": 10000 },
//   { "phone_number": 743797986, "amount": 10000 },
//   { "phone_number": 756975915, "amount": 10000 },
//   { "phone_number": 751736769, "amount": 10000 },
//   { "phone_number": 758653832, "amount": 10000 },
//   { "phone_number": 758653832, "amount": 10000 },
//   { "phone_number": 753850675, "amount": 18000 },
//   { "phone_number": 757990266, "amount": 14000 },
//   { "phone_number": 701368830, "amount": 14000 },
//   { "phone_number": 755903048, "amount": 10000 },
//   { "phone_number": 708117742, "amount": 14000 },
//   { "phone_number": 752601181, "amount": 10000 },
//   { "phone_number": 758149530, "amount": 10000 },
//   { "phone_number": 708389895, "amount": 10000 },
//   { "phone_number": 741007366, "amount": 10000 },
//   { "phone_number": 708104857, "amount": 10000 },
//   { "phone_number": 702072230, "amount": 10000 },
//   { "phone_number": 707709478, "amount": 10000 },
//   { "phone_number": 700226929, "amount": 18000 },
//   { "phone_number": 758049297, "amount": 10000 },
//   { "phone_number": 706097985, "amount": 10000 },
//   { "phone_number": 706000691, "amount": 18000 },
//   { "phone_number": 704965086, "amount": 20000 },
//   { "phone_number": 757891741, "amount": 10000 },
//   { "phone_number": 758414445, "amount": 18000 },
//   { "phone_number": 705857706, "amount": 10000 },
//   { "phone_number": 753342934, "amount": 14000 },
//   { "phone_number": 705685612, "amount": 18000 },
//   { "phone_number": 759640308, "amount": 14000 },
//   { "phone_number": 703658093, "amount": 18000 },
//   { "phone_number": 704017833, "amount": 10000 },
//   { "phone_number": 702582291, "amount": 10000 },
//   { "phone_number": 707271181, "amount": 10000 },
//   { "phone_number": 701168622, "amount": 10000 },
//   { "phone_number": 743316982, "amount": 10000 },
//   { "phone_number": 740729585, "amount": 18000 },
//   { "phone_number": 701600858, "amount": 65000 },
//   { "phone_number": 703427249, "amount": 18000 },
//   { "phone_number": 754747002, "amount": 10000 },
//   { "phone_number": 701109454, "amount": 10000 },
//   { "phone_number": 743645877, "amount": 10000 },
//   { "phone_number": 755068231, "amount": 18000 },
//   { "phone_number": 754863995, "amount": 18000 },
//   { "phone_number": 708383165, "amount": 10000 },
//   { "phone_number": 743675045, "amount": 18000 },
//   { "phone_number": 705670701, "amount": 10000 },
//   { "phone_number": 757461024, "amount": 10000 },
//   { "phone_number": 700371943, "amount": 10000 },
//   { "phone_number": 752071226, "amount": 18000 },
//   { "phone_number": 751060363, "amount": 10000 },
//   { "phone_number": 753038978, "amount": 120000 },
//   { "phone_number": 707786656, "amount": 10000 },
//   { "phone_number": 742114361, "amount": 10000 },
//   { "phone_number": 750160998, "amount": 18000 },
//   { "phone_number": 753330942, "amount": 10000 },
//   { "phone_number": 702020561, "amount": 10000 },
//   { "phone_number": 752729882, "amount": 18000 },
//   { "phone_number": 707974120, "amount": 18000 },
//   { "phone_number": 754175276, "amount": 10000 },
//   { "phone_number": 741051402, "amount": 14000 },
//   { "phone_number": 704121675, "amount": 10000 },
//   { "phone_number": 708464605, "amount": 35000 },
//   { "phone_number": 706084975, "amount": 10000 },
//   { "phone_number": 751164547, "amount": 10000 },
//   { "phone_number": 706484411, "amount": 10000 },
//   { "phone_number": 758364491, "amount": 10000 },
//   { "phone_number": 707267292, "amount": 10000 },
//   { "phone_number": 755610648, "amount": 18000 },
//   { "phone_number": 754120461, "amount": 10000 },
//   { "phone_number": 751611675, "amount": 10000 },
//   { "phone_number": 753096236, "amount": 18000 },
//   { "phone_number": 700963885, "amount": 10000 },
//   { "phone_number": 708850008, "amount": 18000 },
//   { "phone_number": 708646256, "amount": 10000 },
//   { "phone_number": 707583722, "amount": 10000 },
//   { "phone_number": 758982871, "amount": 35000 },
//   { "phone_number": 759753856, "amount": 10000 },
//   { "phone_number": 740937212, "amount": 18000 },
//   { "phone_number": 709370881, "amount": 18000 },
//   { "phone_number": 756086992, "amount": 10000 },
//   { "phone_number": 744237497, "amount": 35000 },
//   { "phone_number": 743787789, "amount": 10000 },
//   { "phone_number": 742642472, "amount": 10000 },
//   { "phone_number": 743047718, "amount": 10000 },
//   { "phone_number": 754315234, "amount": 18000 },
//   { "phone_number": 759604887, "amount": 10000 },
//   { "phone_number": 743157641, "amount": 10000 },
//   { "phone_number": 742335529, "amount": 10000 },
//   { "phone_number": 700436475, "amount": 18000 },
//   { "phone_number": 709612345, "amount": 10000 },
//   { "phone_number": 751733533, "amount": 18000 },
//   { "phone_number": 754178456, "amount": 10000 },
//   { "phone_number": 755946293, "amount": 14000 },
//   { "phone_number": 741136729, "amount": 18000 },
//   { "phone_number": 758453207, "amount": 10000 },
//   { "phone_number": 740827567, "amount": 14000 },
//   { "phone_number": 757998947, "amount": 10000 },
//   { "phone_number": 757244303, "amount": 10000 },
//   { "phone_number": 757352503, "amount": 10000 },
//   { "phone_number": 702555180, "amount": 50000 },
//   { "phone_number": 752329881, "amount": 10000 },
//   { "phone_number": 759928029, "amount": 10000 },
//   { "phone_number": 700265195, "amount": 10000 },
//   { "phone_number": 758922822, "amount": 10000 },
//   { "phone_number": 752041994, "amount": 10000 },
//   { "phone_number": 704096538, "amount": 18000 },
//   { "phone_number": 740825822, "amount": 10000 },
//   { "phone_number": 751100602, "amount": 10000 },
//   { "phone_number": 707008142, "amount": 14000 },
//   { "phone_number": 700416908, "amount": 120000 },
//   { "phone_number": 702889121, "amount": 10000 },
//   { "phone_number": 700549492, "amount": 10000 },
//   { "phone_number": 743097846, "amount": 10000 },
//   { "phone_number": 704581998, "amount": 18000 },
//   { "phone_number": 708650868, "amount": 10000 },
//   { "phone_number": 757082835, "amount": 20000 },
//   { "phone_number": 753312297, "amount": 10000 },
//   { "phone_number": 752423278, "amount": 10000 },
//   { "phone_number": 705333430, "amount": 50000 },
//   { "phone_number": 709609610, "amount": 10000 },
//   { "phone_number": 756802504, "amount": 18000 },
//   { "phone_number": 752375232, "amount": 18000 },
//   { "phone_number": 754814369, "amount": 10000 },
//   { "phone_number": 754381794, "amount": 10000 },
//   { "phone_number": 709834488, "amount": 10000 },
//   { "phone_number": 753408195, "amount": 18000 },
//   { "phone_number": 709934133, "amount": 18000 },
//   { "phone_number": 705299831, "amount": 18000 },
//   { "phone_number": 706399340, "amount": 10000 },
//   { "phone_number": 751310088, "amount": 10000 },
//   { "phone_number": 751717053, "amount": 10000 },
//   { "phone_number": 702542828, "amount": 10000 },
//   { "phone_number": 754177440, "amount": 10000 },
//   { "phone_number": 703688428, "amount": 10000 },
//   { "phone_number": 744676343, "amount": 10000 },
//   { "phone_number": 743136197, "amount": 10000 },
//   { "phone_number": 754926594, "amount": 10000 },
//   { "phone_number": 752493160, "amount": 10000 },
//   { "phone_number": 709626453, "amount": 14000 },
//   { "phone_number": 700860551, "amount": 10000 },
//   { "phone_number": 703571290, "amount": 10000 },
//   { "phone_number": 704201991, "amount": 10000 },
//   { "phone_number": 701237357, "amount": 167000 },
//   { "phone_number": 702210391, "amount": 10000 },
//   { "phone_number": 740875681, "amount": 10000 },
//   { "phone_number": 758369029, "amount": 10000 },
//   { "phone_number": 750192578, "amount": 10000 },
//   { "phone_number": 759691881, "amount": 18000 },
//   { "phone_number": 701785673, "amount": 40000 },
//   { "phone_number": 704798015, "amount": 10000 },
//   { "phone_number": 701785673, "amount": 18000 },
//   { "phone_number": 702901263, "amount": 10000 },
//   { "phone_number": 742924472, "amount": 10000 },
//   { "phone_number": 759541169, "amount": 93000 },
//   { "phone_number": 756114141, "amount": 10000 },
//   { "phone_number": 752598863, "amount": 10000 },
//   { "phone_number": 703738003, "amount": 10000 },
//   { "phone_number": 750255737, "amount": 10000 },
//   { "phone_number": 700350154, "amount": 10000 },
//   { "phone_number": 706629024, "amount": 10000 },
//   { "phone_number": 704166578, "amount": 10000 },
//   { "phone_number": 741652220, "amount": 10000}
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

// // Process combinedPayments array with delays
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
//           user_id:  user.user_id,
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
//         await new Promise(resolve => setTimeout(resolve, 3000)); // 1000ms delay (adjust as needed)
//       } catch (error) {
//         // Handle errors during database updates
//         handleDbError(error, policy.phone_number, policy.amount);
//       }
//     }
//   })
//   .then(async () => {
//     // Write the policies to a file with a delay
//     await new Promise(resolve => setTimeout(resolve, 3000)); // 1000ms delay (adjust as needed)
//     await fs.promises.writeFile('all_paid_policies.json', JSON.stringify(policies));
//     console.log('File written successfully');
//   })
//   .catch((error) => {
//     console.error("Error processing payments:", error);
//   });




// Write the policies to a file
//   fs.writeFile('all_paid_policies.json', JSON.stringify(policies))
//     .then(() => {
//       console.log('File written successfully');
//     })
//     .catch((err) => {
//       console.error('Error writing file:', err);
//     });
// })
// .catch((error) => {
//   console.error("Error fetching policies:", error);


// // Schedule the job to run after 300 minutes (5 hours)
// agenda.schedule('in 3 minutes', 'create_dependant');

// // Start the Agenda instance
// (async () => {
//   console.log('Starting agenda instance...');
//   await agenda.start();
// })();


//delete column bemeficiary_id from transactions table
//db.transactions.removeAttribute('beneficiary_id')

//insert a test pdf to policy table, colunm policy_documents which id jsonb[]
// db.policies.update(
//     { policy_documents: [{ name: "policy document", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }] },
//     { where: { partner_id: 3 } }
// )

// add column policy_pending_premium to policy table 

//get policy by policy_id  policy_id ='6b586c01-d3d9-4870-8ee7-0ea543dc8501'
// db.policies.findAll({
//     // where: {
//     //   policy_id: 'eba7ad59-3277-444d-a8ba-c5c3108c07ac'
//     // }
//   }).then((policy:any) => {
//     console.log("POLICY: ", policy)

//   }).catch((err:any) => {
//     console.log(err)
//   })

//   db.transactions.findAll({
//     // where: {
//     //   policy_id: 'eba7ad59-3277-444d-a8ba-c5c3108c07ac'
//     // }
//   }).then((transaction:any) => {
//     console.log("TRANSACTIONS: ", transaction)

//   }).catch((err:any) => {
//     console.log(err)
//   })

//update users table column number_of_policies with the number of policies a user has
// db.users.findAll().then((user: any) => {
//   user.forEach((user: any) => {
//     db.policies.findAll({
//       where: {
//         user_id: user.user_id
//       }
//     }).then((policy: any) => {

//       db.users.update(
//         { number_of_policies: policy.length },
//         { where: { user_id: user.user_id } }
//       )
//     }).catch((err: any) => {
//       console.log(err)
//     })
//   })

// }).catch((err: any) => {
//   console.log(err)
// })

//update installment_order for policies with multiple installments
// db.policies.findAll().then((policy: any) => {
//   policy.forEach((policy: any) => {
//     db.installments.findAll({
//       where: {
//         policy_id: policy.policy_id,

//       }
//     }).then((installment: any) => {
//       let installmentOrder = 0
//       installment.forEach((installment: any) => {
//         installmentOrder += 1
//         db.policies.update(
//           { installment_order: installmentOrder },
//           {
//             where: { policy_id: policy.policy_id,  policy_status: 'paid' }
//           }
//         )

//       })
//     }).catch((err: any) => {
//       console.log(err)
//     })
//   })
// }).catch((err: any) => {
//   console.log(err)
// })






//update pending premium for policies
//   db.policies.findAll().then((policy:any) => {
//     console.log("POLICY: ", policy)
//    policy.forEach((policy:any) => {
//     db.transactions.findAll({
//         where: {
//           policy_id: policy.policy_id
//         }
//       }).then((transaction:any) => {
//         console.log("TRANSACTIONS: ", transaction)
//         let pendingPremium = 0
//         transaction.forEach((transaction:any) => {
//             pendingPremium += transaction.amount
//         })
//         db.policies.update(
//             { policy_pending_premium: pendingPremium },
//             { where: { policy_id: policy.policy_id } }
//         )
//       }).catch((err:any) => {
//         console.log(err)
//       })
//    })
//   }).catch((err:any) => {
//     console.log(err)
//   })


// const selectedPolicy = await db.policies.findOne({
//   where: {
//     policy_id: policy_id
//   }
// })
// console.log('POLICY', selectedPolicy);

// if(selectedPolicy.policy_status == 'paid' && selectedPolicy.policy_paid_amount == selectedPolicy.premium){
//   console.log('POLICY ALREADY PAID FOR');
//    // create installment
//    await db.installments.create({
//     installment_id: uuidv4(),
//     policy_id: selectedPolicy.policy_id,
//     installment_order: selectedPolicy.installment_order,
//     installment_date: new Date(),
//     installment_alert_date: new Date(),
//     tax_rate_vat: selectedPolicy.tax_rate_vat,
//     tax_rate_ext: selectedPolicy.tax_rate_ext,
//     premium: selectedPolicy.premium,
//     sum_insured: selectedPolicy.sum_insured,
//     excess_premium: selectedPolicy.excess_premium,
//     discount_premium: selectedPolicy.discount_premium,
//     currency_code: selectedPolicy.currency_code,
//     country_code: selectedPolicy.country_code,
//   });

// }






//syncing the model
// sequelize.sync().then(() => {
//   console.log(`Database & tables created! time: ${new Date()}`)
// }).catch((err) => {
//   console.log(err)
// })



async function allPaidPolicies() {
  try {
    let allPaidPolicies = await db.policies.findAll({
      where: {
        policy_status: 'paid',
        partner_id: 2,
        arr_policy_number: null,
      },
      include: [
        {
          model: db.users,
          as: 'user',
        },
      ],
    });

    async function processPolicy(policy) {
      const policy_start_date = policy.policy_start_date;
      const policy_end_date = policy.policy_end_date;
      policy.policy_start_date = policy_start_date;
      policy.policy_end_date = policy_end_date;

      const arr_member = await registerPrincipal(policy.user, policy);
      console.log('arr_member', arr_member);
    }

    async function processPoliciesSequentially() {
      for (const policy of allPaidPolicies) {
        await processPolicy(policy);
        // Wait for 2 seconds before processing the next policy
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Start processing policies
    await processPoliciesSequentially();

    return 'done';
  } catch (err) {
    console.error('Error:', err);
    return 'error';
  }
}

//allPaidPolicies()

async function updatePremiumArr() {
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

    async function processPolicy(policy) {
      const policy_start_date = policy.policy_start_date;
      const policy_end_date = policy.policy_end_date;
      policy.policy_start_date = policy_start_date;
      policy.policy_end_date = policy_end_date;

      const arr_member = await updatePremium(policy.user, policy);
      console.log('arr_member', arr_member);
    }

    async function processPoliciesSequentially() {
      for (const policy of allPaidPolicies) {
        await processPolicy(policy);
        // Wait for 2 seconds before processing the next policy
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Start processing policies
    await processPoliciesSequentially();

    return 'done';
  } catch (err) {
    console.error('Error:', err);
    return 'error';
  }
}

// updatePremiumArr()

// update number_of_policies in users table with the number of paid policies a user has
// db.users.findAll(
//   {
//     where: {
//        arr_member_number: {
//           [Op.ne]: null
//         },
//     }
//   }
// ).then((user: any) => {
//   user.forEach((user: any) => {
//     db.policies.findAll({
//       where: {
//         user_id: user.user_id,
//         policy_status: 'paid'
//       }
//     }).then((policy: any) => {

//       db.users.update(
//         { number_of_policies: policy.length },
//         { where: { user_id: user.user_id } }
//       )
//     }).catch((err: any) => {
//       console.log(err)
//     })
//   })

// }
// ).catch((err: any) => {
//   console.log(err)
// })




// get all paid installments  per unique policy_id and sum the amount paid
// db.policies.findAll(
//   {
//     where: {
//       policy_status: 'paid'
//     }
//   }
// ).then((policy: any) => {
//   let total = 0
//   policy.forEach((policy: any) => {
//     db.installments.findAll({
//       where: {
//         policy_id: policy.policy_id,
//       }
//     }).then((installment: any) => {
//       installment.forEach((installment: any) => {
//         total += installment.premium
//   console.log('TOTAL', total);

//       })
//     }).catch((err: any) => {
//       console.log(err)
//     })
//   })
//   console.log('TOTAL', total);

// }
// ).catch((err: any) => {
//   console.log(err)
// })



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


// Call the function to send policy anniversary reminders
//sendPolicyAnniversaryReminders();
// Schedule the updatePolicies function to run every hour
// cron.schedule('0 * * * *', () => {
//   console.log('Running updateUserPolicies...');
//   updatePolicies();
//   console.log('Done.');
// });



module.exports = { db }

