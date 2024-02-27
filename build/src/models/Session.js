"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
module.exports = (sequelize, DataTypes) => {
    const Session = sequelize.define("session", {
        sid: {
            type: DataTypes.UUID,
            defaultValue: (0, uuid_1.v4)(),
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        partner_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        full_input: {
            type: DataTypes.STRING,
        },
        masked_input: {
            type: DataTypes.STRING,
        },
        sessionid: {
            type: DataTypes.STRING,
        },
        networkcode: {
            type: DataTypes.STRING,
        },
        durationinmillis: {
            type: DataTypes.STRING,
        },
        errormessage: {
            type: DataTypes.STRING,
        },
        servicecode: {
            type: DataTypes.STRING,
        },
        lastappresponse: {
            type: DataTypes.STRING,
        },
        hopscount: {
            type: DataTypes.STRING,
        },
        phonenumber: {
            type: DataTypes.STRING,
        },
        cost: {
            type: DataTypes.STRING,
        },
        date: {
            type: DataTypes.DATE,
        },
        input: {
            type: DataTypes.STRING,
        },
        status: {
            type: DataTypes.STRING,
        },
    }, { timestamps: true });
    Session.belongsTo(sequelize.models.user, {
        foreignKey: "user_id",
    });
    sequelize.models.user.hasMany(Session, {
        foreignKey: "user_id",
    });
    return Session;
};
