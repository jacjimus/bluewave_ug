"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(`postgres://postgres:bluewave-postgres@bluewave-postgres.cemxniymyjt7.us-east-1.rds.amazonaws.com:5432/airtelDB`, { dialect: "postgres" });
//checking if connection is done
sequelize.authenticate().then(() => {
    console.log(`Database connected to Airtel`);
}).catch((err) => {
    console.log(err);
});
exports.db = {};
exports.db.Sequelize = Sequelize;
exports.db.sequelize = sequelize;
//connecting to model
exports.db.users = require('./User')(sequelize, DataTypes);
exports.db.policies = require('./Policy')(sequelize, DataTypes);
exports.db.claims = require('./Claim')(sequelize, DataTypes);
exports.db.payments = require('./Payment')(sequelize, DataTypes);
exports.db.sessions = require('./Session')(sequelize, DataTypes);
exports.db.beneficiaries = require('./Beneficiary')(sequelize, DataTypes);
exports.db.partners = require('./Partner')(sequelize, DataTypes);
exports.db.products = require('./Product')(sequelize, DataTypes);
exports.db.logs = require('./Log')(sequelize, DataTypes);
exports.db.transactions = require('./Transaction')(sequelize, DataTypes);
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
exports.db.users.findAll().then((user) => {
    console.log("USER: ", user);
    user.forEach((user) => {
        exports.db.policies.findAll({
            where: {
                user_id: user.user_id
            }
        }).then((policy) => {
            console.log("POLICY: ", policy);
            exports.db.users.update({ number_of_policies: policy.length }, { where: { user_id: user.user_id } });
        }).catch((err) => {
            console.log(err);
        });
    });
}).catch((err) => {
    console.log(err);
});
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
    console.log(`Database & tables created!`);
}).catch((err) => {
    console.log(err);
});
//exporting the module
module.exports = { db: exports.db };
