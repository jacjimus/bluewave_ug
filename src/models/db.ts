import { Transaction } from "sequelize"

const { Sequelize, DataTypes } = require('sequelize')

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
db.users.findAll().then((user:any) => {
    console.log("USER: ", user)

    user.forEach((user:any) => {
        db.policies.findAll({
            where: {
              user_id: user.user_id
            }
          }).then((policy:any) => {
            console.log("POLICY: ", policy)
            db.users.update(
                { number_of_policies: policy.length },
                { where: { user_id: user.user_id } }
            )
          }).catch((err:any) => {
            console.log(err)
          })
    })

  }).catch((err:any) => {
    console.log(err)
  })



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








//syncing the model
sequelize.sync().then(() => {
    console.log(`Database & tables created!`)
}).catch((err) => {
    console.log(err)
})


//exporting the module
module.exports = { db }

