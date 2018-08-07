const colors = require('colors'),
	devices = require('../devices/devices.js'),
	device = devices.devices,
	net = require('net'),
	reconnect = require('./reconnect/net-socket-reconnect'),
	cmd = require('./commands/barcoDC'),
	nodeMain = require('../server');

var jniorStates = {
	exhaust: null
};

function logMe(a) {
	console.log('jnior: '.magenta + a)
}

var thisID = "jnior";
devices.createDevice(thisID, 'Cinema Controller', '192.168.66.11', 9200);
var thisDevice = device[thisID];
thisDevice.id = '#jnior';
thisDevice.online = false;

module.exports = (io) => {

	const jnior = reconnect({
		host: thisDevice.host,
		port: thisDevice.port,
		reconnectOnError: true,
		reconnectOnTimeout: true,
		reconnectOnCreate: true
	});

	jnior.on('connect', function () {
		thisDevice.event = 'connected';
		logMe('connected...');
		jnior.write(Buffer.from(cmd.JNIOR.login));
	});

	jnior.on('error', function () {
		thisDevice.online = false;
		thisDevice.event = 'error';
		io.sockets.emit('devices', thisDevice);
		logMe('connection error.');
	});

	jnior.on('close', function () {
		thisDevice.online = false;
		thisDevice.event = 'close';
		io.sockets.emit('devices', thisDevice);
		logMe('connection closed');
	});

	jnior.on('data', function (data) {

		var msgType = data[5]
		logMe(`message type: ${msgType}`);
		switch (msgType) {
			case 125:
				if (data[6] === 0x80) {
					thisDevice.online = true;
					logMe('login successful.  ');
					nodeMain.pubsub.emit('jnior exhaust');
				} else if (data[6] === 0xff) {
					thisDevice.online = false;
					logMe('login fail.');
				}
				io.sockets.emit('devices', thisDevice);
				break;
			case 1:
				var parseExhaust = data.slice(-10, -9);
				jniorStates.exhaust = parseExhaust[0];
				logMe('received monitor packet, exhaust state is: ' + jniorStates.exhaust);
				io.sockets.emit('exhaust', jniorStates.exhaust);
				break;
			case 2:
				jniorStates.exhaust = data[10];
				logMe('received external mon packet, exhaust state is: ' + jniorStates.exhaust);
				io.sockets.emit('exhaust', jniorStates.exhaust);
				break;
			default:
				logMe(`data switch - no match`);
				console.log(data.toString());
				console.log(data);
				break;
		}
	});

	nodeMain.pubsub.on('barco lamp', function (data) {
		if (thisDevice.online === true) {

			logMe(`got lamp pubsub: ${data} -- my exhaust is: ${jniorStates.exhaust}`);

			switch (data) {
				case true:
					if (jniorStates.exhaust !== 1 || jniorStates.exhaust === null) {
						logMe('turn on exhaust via pubsub.');
						var turnExhOn = Buffer.from(cmd.JNIOR.exhaustON);
						jnior.write(turnExhOn);
					};
					break;
				case false:
					if (jniorStates.exhaust !== 0 || jniorStates.exhaust === null) {
						logMe('turn off exhaust via pubsub.');
						var turnExhOff = Buffer.from(cmd.JNIOR.exhaustOFF);
						jnior.write(turnExhOff);
					};
					break;
				default:
					break;
			}

		}
	});

	io.sockets.on('connection', function (socket) {

		console.log('JNIOR: '.magenta + 'got a new connection');

		socket.emit('devices', thisDevice);
		socket.emit('exhaust', jniorStates.exhaust);

		socket.on('jnior command', function (msg) {
			if (msg.setting == 'dcpPlayer') {
				logMe('dcpPlayer: ' + msg.command);

				switch (msg.command) {
					case 'dcpPlay':
						jnior.write(Buffer.from(cmd.JNIOR.dcpPlay));
						break;
					case 'dcpPause':
						jnior.write(Buffer.from(cmd.JNIOR.dcpPause));
						break;
					case 'dcpStop':
						jnior.write(Buffer.from(cmd.JNIOR.dcpStop));
						break;
					default:
						logMe('no dcpPlayer matches....');
						break;
				}
			} else if (msg.setting == 'Masking') {
				logMe('Masking: ' + msg.command);

//				switch (msg.command) {
//					case 'DCP Flat':
//						setTimeout(function () {
//							jnior.write(Buffer.from(cmd.JNIOR.pulseOut2));
//						}, 500);
//						setTimeout(function () {
//							jnior.write(Buffer.from(cmd.JNIOR.pulseOut8));
//						}, 1500);
//						break;
//					case 'DCP Scope':
//						setTimeout(function () {
//							jnior.write(Buffer.from(cmd.JNIOR.pulseOut6));
//						}, 500);
//						setTimeout(function () {
//							jnior.write(Buffer.from(cmd.JNIOR.pulseOut7));
//						}, 1500);
//						break;
//					case 'MacMini':
//						setTimeout(function () {
//							jnior.write(Buffer.from(cmd.JNIOR.pulseOut3));
//						}, 500);
//						setTimeout(function () {
//							jnior.write(Buffer.from(cmd.JNIOR.pulseOut9));
//						}, 1500);
//						break;
//					default:
//						break;
//				}

			} else {
				logMe('no match -- command');
			}
		});
	});
};
