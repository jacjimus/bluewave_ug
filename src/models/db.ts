const { Sequelize, DataTypes, Op, QueryTypes } = require('sequelize')
require('dotenv').config()
const moment = require('moment')

const DB_URL = process.env.ENV === 'PROD' ? process.env.DB_URL : process.env.DB_URL_DEV
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres", dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
})

sequelize.authenticate().then(() => {
  console.log(`Database connected to Bluewave! time: ${moment().toDate()}`)

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

db.family_covers = require('./FamilyCover')(sequelize, DataTypes)
db.packages = require('./Packages')(sequelize, DataTypes)
db.cover_types = require('./CoverType')(sequelize, DataTypes)
db.payment_options = require('./PaymentOption')(sequelize, DataTypes)
db.package_payment_options = require('./PackagePaymentOptions')(sequelize, DataTypes)




db.users.hasMany(db.policies, { foreignKey: 'user_id' });
db.policies.belongsTo(db.users, { foreignKey: 'user_id' });
db.payments.belongsTo(db.users, { foreignKey: 'user_id' });
db.payments.belongsTo(db.policies, { foreignKey: 'policy_id' });
db.policies.hasMany(db.payments, { foreignKey: 'policy_id' });
db.policies.hasMany(db.claims, { foreignKey: 'policy_id' });
db.policies.hasMany(db.beneficiaries, { foreignKey: 'user_id' });
db.beneficiaries.belongsTo(db.policies, { foreignKey: 'user_id' });
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


db.family_covers.hasMany(db.packages, { foreignKey: 'family_cover_id' });
db.packages.belongsTo(db.family_covers, { foreignKey: 'family_cover_id' });
db.packages.belongsToMany(db.payment_options, { through: 'PackagePaymentOptions', foreignKey: 'package_id' });
db.payment_options.belongsToMany(db.packages, { through: 'PackagePaymentOptions', foreignKey: 'payment_option_id' });






module.exports = { db }

