"use strict";

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../helpers/pg-connection");

class Users extends Model { }

Users.init({
  user_id : {
    type: DataTypes.STRING,
    primaryKey: true
  },
  publisher_id: {
    type: DataTypes.STRING,
    primaryKey: true
  }
}, {
  sequelize,
  tableName: "users",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

module.exports = Users;
