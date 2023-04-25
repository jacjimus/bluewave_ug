//session
module.exports = (sequelize, DataTypes) => {
    const Session = sequelize.define("session", {
        sid: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        active_state: {
            type: DataTypes.STRING,
        },
        language: {
            type: DataTypes.STRING,
        },
        full_input: {
            type: DataTypes.STRING,
        },
        masked_input: {
            type: DataTypes.STRING,
        },
        hash: {
            type: DataTypes.STRING,
        },
        phone_number: {
            type: DataTypes.STRING,
        }
    }, { timestamps: true });
    Session.belongsTo(sequelize.models.user, {
        foreignKey: "user_id",
    });
    sequelize.models.user.hasMany(Session, {
        foreignKey: "user_id",
    });
    return Session;
};
