var zmq = require('zeromq')
    , sock = zmq.socket('sub');


var config = {
    username: 'arbaaz',
    password: 'Arbaaz@321',
    host: "172.105.47.41",
    port: 22,
    dstHost: '172.105.47.41',
    dstPort: 7890,
    localHost: '127.0.0.1',
    localPort: 7890
};

var tunnel = require('tunnel-ssh');
tunnel(config, function (error, server) {
    console.log(error);
    console.log("*******************");
    console.log(server);
    server.on('error', function (err) {
        console.log(err);
    });
    const ip = "127.0.0.1";
    const port = 7890;
    const address = `tcp://${ip}:${port}`;

    sock.connect(address);

    sock.subscribe('impressions');

    console.log('Subscriber connected to', address);

    sock.on('message', function (topic, message) {
        console.log('received a message related to:', topic.toString(), 'containing message:', message.toString());
    });
});