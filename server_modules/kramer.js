const colors = require('colors'),
    devices = require('../devices/devices.js'),
    device = devices.devices,
    net = require('net'),
    nodeMain = require('../server'),
    reconnect = require('./reconnect/net-socket-reconnect'),
    cmd = require('./commands/barcoDC');


var thisID = 'kramer';
devices.createDevice(thisID, 'HDMI Router', '192.168.66.29', 5000);
var thisDevice = device[thisID];
thisDevice.id = '#kramer';

var pos1,
    pos2,
    str,
    input,
    output,
    value,
    myStates = {

    };

function logMe(a) {
    console.log('kramer: '.green + a)
}

module.exports = (io) => {

    const kramer = reconnect({
        host: thisDevice.host,
        port: thisDevice.port,
        reconnectOnError: true,
        reconnectOnTimeout: true,
        reconnectOnCreate: true
    });

    kramer.on('connect', () => {
        thisDevice.online = true;
        thisDevice.event = 'connect';
        logMe('connected');
        kramer.write(Buffer.from(cmd.kramer.getInput1));
        setTimeout(function () {
            kramer.write(Buffer.from(cmd.kramer.getInput2));
        }, 2000);
        io.sockets.emit('devices', thisDevice);
    });

    kramer.on('error', function () {
        thisDevice.online = false;
        thisDevice.event = 'error';
        io.sockets.emit('devices', thisDevice);
        logMe('connection error.');
    });

    kramer.on('close', function () {
        thisDevice.online = false;
        thisDevice.event = 'close';
        io.sockets.emit('devices', thisDevice);
        logMe('connection closed');
    });

    kramer.on('data', (data) => {
		console.log(data);
		console.log(data.toString());
		var parseData = data.toString('ascii', 4);
        var re = parseData.includes('VID');

        if (re === true) {
            pos1 = data.indexOf(0x20) + 1;
            str = data.toString('ascii', pos1);
            input = str.slice(0, 1);
            output = str.slice(2);

            switch (input) {
            case '1':
                if (output == 1) {
                    myStates.barcoIN = 'PS3';
                };
                if (output == 2) {
                    myStates.avRtr = 'PS3';
                };
                break;
            case '2':
                if (output == 1) myStates.barcoIN = 'MacMini';
                if (output == 2) myStates.avRtr = 'MacMini';
                break;
            case '3':
                if (output == 1) myStates.barcoIN = 'Apple TV';
                if (output == 2) myStates.avRtr = 'Apple TV';
                break;
            default:
                break;
            }
        }


        io.sockets.emit('kramer', {
            barcoIN: myStates.barcoIN,
            avRTR: myStates.avRtr
        });

    });

    io.sockets.on('connection', (socket) => {
        logMe(`got a connection.... barco in: ${myStates.barcoIN} --- avRTR in: ${myStates.avRtr}`);

        socket.emit('devices', thisDevice);

        socket.emit('kramer', {
            barcoIN: myStates.barcoIN,
            avRTR: myStates.avRtr
        });

        socket.on('kramer command', (msg) => {
            logMe(`source: ${msg.source} -- dest: ${msg.dest}`);
            var buildCommand = cmd.kramer.switchOutput(msg.source, msg.dest);
            kramer.write(Buffer.from(buildCommand));
        });
		
//		socket.on('kramer setPower', (msg) => {
//			if ( msg === true ) {
//				logMe('request to power up kramer');
//				kramer.write(Buffer.from(cmd.kramer.powerSaveOn));
//			}
//			
//			if ( msg === false ) {
//				logMe('request to power down kramer');
//				kramer.write(Buffer.from(cmd.kramer.powerSaveOff));
//			}
//			
//			
//		});

    });


}
