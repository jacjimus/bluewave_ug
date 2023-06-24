module.exports = (sequelize, DataTypes) => {
    const Claim = sequelize.define( "claim", {

        claim_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        policy_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        claim_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        claim_status: {
            type: DataTypes.STRING,
            allowNull: true
        },
        claim_amount: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        claim_description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        claim_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        claim_documents: {
            type: DataTypes.ARRAY(DataTypes.STRING), // Update to ARRAY of strings
            allowNull: true,
            defaultValue: [] // Set an empty array as the default value
          },
        claim_comments: {
            type: DataTypes.STRING,
            allowNull: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },


    })
    Claim.belongsTo(sequelize.models.policy, {
        foreignKey: "policy_id",
        });
        sequelize.models.policy.hasMany(Claim, {
        foreignKey: "policy_id",
        });
        Claim.belongsTo(sequelize.models.user, {
            foreignKey: "user_id",
            });
            sequelize.models.user.hasMany(Claim, {
            foreignKey: "user_id",
            });
            
    return Claim
}