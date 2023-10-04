const { Sequelize, DataTypes } = require('sequelize')
import { v4 as uuidv4 } from 'uuid'


const sequelize = new Sequelize(`postgres://postgres:bluewave-postgres@bluewave-postgres.cemxniymyjt7.us-east-1.rds.amazonaws.com:5432/airtelDB`, { dialect: "postgres" })

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


//exporting the module
module.exports = { db }

