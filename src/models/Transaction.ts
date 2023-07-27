// {
//     "data": {
//       "transaction": {
//         "id": "ASDJBEJB4KRN5",
//         "status": "SUCCESS"
//       }
//     },
//     "status": {
//       "code": "200",
//       "message": "SUCCESS",
//       "result_code": "ESB000010",
//       "response_code": "DP00800001006",
//       "success": true
//     }
// }
  

module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define( "transaction", {
        transaction_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "pending"
        },
        transaction_reference: {
            type: DataTypes.STRING,
            allowNull: false
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        beneficiary_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        policy_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        partner_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    })
    Transaction.belongsTo(sequelize.models.user, {
        foreignKey: "user_id",
        });
        sequelize.models.user.hasMany(Transaction, {
        foreignKey: "user_id",
        });
    
        Transaction.belongsTo(sequelize.models.beneficiary, {
        foreignKey: "beneficiary_id",
        });
        sequelize.models.beneficiary.hasMany(Transaction, {
        foreignKey: "beneficiary_id",
        });
        
    
    return Transaction
    }
