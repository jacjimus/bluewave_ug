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
//syncing the model
sequelize.sync().then(() => {
    console.log(`Database & tables created!`);
}).catch((err) => {
    console.log(err);
});
//exporting the module
module.exports = { db: exports.db };
