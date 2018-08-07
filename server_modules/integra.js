var colors = require('colors'),
	devices = require('../devices/devices.js'),
	device = devices.devices,
	net = require('net'),
	nodeMain = require('../server'),
	reconnect = require('./reconnect/net-socket-reconnect'),
	cmd = require('./commands/barcoDC');

var myStates = {
	refLevel: 80,
	input: undefined,
	power: null
};



var thisID = 'integra';
devices.createDevice(thisID, 'Integra', '192.168.66.15', 60128);
//devices.createDevice(thisID, 'Integra D6', 'localhost', 60128);
var thisDevice = device[thisID];
thisDevice.id = '#integra';


function logMe(a) {
	console.log('integra: '.yellow + a)
}


module.exports = (io) => {


	const integra = reconnect({
		host: thisDevice.host,
		port: thisDevice.port,
		reconnectOnError: true,
		reconnectOnTimeout: true,
		reconnectOnCreate: true
	});


	integra.on('connect', function () {
		thisDevice.online = true;
		thisDevice.event = 'connected';
		logMe('connected.');
		cmd.getVolume(integra);
		setTimeout(function () {
			cmd.getSoundInput(integra);
		}, 500);
		setTimeout(function () {
			cmd.getListenMode(integra);
		}, 1000);
		setTimeout(function () {
			cmd.integraPWR(integra);
		}, 1500);

		io.sockets.emit('devices', thisDevice);

	});

	integra.on('error', function () {
		thisDevice.online = false;
		thisDevice.event = 'error';
		io.sockets.emit('devices', thisDevice);
		logMe('connection error.');
	});

	integra.on('close', function () {
		thisDevice.online = false;
		thisDevice.event = 'close';
		io.sockets.emit('devices', thisDevice);
		logMe('connection closed');
	});

	integra.on('data', function (data) {
		//    var i = data.length(); 
		var recData = data.toString('ascii');
		var fb = data.slice(-6, -1);
		var incmd = fb.toString('ascii', 0, 3);

		switch (incmd) {
			case 'MVL':
				var vol = fb.toString('ascii', 3);
				var volNum = parseInt(vol, 16);
				myStates.volume = volNum;
				logMe('returned volume: ' + myStates.volume)
				io.sockets.emit('send volume', volNum);
				break;
			case 'SLI':
				var sli = fb.toString('ascii', 3);

				switch (sli) {
					case '10':
						myStates.input = 'HDMI';
						break;
					case '23':
						myStates.input = 'Analog';
						setTimeout(function () {
							logMe('make it 2 channel');
							cmd.setStereo(integra);
						}, 2000)
						break;
					case '30':
						myStates.input = 'Multi-CH';
						break;
					default:
						break;
				}
				logMe('input Mode: ' + myStates.input);
				io.sockets.emit('integraInput', myStates.input);
				break;
			case 'LMD':
				console.log(data.toString());
				var lmd = fb.toString('ascii', 3);
				switch (lmd) {
					case '00':
						myStates.listenMode = 'Stereo Analog';
						break;
					case '01':
						myStates.listenMode = 'DIRECT';
						break;
					case '0C':
						myStates.listenMode = 'All Channel Stereo';
						break;
					case '40':
						myStates.listenMode = 'Surround 5.1';
						break;
					default:
						break;
				}
				logMe(`ListenMode: ${myStates.listenMode}`);
				io.sockets.emit('listenMode', myStates.listenMode);
				break;
			case 'PWR':
				var pwrStat = fb.toString('ascii', 3);
				if (pwrStat === '00') {
					myStates.power = false;
				}
				if (pwrStat === '01') {
					myStates.power = true;
				}
				logMe(`Power: ${myStates.power}`);
				io.sockets.emit('integra power', myStates.power);
				break;
			default:
				break;
		}

	})

	nodeMain.pubsub.on('barco power', (msg) => {
		if (myStates.power !== null) {
			switch (msg) {
				case true:
					logMe('got message from projector: power is on.');
					logMe('my power is: ' + myStates.power);
					if (myStates.power !== 1) {
						logMe('power up via pubsub.');
						cmd.integraOn(integra);
					};
					break;
				case false:
					logMe('got message from projector: power is off.');
					logMe('my power is: ' + myStates.power);
					if (myStates.power !== 0) {
						logMe('power down via pubsub.');
						cmd.integraOff(integra);
					};
					break;
				default:
					break;
			}
		}

	})


	io.sockets.on('connection', function (socket) {
		logMe('socket connected.');
		console.log(myStates);


		setTimeout(() => {
			io.emit('send volume', myStates.volume);
			socket.emit('listenMode', myStates.listenMode);
			socket.emit('integraInput', myStates.input);
			socket.emit('setRefVol', myStates.refLevel);
		}, 1000)


		socket.emit('integra power', myStates.power);
		socket.emit('devices', thisDevice);


		socket.on('volume', function (data) {
			cmd.changeLevel(integra, data);
		});


		socket.on('input', function (data) {
			logMe('input socket: ' + data);
			switch (data) {
				case 'hdmi':
					cmd.hdmi(integra);
					break;
				case 'analog':
					cmd.analog(integra);
					break;
				case 'multiCH':
					cmd.multiCH(integra);
					break;
				default:
					break;
			}
		});


		
		socket.on('refVolume', (msg) => {
			myStates.refLevel = msg;
			io.sockets.emit('setRefVol', msg);
			logMe('ref change: new REF level is' + myStates.refLevel);
		});

		
		socket.on('integra setPower', (msg) => {
			logMe(`integra power message: ${msg}`);
			if (msg === true) cmd.integraOn(integra);
			if (msg === false) cmd.integraOff(integra);
		});


	});

};
