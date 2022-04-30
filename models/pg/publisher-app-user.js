"use strict";

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../helpers/pg-connection");

class PublisherAppUsers extends Model { }

PublisherAppUsers.init({
  user_id : {
    type: DataTypes.STRING,
    primaryKey: true
  },
  publisher_id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  app_id: {
    type: DataTypes.STRING,
    primaryKey: true
  }
}, {
  sequelize,
  tableName: "publisher_app_users",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

module.exports = PublisherAppUsers;
