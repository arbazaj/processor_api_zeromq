var zmq = require('zeromq')
, sock = zmq.socket('pub');

console.log(`tcp://${process.env.TCP_IP}:${process.env.TCP_PORT}`);

sock.bindSync(`tcp://${process.env.TCP_IP}:${process.env.TCP_PORT}`);

console.log('Publisher bound to port: ', process.env.TCP_PORT);

const publish = (topic, data) => sock.send([topic, JSON.stringify(data)]);

module.exports = {
  publish
};