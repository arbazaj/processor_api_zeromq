"use strict";

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../helpers/pg-connection");

class BidResponse extends Model { }

BidResponse.init({
  bid_response_id : {
    type: DataTypes.STRING,
    primaryKey: true
  }
}, {
  sequelize,
  tableName: "bid_responses",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

module.exports = BidResponse;
