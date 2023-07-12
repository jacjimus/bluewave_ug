import { db } from "../models/db";
const Claim = db.claims;
const User = db.users;
const Policy = db.policies;
const Partner = db.partners;
const Product = db.products;
module.exports = (sequelize: any, DataTypes: any) => {
    const User = sequelize.define("user", {

        id: {
            //BIGINT PRIMARY KEY 
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        middle_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        dob: {
            type: DataTypes.DATE,
            allowNull: true
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        marital_status: {
            type: DataTypes.STRING,
            allowNull: true
        },
        addressline: {
            type: DataTypes.STRING,
            allowNull: true
        },
        nationality: {
            type: DataTypes.STRING,
            allowNull: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        pinzip: {
            type: DataTypes.STRING,
            allowNull: true
        },
        weight:{
            type: DataTypes.NUMBER,
            allowNull: true
        },

        height:{
            type: DataTypes.NUMBER,
            allowNull: true
        },

        email: {
            type: DataTypes.STRING,
            unique: true,
            isEmail: true, //checks for email format
            allowNull: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        national_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        role: {
            type: DataTypes.STRING,
            allowNull: true,
            default: "user"
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            default: true
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            default: false
        },
        pin: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        }


    }, { timestamps: true },)

    // User.hasMany(Policy, {
    //     as: 'policies',
    //     foreignKey: "policy_id",
    // });
    // Policy.belongsTo(User, {
    //     as: 'user',
    //     foreignKey: "user_id",
    // });


       
  
    return User
}

