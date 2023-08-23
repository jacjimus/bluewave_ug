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
//update all user records to have a membership_id column Math.floor(100000 + Math.random() * 900000)
// let id = 2
// db.sessions.update({ parter_id: id }, {
//     where: {
//         language: 'en'
//     }
// }).then((res) => {
//     console.log(res)
// }).catch((err) => {
//     console.log(err)
// })
// update user name column with first_name and last_name
//exporting the module
module.exports = { db: exports.db };
