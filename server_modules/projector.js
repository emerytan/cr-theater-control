const colors = require('colors'),
	devices = require('../devices/devices.js'),
	device = devices.devices,
	net = require('net'),
	nodeMain = require('../server'),
	reconnect = require('./reconnect/net-socket-reconnect'),
	CMD = require('./commands/barcoDC'),
	commandSuccess = Buffer.from(CMD.CMD.success),
	ACK = Buffer.from(CMD.CMD.ACK);



var thisID = 'projector';
devices.createDevice(thisID, 'Barco', '192.168.100.2', 43728);

var thisDevice = device[thisID];
thisDevice.id = '#projector';

var barcoStates = {
	macros: [],
	macroID: []
};


module.exports = (io) => {

	const projector = reconnect({
		host: thisDevice.host,
		port: thisDevice.port,
		reconnectOnError: true,
		reconnectOnTimeout: true,
		reconnectOnCreate: true
	});


	projector.on('connect', function () {
		thisDevice.online = true;
		thisDevice.event = 'connected';
		CMD.getStates(projector);
		CMD.getMacros(projector);
		io.sockets.emit('devices', thisDevice);
	});


	projector.on('error', function () {
		console.log('projector: ' + 'connection error.');
		thisDevice.online = false;
		thisDevice.event = 'error';
		io.sockets.emit('devices', thisDevice);
	});


	projector.on('close', function () {
		thisDevice.online = false;
		thisDevice.event = 'close';
		io.sockets.emit('devices', thisDevice);
	});

	projector.on('data', function dataEventHandler(data) {
		var x = data.indexOf(0x06, 0);
		if (data[2] === 0 && x === 3) {
			x = 8
		} else if (x === -1 || x !== 3) {
			x = 2
		};
		var y = x + 1;
		var z = x + 2;


		if (data.equals(commandSuccess) === true) {
			console.log('projector: ' + 'succesful command: ' + barcoStates.lastCommand);
			if (barcoStates.lastCommand == 'power' || barcoStates.lastCommand == 'lamp' || barcoStates.lastCommand == 'shutter') {
				switch (barcoStates.lastCommand) {
					case 'power':
						projector.write(Buffer.from(CMD.CMD.powerRead));
						setTimeout(function () {
							projector.write(Buffer.from(CMD.CMD.shutterRead));
						}, 10000);
						break;
					case 'lamp':
						projector.write(Buffer.from(CMD.CMD.lampRead));
						break;
					case 'shutter':
						projector.write(Buffer.from(CMD.CMD.shutterRead));
						break;
					default:
						console.log('error');
						break;
				};
				io.sockets.emit('blinkOff', {
					setting: barcoStates.lastCommand,
					trigger: 'stop'
				});
			};
		};

		switch (data[x]) {
			case 0x76: /// lamp
				if (data[z] == 0) {
					console.log('projector: ' + 'lamp is off');
					io.sockets.emit('barco', {
						setting: 'lamp',
						state: false
					});
					barcoStates.lamp = false;
				} else if (data[z] == 1) {
					console.log('projector: ' + 'lamp is on');
					io.sockets.emit('barco', {
						setting: 'lamp',
						state: true
					});
					barcoStates.lamp = true;
				} else if (data[z] === 0x10) {
					console.log('projector: ' + 'lamp is sleeping');
					io.sockets.emit('barco', {
						setting: 'lamp',
						state: false
					});
					barcoStates.lamp = false;
					//        io.sockets.emit('exhaust', 'Exhaust is OFF.');
				} else {
					console.log('error in lamp parse.');
				};

				setTimeout(function () {
					nodeMain.pubsub.emit('barco lamp', barcoStates.lamp);
				}, 1000)

				break;


			case 0x67: // power
				if (data[y] == 0) {
					console.log('projector: ' + 'power is off');
					io.sockets.emit('barco', {
						setting: 'power',
						state: false
					});
					barcoStates.power = false;
					nodeMain.pubsub.emit('barco power', barcoStates.power);
				} else if (data[y] == 1) {
					console.log('projector: ' + 'power is on');
					io.sockets.emit('barco', {
						setting: 'power',
						state: true
					});
					barcoStates.power = true;
					nodeMain.pubsub.emit('barco power', barcoStates.power);
				} else {
					console.log('error in power parse.');
				};
				break;
			case 0x21:
				if (data[z] == 0) {
					console.log('projector: ' + 'dowser is closed');
					io.sockets.emit('barco', {
						setting: 'shutter',
						state: false
					});
					barcoStates.shutter = false;
				} else if (data[z] == 1) {
					console.log('projector: ' + 'dowser is open')
					io.sockets.emit('barco', {
						setting: 'shutter',
						state: true
					});
					barcoStates.shutter = true;
				} else if (data[z] == 2) {
					console.log('projector: ' + 'dowser in sleep');
					io.sockets.emit('barco', {
						setting: 'shutter',
						state: false
					});
					barcoStates.shutter = false;
				} else {
					console.log('error in dowser parse.');
				};
				break;
			case 0xe8:
				var i = data.length - 3;
				var j = data[z] - 1;
				var k = data.indexOf(0xe8) + 3;
				var macRet = data.toString('ascii', k, i);
				if (data[y] === 1) {
					barcoStates.lastMacro = data.toString('ascii', k - 1, i);
					var macroMatch = barcoStates.macros.indexOf(barcoStates.lastMacro);
					console.log('barco: last macro is '.green + barcoStates.lastMacro);
					io.sockets.emit('barcoStates', barcoStates);
				} else if (data[y] === 5) {
					console.log('barco: macro '.green + j + ' is '.green + macRet);
					barcoStates.macros[j] = macRet;
					var idNum = j + 1;
					var macroID = '#macro' + idNum;
					barcoStates.macroID[j] = macroID;
					io.sockets.emit('barco Macros', {
						macroID: macroID,
						macroName: macRet
					});
				};
				break;
			default:
				if (data.equals(ACK) === true && barcoStates.lastCommand === 'macro') {
					console.log('projector: ' + 'ACK -- run check macro');
					barcoStates.lastCommand = 'get macro';
					setTimeout(function () {
						projector.write(Buffer.from(CMD.CMD.lastMac));
					}, 4000);
				}
				break;
		}
	});

	nodeMain.pubsub.on('jnior exhaust', () => {
		nodeMain.pubsub.emit('barco lamp', barcoStates.lamp);
	});

	io.sockets.on('connection', function (socket) {
		console.log('projector: ' + 'got a new connection');
		// console.log(thisDevice);
		io.emit('devices', thisDevice);
		socket.emit('barco', {
			setting: 'power',
			state: barcoStates.power
		});

		socket.on('read barco main', function () {
			io.emit('barcoStates', barcoStates);
		});

		socket.on('read barco macros', function () {
			console.log('projector: ' + 'got read barco macros socket');
			io.emit('barcoMacros', barcoStates);
		});

		socket.on('barco command', function (val) {
			console.log('socket: barco command --- ' + ' }---> ' + val.setting + ' <---{ ' + val.state);

			if (val.setting == 'power' || val.setting == 'lamp' || val.setting == 'shutter') {
				switch (val.setting) {
					case 'power':
						barcoStates.lastCommand = 'power';
						if (val.state === true) { // it's on, turn it off
							console.log(`socket: }---> ${val.setting} <---{  switched to ${val.state}`);
							projector.write(Buffer.from(CMD.CMD.powerOff));
						} else if (val.state === false) { // it's off, turn it on
							console.log(`socket: }---> ${val.setting}<---{ switched to ${val.state}`);
							projector.write(Buffer.from(CMD.CMD.powerOn));
							io.sockets.emit('blinkOn', { // start blinker timeout loop
								setting: 'power',
								trigger: 'run'
							});
						};
						break;
					case 'lamp':
						barcoStates.lastCommand = 'lamp';
						if (val.state === true) {
							console.log(`socket: }---> ${val.setting} <---{ switched to ${val.state}`);
							projector.write(Buffer.from(CMD.CMD.lampOff));
						} else if (val.state === false) {
							console.log(`socket: }---> ${val.setting} <---{ switched to ${val.state}`);
							projector.write(Buffer.from(CMD.CMD.lampOn));
							io.sockets.emit('blinkOn', {
								setting: 'lamp',
								trigger: 'run'
							});
						};
						break;
					case 'shutter':
						barcoStates.lastCommand = 'shutter';
						if (val.state === true) {
							console.log(`socket: }---> ${val.setting} <---{ switched to ${val.state}`);
							projector.write(Buffer.from(CMD.CMD.shutterClose));
						} else if (val.state === false) {
							console.log(`socket: }---> ${val.setting} <---{ switched to ${val.state}`);
							projector.write(Buffer.from(CMD.CMD.shutterOpen));
						};
						break;
					default:
						console.log('power lamp shutter');
						break;
				};
			};

			if (val.setting == 'lens') {
				barcoStates.lastCommand = val.state;
				switch (val.state) {
					case 'zoomIn':
						projector.write(Buffer.from(CMD.CMD.zoomIn));
						break;
					case 'zoomOut':
						projector.write(Buffer.from(CMD.CMD.zoomOut));
						break;
					case 'focusIn':
						projector.write(Buffer.from(CMD.CMD.focusIn));
						break;
					case 'focusOut':
						projector.write(Buffer.from(CMD.CMD.focusOut));
						break;
					case 'shiftUp':
						projector.write(Buffer.from(CMD.CMD.shiftUp));
						break;
					case 'shiftDown':
						projector.write(Buffer.from(CMD.CMD.shiftDown));
						break;
					case 'shiftLeft':
						projector.write(Buffer.from(CMD.CMD.shiftLeft));
						break;
					case 'shiftRight':
						projector.write(Buffer.from(CMD.CMD.shiftRight));
						break;
					default:
						break;
				};
			};
		});

		socket.on('barco macro', function (index) {
//			console.log(barcoStates.macros);
			var setMacro = barcoStates.macros[index];
			barcoStates.lastCommand = 'macro';
			(`setMacro ${setMacro}`);
			CMD.writeMacro(projector, setMacro);
			console.log('projector: writing macro ' + setMacro);
		});

	});
}
