
import { uuid } from 'uuidv4';
import { db } from './db';

module.exports = (sequelize: any, DataTypes: any) => {
    const User = sequelize.define("user", {
        user_id: {
            type: DataTypes.UUID,
            defaultValue: uuid(),
            unique: true,
            primaryKey: true,
        },
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
        },
        membership_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        unique_profile_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
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

        email: {
            type: DataTypes.STRING,
            unique: true,
           // isEmail: true, //checks for email format
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
            defaultValue: "user",
            allowNull: true,
           enum: ["user", "admin", "superadmin", "partner", "manager", "agent"],
           
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
        },
        pin: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        driver_licence: {
            type: DataTypes.STRING,
            allowNull: true
        },
        voter_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        number_of_policies:{
            type: DataTypes.INTEGER,
            defaultValue: 0,

        },
        arr_member_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        total_member_number: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "M"
        },
        cover_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        reset_token: {
            type: DataTypes.STRING,
            allowNull: true
        },
         reset_token_timestamp : {
            type: DataTypes.DATE,
            allowNull: true
        },
       referral_code : {
        type: DataTypes.STRING,
            allowNull: true
       }
       
    }, { timestamps: true },)

    User.associate = (models:any) => {
        User.hasMany(models.Policy, { foreignKey: 'user_id', as: 'policies'});
        User.hasMany(models.Payment, { foreignKey: 'user_id', as: 'payments'});
    };


    return User
}


