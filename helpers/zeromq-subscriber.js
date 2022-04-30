var zmq = require('zeromq')
  , sock = zmq.socket('sub');

const DailyReportPublisherLevel = require("../models/pg/daily-report-publisher-level");
const DailyReportPublisherAppLevel = require("../models/pg/daily-report-publisher-app-level");
const { sequelize } = require("./pg-connection");
const PublisherUsers = require("../models/pg/publisher-user");
const PublisherAppUsers = require("../models/pg/publisher-app-user");
const BidRequest = require("../models/pg/bid-request");
const BidResponse = require("../models/pg/bid-response");

const config = {
  username: 'arbaz',
  password: 'Arbaz098',
  host: process.env.TCP_IP,
  port: 22,
  dstHost: process.env.TCP_IP,
  dstPort: process.env.TCP_PORT,
  localHost: '127.0.0.1',
  localPort: process.env.TCP_PORT
};

const fieldMappingConfig = {
  bid_request_id: () => "total_bid_request",
  bid_response_id: () => "total_bid_response",
  event_name: (event) => {
    const eventFieldMapping = {
      start: "total_start_impression",
      "first quartile": "total_first_quartile_impression",
      "second quartile": "total_second_quartile_impression",
      "third quartile": "total_third_quartile_impression",
      complete: "total_complete_impression",
      mute: "total_mute",
      click: "total_click",
      pause: "total_pause",
      play: "total_play"
    };
    return eventFieldMapping[event.toLowerCase()];
  }
};

var tunnel = require('tunnel-ssh');
tunnel(config, function (error, server) {
  if (error) {
    console.log(error);
  }
  server.on('error', function (err) {
    console.log(err);
    console.log("========");
  });
  const ip = "127.0.0.1";
  const port = process.env.TCP_PORT;
  const address = `tcp://${ip}:${port}`;
  sock.connect(address);
  console.log("connected---------");
  sock.subscribe('impressions');
  console.log('Subscriber connected to', address);
  sock.on('message', async function (topic, message) {
    console.log('received a message related to:', topic.toString(), 'containing message:', message.toString());
    if (topic.toString() === "impressions") {
      try {
        const data = JSON.parse(message.toString());
        if (data.publisher_id) {
          await handleDailyReportPublisherLevel(data);
          if (data.app_id) {
            await handleDailyReportPublisherAppLevel(data);
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
  });
});


const handleDailyReportPublisherLevel = async (data) => {
  const where = { publisher_id: data.publisher_id };
  let existingReport = await DailyReportPublisherLevel.findOne({
    where,
    attributes: ['publisher_id']
  });
  if (!existingReport) {
    existingReport = await DailyReportPublisherLevel.create({ publisher_id: data.publisher_id });
  }
  const incrementFields = [];
  Object.keys(data).forEach(key => {
    if (typeof fieldMappingConfig[key] === "function") {
      const field = fieldMappingConfig[key](data[key]);
      if (field) {
        incrementFields.push(field);
      }
    }
  });
  await sequelize.transaction(async t => {
    const updateData = {
      timestamp: data.timestamp
    }
    if (data.currency) {
      updateData.currency = data.currency;
    }
    const promises = [];
    if (data.price) {
      promises.push(existingReport.increment("total_revenue_impressions",
        {
          by: (+data.price / 1000), where, transaction: t
        }
      ));
    }
    if (data.user_id) {
      promises.push(PublisherUsers.upsert({
        user_id: data.user_id,
        publisher_id: data.publisher_id
      }, {
        transaction: t
      }));
      const existingUser = await PublisherUsers.findOne({
        where: {
          user_id: data.user_id,
          publisher_id: data.publisher_id
        }
      }, {
        attributes: ["user_id"]
      });
      if (!existingUser) {
        incrementFields.push("unique_users_count");
      }
      // if (typeof exists.unique_users_list === "string") {
      //     exists.unique_users_list = JSON.parse(exists.unique_users_list);
      // }
      // updateData.unique_users_list = Array.from(new Set([...exists.unique_users_list, data.user_id]));
    }
    // if (exists.unique_users_list.length < updateData.unique_users_list.length) {
    //     incrementFields.push("unique_users_count");
    // }
    if (data.bid_request_id) {
      promises.push(BidRequest.upsert({
        bid_request_id: data.bid_request_id
      }, {
        transaction: t
      }));
    }
    if (data.bid_response_id) {
      promises.push(BidResponse.upsert({
        bid_response_id: data.bid_response_id
      }, {
        transaction: t
      }));
    }
    if (incrementFields.length) {
      promises.push(existingReport.increment(incrementFields,
        {
          by: 1, where, transaction: t
        }
      ));
    }
    promises.push(existingReport.update(updateData, {
      where, transaction: t
    }));
    await Promise.all(promises);
  });
}

const handleDailyReportPublisherAppLevel = async (data) => {
  const where = {
    publisher_id: data.publisher_id,
    app_id: data.app_id
  };
  let existingReport = await DailyReportPublisherAppLevel.findOne({
    where,
    attributes: ['publisher_id', 'app_id']
  });
  if (!existingReport) {
    existingReport = await DailyReportPublisherAppLevel.create({
      publisher_id: data.publisher_id,
      app_id: data.app_id
    });
  }
  const incrementFields = [];
  Object.keys(data).forEach(key => {
    if (typeof fieldMappingConfig[key] === "function") {
      const field = fieldMappingConfig[key](data[key]);
      if (field) {
        incrementFields.push(field);
      }
    }
  });
  await sequelize.transaction(async t => {
    const updateData = {
      timestamp: data.timestamp
    }
    if (data.currency) {
      updateData.currency = data.currency;
    }
    const promises = [];
    if (data.price) {
      promises.push(existingReport.increment("total_revenue_impressions",
        {
          by: (+data.price / 1000), where, transaction: t, returning: false
        }
      ));
    }
    if (data.user_id) {
      promises.push(PublisherAppUsers.upsert({
        user_id: data.user_id,
        publisher_id: data.publisher_id,
        app_id: data.app_id
      }, {
        returning: false,
        transaction: t
      }));
      const existingUser = await PublisherAppUsers.findOne({
        where: {
          user_id: data.user_id,
          publisher_id: data.publisher_id,
          app_id: data.app_id
        }
      }, {
        attributes: ["user_id"]
      });
      if (!existingUser) {
        incrementFields.push("unique_users_count");
      }
    }
    // if (data.bid_request_id) {
    //   promises.push(BidRequest.upsert({
    //     bid_request_id: data.bid_request_id
    //   }, {
    //     transaction: t
    //   }));
    // }
    // if (data.bid_response_id) {
    //   promises.push(BidResponse.upsert({
    //     bid_response_id: data.bid_response_id
    //   }, {
    //     transaction: t
    //   }));
    // }
    if (incrementFields.length) {
      promises.push(existingReport.increment(incrementFields,
        {
          by: 1, where, transaction: t, returning: false
        }
      ));
    }
    promises.push(existingReport.update(updateData, {
      where, transaction: t, returning: false
    }));
    await Promise.all(promises);
  });
}
