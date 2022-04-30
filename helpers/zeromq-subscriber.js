var zmq = require('zeromq')
  , sock = zmq.socket('sub');

const DailyReportPublisherLevel = require("../models/pg/daily-report-publisher-level");
const { sequelize } = require("./pg-connection");
const Users = require("../models/pg/publisher-user");
const BidRequest = require("../models/pg/bid-request");
const BidResponse = require("../models/pg/bid-response");

// var config = {
//   username: 'arbaaz',
//   password: 'Arbaaz@321',
//   host: "172.105.47.41",
//   port: 22,
//   dstHost: '172.105.47.41',
//   dstPort: process.env.TCP_PORT,
//   localHost: '127.0.0.1',
//   localPort: process.env.TCP_PORT
// };

var config = {
  username: 'arbaz',
  password: 'Arbaz098',
  host: process.env.TCP_IP,
  port: 22,
  dstHost: process.env.TCP_IP,
  dstPort: process.env.TCP_PORT,
  localHost: '127.0.0.1',
  localPort: process.env.TCP_PORT
};

var tunnel = require('tunnel-ssh');
tunnel(config, function (error, server) {
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
        }
      } catch (e) {
        console.log(e);
      }
    }
  });
});


const handleDailyReportPublisherLevel = async (data) => {
  const where = { publisher_id: data.publisher_id };
  let exists = await DailyReportPublisherLevel.findOne({
    where,
    attributes: ['publisher_id']
  });
  console.log(JSON.stringify(exists, null, 2));
  if (!exists) {
    exists = await DailyReportPublisherLevel.create({ publisher_id: data.publisher_id });
  }
  const incrementFields = [];
  const config = {
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
  Object.keys(data).forEach(key => {
    if (typeof config[key] === "function") {
      const field = config[key](data[key]);
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
      promises.push(DailyReportPublisherLevel.increment("total_revenue_impressions",
        {
          by: (+data.price / 1000), where, transaction: t
        }
      ));
    }
    if (data.user_id) {
      promises.push(Users.upsert({
        user_id: data.user_id,
        publisher_id: data.publisher_id
      }, {
        transaction: t
      }));
      const existingUser = await Users.findOne({
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
      promises.push(DailyReportPublisherLevel.increment(incrementFields,
        {
          by: 1, where, transaction: t
        }
      ));
    }
    promises.push(DailyReportPublisherLevel.update(updateData, {
      where, transaction: t
    }));
    await Promise.all(promises);
  });
}
