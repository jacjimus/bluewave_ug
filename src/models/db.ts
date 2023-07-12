
const {Sequelize, DataTypes} = require('sequelize')



const sequelize = new Sequelize(`postgres://postgres:bluewave-postgres@bluewave-postgres.cemxniymyjt7.us-east-1.rds.amazonaws.com:5432/airtelDB`, {dialect: "postgres"})

//checking if connection is done
    sequelize.authenticate().then(() => {
        console.log(`Database connected to Airtel`)
    }).catch((err) => {
        console.log(err)
    })

   export const db:any = {}
    db.Sequelize = Sequelize
    db.sequelize = sequelize


  //connecting to model
db.users = require('./User') (sequelize, DataTypes)
db.policies = require('./Policy') (sequelize, DataTypes)
db.claims = require('./Claim') (sequelize, DataTypes)
db.payments = require('./Payment') (sequelize, DataTypes)
db.sessions = require('./Session') (sequelize, DataTypes)
db.beneficiaries = require('./Beneficiary') (sequelize, DataTypes)
db.partners = require('./Partner') (sequelize, DataTypes)
db.products = require('./Product') (sequelize, DataTypes)

    //exporting the module
     module.exports =  {db}   

