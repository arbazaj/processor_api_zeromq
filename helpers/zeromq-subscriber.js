const zmq = require('zeromq')
  , sock = zmq.socket('sub');

const port = "5577";
console.log(process.env.TCP_IP);
sock.connect(`tcp://${process.env.TCP_IP}:${port}`);
sock.subscribe('impressions');
console.log('Subscriber connected to port: ', port);

sock.on('message', function(topic, message) {
  console.log('received a message related to:', topic.toString(), 'containing message:', message.toString());
});