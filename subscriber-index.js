"use strict";

(() => {
    require("dotenv").config({ path: `./.${process.env.NODE_ENV || "local"}.env` });
})();

const { sequelize } = require("./helpers/pg-connection");
const DailyReportPublisherLevel = require("./models/pg/daily-report-publisher-level");
const DailyReportPublisherAppLevel = require("./models/pg/daily-report-publisher-app-level");
const PublisherUsers = require("./models/pg/publisher-user");
const PublisherAppUsers = require("./models/pg/publisher-app-user");
const BidRequest = require("./models/pg/bid-request");
const BidResponse = require("./models/pg/bid-response");

sequelize.sync({ force: false }).then(async () => {
    await DailyReportPublisherLevel.sync({ force: false });
    await DailyReportPublisherAppLevel.sync();
    await PublisherUsers.sync({ force: false });
    await PublisherAppUsers.sync({ force: false });
    await BidRequest.sync();
    await BidResponse.sync();
    require("./helpers/zeromq-subscriber");
}).catch(e => {
    console.log(e);
});
