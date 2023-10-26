const { Sequelize, DataTypes } = require('sequelize')
import { v4 as uuidv4 } from 'uuid'
import { fetchMemberStatusData, registerDependant, registerPrincipal, updatePremium } from '../services/aar';
import { all } from 'axios';
require('dotenv').config()
const fs = require('fs/promises'); // Use promises-based fs
const { Op } = require('sequelize');

const Agenda = require('agenda');


const sequelize = new Sequelize(process.env.DB_URL, { dialect: "postgres" })

//checking if connection is done
sequelize.authenticate().then(() => {
  console.log(`Database connected to Airtel`)
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
db.policy_schedules = require('./PolicySchedule')(sequelize, DataTypes)


// const agenda = new Agenda({
//   db: { instance: db, collection: 'beneficiaries' }, // Replace 'agendaJobs' with your table name
// });


// // Define a function to create the dependent
// async function createDependant(phone_number: string, policy_id: string) {
//   console.log('=========== createDependant ============ ', phone_number, policy_id);
//   // let dependant
//   const existingUser = await db.users.findOne({
//     where: {
//       phone_number: '256772381544'
//     }
//   })
//   console.log('excistingUser', existingUser);

//   let myPolicy = await db.policies.findOne({
//     where: {
//       user_id: existingUser.user_id,
//       policy_status: 'paid'
//     }
//   })

//   console.log('myPolicy', myPolicy);

//   let dependant

//   let arr_member = await fetchMemberStatusData({
//     member_no: existingUser.arr_member_number,
//     unique_profile_id: existingUser.membership_id + "",
//   });
//   console.log("arr_member", arr_member);
//   let dependant_first_name = "first_name_1"
//   let dependant_other_names = "other_names_1"
//   let dependant_surname = "surname_1"
//   if (arr_member.code == 200) {
//     dependant = await registerDependant({
//       member_no: existingUser.arr_member_number,
//       surname: dependant_surname,
//       first_name: dependant_first_name,
//       other_names: dependant_other_names,
//       gender: 1,
//       dob: "1990-01-01",
//       email: "dependant@bluewave.insure",
//       pri_dep: "25",
//       family_title: "4", //4 spouse // 3 -principal // 25 - child
//       tel_no: "256772381544",
//       next_of_kin: {
//         surname: "",
//         first_name: "",
//         other_names: "",
//         tel_no: "",
//       },
//       member_status: "1",
//       health_option: "63",
//       health_plan: "AIRTEL_" + myPolicy?.policy_type,
//       policy_start_date: myPolicy.policy_start_date,
//       policy_end_date: myPolicy.policy_end_date,
//       unique_profile_id: existingUser.membership_id + "-01",
//     });
//   }
//   console.log("AAR DEPENDANT", dependant);
//   if (arr_member.code == 200) {
//     console.log("MEMBER STATUS", arr_member);
//     myPolicy.arr_policy_number = arr_member?.policy_no;

//     let updatePremiumData = await updatePremium(dependant, myPolicy);
//     console.log("AAR UPDATE PREMIUM -member found", updatePremiumData);
//   }


//   console.log('Dependant created:', dependant);

//   // Check if you want to update the premium here
//   if (arr_member.code == 200) {
//     console.log('MEMBER STATUS', arr_member);
//     myPolicy.arr_policy_number = arr_member?.policy_no;

//     let updatePremiumData = await updatePremium(dependant, myPolicy);
//     console.log('AAR UPDATE PREMIUM -member found', updatePremiumData);
//   }
// }

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

// delete users with user_id a1a3721d-18f8-4fd9-baca-0c1de553d182 and 5c7ae55c-76bf-43b7-979e-5fc16bfaab43
// db.users.destroy({
//     where: {
//       user_id: '5c7ae55c-76bf-43b7-979e-5fc16bfaab43'
//     }
//   }).then((user:any) => {
//     console.log("DELETED USER: ", user)

//   }).catch((err:any) => {
//     console.log(err)
//   })






//syncing the model
// sequelize.sync().then(() => {
//   console.log(`Database & tables created! time: ${new Date()}`)
// }).catch((err) => {
//   console.log(err)
// })


//clear the arr_member_number column in users table
//  db.users.update(
//     { arr_member_number: null },{where :{partner_id: 5}},{ multi: true }
//   ).then((user:any) => {
//     console.log("UPDATED USER: ", user)

//   }
//   ).catch((err:any) => {
//     console.log(err)
//   })

 // get all users with policy_status == "paid" in polices table and no arr_member_number and partner_id = 2

 
//  async function allPaidPolicies() {
//    try {
//      // Fetch all policies with status "paid"
//      const allPolicies = await db.policies.findAll({
//        where: {
//          policy_status: 'paid',
//        },
//      });
 
//      let updatePremiumResponse, arr_response
//      // Use Promise.all to parallelize user queries
//      const promises = allPolicies.map(async (policy) => {
//        const user = await db.users.findOne({
//          where: {
//            user_id: 'f76379e9-8754-4038-aa0b-0bc2354c572e',
//            partner_id: 2,
//          },
//        });
 
//        // Check if user is found
//        if (user) {
//          arr_response = await registerPrincipal(user, policy);
//          console.log('arr_response', arr_response);
 
//          if (arr_response.code === 200) {
//             updatePremiumResponse = await updatePremium(user, policy);
//            console.log('updatePremiumResponse', updatePremiumResponse);
//          }
 
//          // Use Promise.all to ensure all Promises are resolved
//          return user;
//        }
//      });
 
//      const allUsers = await Promise.all(promises);
 
//      // Save data to files
//      await fs.writeFile('allUsers.txt', JSON.stringify(allUsers));
//      console.log('Saved allUsers.txt');
     
//      await fs.writeFile('arrPrincipal.txt', JSON.stringify(arr_response));
//      console.log('Saved arrPrincipal.txt');
     
//      await fs.writeFile('updatePremiumData.txt', JSON.stringify(updatePremiumResponse));
//      console.log('Saved updatePremiumData.txt');
     
//      return 'done';
//    } catch (err) {
//      console.error('Error:', err);
//      return 'error';
//    }
//  }
 

//allPaidPolicies()










module.exports = { db }

