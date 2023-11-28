import { v4 as uuid } from "uuid";
module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define(
    "session",
    {
      sid: {
        type: DataTypes.UUID,
        defaultValue: uuid(),
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
    },

    { timestamps: true }
  );

  Session.belongsTo(sequelize.models.user, {
    foreignKey: "user_id",
  });

  sequelize.models.user.hasMany(Session, {
    foreignKey: "user_id",
  });

  return Session;
};
