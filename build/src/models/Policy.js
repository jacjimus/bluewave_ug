module.exports = (sequelize, DataTypes) => {
    const Policy = sequelize.define("policy", {
        policy_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        user_id: {
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
            type: DataTypes.INTEGER,
            allowNull: false
        },
        policy_next_deduction_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        policy_deduction_day: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, { timestamps: true });
    Policy.belongsTo(sequelize.models.user, {
        foreignKey: "user_id",
    });
    sequelize.models.user.hasMany(Policy, {
        foreignKey: "user_id",
    });
    return Policy;
};
//  User.hasMany(Policy, { foreignKey: 'user_id' });
//  Policy.belongsTo(User, { foreignKey: 'user_id' });
//  policy_id, user_id, policy_start_date, policy_status, beneficiary, policy_type, policy_end_date, policy_deduction_amount, policy_next_deduction_date, policy_deduction_day
