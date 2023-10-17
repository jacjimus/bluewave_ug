// CREATE TABLE policy_schedule (
//     policy_schedule_id uuid DEFAULT uuid_generate_v4(),
// 	policy_id uuid,
//     policy_start_date date NOT NULL,
//     payment_frequency varchar(10) NOT NULL,
//     next_payment_due_date date NOT NULL,
//     reminder_date date NOT NULL,
//     PRIMARY KEY (policy_schedule_id)
// );

module.exports = (sequelize, DataTypes) => {
    const PolicySchedule = sequelize.define("policy_schedule", {
        policy_schedule_id: {
            type: DataTypes.UUID,
            defaultValue: sequelize.UUIDV4,
            primaryKey: true,
        },
        policy_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        policy_start_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        payment_frequency: {
            type: DataTypes.STRING,
            allowNull: false
        },
        next_payment_due_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        reminder_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        premium: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        outstanding_premium: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    });

    PolicySchedule.associate = (models) => {
        PolicySchedule.belongsTo(models.policies, {
            foreignKey: "policy_id",
            as: "policy",
        });
    };

    return PolicySchedule;
}