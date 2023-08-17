import { Sequelize } from "sequelize";
import { db } from "../models/db";
const Claim = db.claims;
const User = db.users;
const Policy = db.policies;
const Partner = db.partners;
const Product = db.products;
module.exports = (sequelize, DataTypes) => {
    const Policy = sequelize.define("policy", {
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        policy_start_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        policy_status: {
            type: DataTypes.STRING,
            allowNull: false

        },
        beneficiary: {
            type: DataTypes.STRING,
            allowNull: false
        },
        policy_type: {
            type: DataTypes.STRING,
            allowNull: false

        },
        policy_end_date: {
            type: DataTypes.DATE,
            allowNull: false

        },
        policy_deduction_amount: {
            type: DataTypes.NUMBER,
            allowNull: false
        },
        policy_next_deduction_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        policy_deduction_day: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        installment_order: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        installment_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        installment_alert_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        tax_rate_vat: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        tax_rate_ext: {
            type: DataTypes.NUMBER,
            allowNull: true
        } ,
        premium: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        sum_insured: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        excess_premium: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        discount_premium: {
            type: DataTypes.NUMBER,
            allowNull: true
        },
        hospital_details: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        currency_code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        country_code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        policy_documents: {
            type: DataTypes.ARRAY(DataTypes.STRING), // Update to ARRAY of strings
            allowNull: true,
            defaultValue: [] // Set an empty array as the default value
          },
          policy_paid_date: {
            type: DataTypes.DATE,
            allowNull: true

          },
            policy_paid_amount: {
            type: DataTypes.NUMBER,
            allowNull: true
            }
    },

        { timestamps: true },)  

    Policy.belongsTo(User, {
        as: "user",
        foreignKey: "user_id",
    });
    

    
    return Policy
}
 

//A.hasOne(B) and B.belongsTo(A)
