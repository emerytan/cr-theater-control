const colors = require('colors'),
	devices = require('../devices/devices.js'),
	device = devices.devices,
	net = require('net'),
	nodeMain = require('../server'),
	serialport = require("serialport"),
	five = require('johnny-five');


var relays, led, RGBled, lightMeter, tempMeter,
	myStates = {},
	readRGB = {},
	storeRGB = {};


var thisID = "arduino";
devices.createDevice(thisID, 'LED Controller', 'firmata', null);
var thisDevice = device[thisID];
thisDevice.id = "#arduino";
thisDevice.online = false;

function logMe(a) {
	console.log('mega: '.green + a)
}

serialport.list(function (err, ports) {
//	console.log(ports);
});

//function zeroLights() {
//	if (readRGB.red === 255) readRGB.red = 0;
//	if (readRGB.green === 255) readRGB.green = 0;
//	if (readRGB.blue === 255) readRGB.blue = 0;
//	return readRGB;
//};


module.exports = (io) => {

	const board = new five.Board({
		repl: false,
		debug: true
	});



	board.on('ready', function () {

		thisDevice.online = true;
		thisDevice.event = 'connected';
		io.sockets.emit('devices', thisDevice);

		relays = new five.Relays([31, 33, 35, 37]);
		relays.close();
		
		bottomRelays = new five.Relays([39, 41, 43, 45]);
		
		sideRelays = new five.Relays([47, 49, 51, 53]);
		
		
		RGBled = new five.Led.RGB({
			pins: {
				red: 6,
				green: 5,
				blue: 3
			}
		});

		RGBled.color({
			red: 0x05,
			green: 0x05,
			blue: 0x05
		});

		myStates.power = true;
		io.sockets.emit('rgbPower', myStates.power);
		readRGB = RGBled.color();
		storeRGB = readRGB;
		io.sockets.emit('states', storeRGB);



		setTimeout(function () {
			RGBled.off();
			myStates.power = false;
			io.sockets.emit('rgbPower', false);
			io.sockets.emit('states', storeRGB);
		}, 15000);



		var x = 0,
			y = 128,
			z = 0,
			i = 128,
			j = 50,
			k = j * i + 6000;


		tempMeter = new five.Sensor({
			pin: 'A4',
			freq: 10000
		});

		tempMeter.on('change', function (val, err) {
			if (err) {
				throw err;
			} else {
				var tempC = (((5 * val) * 100) / 1024);
				var temp = ((tempC * 1.8) + 30).toFixed(1);
				console.log('Latest Temp: '.green + temp);
				io.sockets.emit('temp meter', temp);
			}
		});


	});

	board.on("error", function (msg) {
		console.log("On Error: ", msg);
		process.exit(1);
	});
	
	

	board.on('message', function (event) {
		console.log('Mega message: '.yellow + `type: ${event.type}  class: ${event.class} message: ${event.message}`);
	});

	board.on('info', function (event) {
		console.log('Mega Info '.yellow + `class: ${event.class} -- message: ${event.message}`);
	});



	board.on('exit', function () {
		RGBled.color('#000000');
		console.log('arduino: '.blue + 'board exit event, setting RGB to 0');
	});



	io.sockets.on('connection', function (socket) {
//		zeroLights();

		console.log('arduino: '.blue + 'got a new connection');
		socket.emit('devices', thisDevice);

		socket.on('masking', function (data) {
//			console.log('arduino socket: '.blue);
//			console.log(data);

			var motor = data.motor;

			switch (motor) {
				case 'openSide':
					if (data.command === 0) {
						relays[1].open();
					} else if (data.command === 1) {
						relays[1].close();
					} else {
						console.log('arduino: '.red + 'error in socket parsing');
					}
					break;
				case 'closeSide':
					if (data.command === 0) {
						relays[0].open();
					} else if (data.command === 1) {
						relays[0].close();
					} else {
						console.log('arduino: '.red + 'error in socket parsing');
					}
					break;
				case 'raise':
					if (data.command === 0) {
						relays[3].open();
					} else if (data.command === 1) {
						relays[3].close();
					} else {
						console.log('arduino: '.red + 'error in socket parsing');
					}
					break;
				case 'lower':
					if (data.command === 0) {
						relays[2].open();
					} else if (data.command === 1) {
						relays[2].close();
					} else {
						console.log('arduino: '.red + 'error in socket parsing');
					}
					break;
				case 'DCP FLat':
					console.log('DCP Flat masking preset')
					
					bottomRelays[1].close();
					sideRelays[1].close()
					setTimeout(function() {
						bottomRelays[1].open();
						sideRelays[1].open()
					}, 200);
					break;
				case 'DCP Scope':
					console.log('DCP Scope masking preset')
					
					bottomRelays[3].close();
					sideRelays[0].close()
					setTimeout(function() {
						bottomRelays[3].open();
						sideRelays[0].open()
					}, 200);
					
					break;
				case 'HD':
					console.log('HD masking preset')
					
					bottomRelays[2].close();
					sideRelays[2].close()
					setTimeout(function() {
						bottomRelays[2].open();
					sideRelays[2].open()
					}, 200);
					
					break;
				default:
					
					break;
			}

		});
		
		
// out1 = bottom 1
// out2 = bottom 2 flat
// out3 = bottom 3 hd
// out4 = sp bottom
// out6 = bottom 4 scope

// out7 = side 1  scope
// out8 = side 2  flat
// out9 = side 3  hd
// out5 = sp side
// out10 = side 4



		socket.on('get states', function () {
			logMe(`get states: power is: ${myStates.power}`);
//			zeroLights();
			socket.emit('rgb states', storeRGB);
			socket.emit('rgbPower', myStates.power);

		});

		socket.on('sliderMove', function (val) {
			// console.log('arduino: '.blue + 'RGB from client: ');

//			console.log(val);
			RGBled.color(val);
			//      socket.emit('rgbColor', true);
		});

		socket.on('rgb slider', function (val) {
//			console.log(val);

			switch (val.handle) {
				case 'red':
					storeRGB.red = val.value;
					break;
				case 'green':
					storeRGB.green = val.value;
					break;
				case 'blue':
					storeRGB.blue = val.value;
					break;
				default:
					logMe('slider no match.');
					break;
			}

			socket.broadcast.emit('rgb slider', {
				value: val.value,
				handle: val.handle
			});
		});

		socket.on('rgbPower', (msg) => {
//			console.log(msg);
			if (msg === false) { // lights are off, turn on
				logMe('turn on Floor lights');
				RGBled.on();
				RGBled.color(storeRGB);
				myStates.power = true;
			} else if (msg === true) { // lights are on, turn off.
				logMe('turn off Floor lights');
				RGBled.off();
				myStates.power = false;
			} else {
				logMe('rgbPower socket no match.');
			};

			nodeMain.pubsub.emit('rgbPower', myStates.power);


		});


	});

};


/*


function onLoop(i) {
            readRGB = RGBled.color();
            console.log(readRGB);
            io.sockets.emit('states', readRGB);
            setTimeout(function () {
                x += 1;
                y -= 1;
                z += 1;
                RGBled.color(x, y, z);
                if (--i) onLoop(i)
            }, j)
        }(i);


        function offLoop(i) {
            readRGB = RGBled.color();
            console.log(readRGB);
            io.sockets.emit('states', readRGB);
            setTimeout(function () {
                x -= 1;
                y = 0;
                z -= 1;
                RGBled.color(x, y, z);
                if (z > 0) offLoop(i);
                if (z == 0) {
                    io.sockets.emit('rgbPower', true);
                }
            }, j)
        }(i);

        setTimeout(function () {
            zeroLights();
            onLoop(i)
        }, 5000);

        setTimeout(function () {
            zeroLights();
            offLoop(i)
        }, k);

*/
