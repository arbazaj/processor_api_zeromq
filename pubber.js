var zmq = require('zeromq')
    , sock = zmq.socket('pub');

const ip = "172.105.41.62";
const port = 5577;
const address = `tcp://${ip}:${port}`;
sock.connect(address);
console.log('Publisher bound to: ', address);

const publish = (topic, data) => sock.send([topic, JSON.stringify(data)]);

module.exports = {
    publish
};
