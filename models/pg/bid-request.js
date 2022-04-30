"use strict";

const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../helpers/pg-connection");

class BidRequest extends Model { }

BidRequest.init({
  bid_request_id : {
    type: DataTypes.STRING,
    primaryKey: true
  }
}, {
  sequelize,
  tableName: "bid_requests",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

module.exports = BidRequest;
