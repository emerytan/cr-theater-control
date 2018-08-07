var colors = require('colors'),
	fs = require('fs'),
	devices = require('../devices/devices.js'),
	device = devices.devices,
	net = require('net'),
	http = require('http'),
	schedule = require('node-schedule'),
	reconnect = require('./reconnect/net-socket-reconnect'),
	cmd = require('./commands/barcoDC'),
	nodeMain = require('../server'),
	request = require("request"),
	storage = require('./storage'),
	link = 'http://192.168.66.20:3480/',
	devHeader = "data_request?id=action&output_format=json&DeviceNum=",
	dimChange = "&serviceId=urn:upnp-org:serviceId:Dimming1&action=SetLoadLevelTarget&newLoadlevelTarget=",
	targetVal = "&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=",
	readVera = 'http://192.168.66.20:3480/data_request?id=lu_sdata',
	reloadVera = 'http://192.168.66.20:3480/data_request?id=reload';


var currentDirectory = __dirname,
	pollInterval,
	lights = {
		currentLevels: [],
		trackID: []
	},
	returnedQuery,
	setLights,
	oldTargetLevel = [],
	b;

var thisID = "vera";
devices.createDevice(thisID, 'Track Lights', '192.168.66.20', 3480);
var thisDevice = device[thisID];
thisDevice.id = '#vera';
thisDevice.online = true;



module.exports = (io) => {
	
	getData(readVera)


	function logMe(a) {
		console.log('vera: '.magenta + a)
	}


	var reloadLights = schedule.scheduleJob('0 0 * * * *', function () {
		io.emit('server message', 'reload tracklights engine')
		logMe('reload lights function')
		console.log(Date())
		request(reloadVera, function (error, response, body) {
			if (error) {
				logMe(error)
			}
		})
	});



	nodeMain.pubsub.on('storage', (msg) => {
		if (msg === true) {
			storage.getPresets("presets")
				.then((items) => {
					returnedQuery = items
					// io.sockets.emit('mongo trackLights', returnedQuery)
				})
				.catch((error) => {
					console.error(error)
				});
		}
	});

	function updateClient() {

		io.emit('server message', 'tracklights sending client update...')

		setTimeout(() => {
			io.emit('mongo trackLights', returnedQuery)
		}, 200)

		setTimeout(() => {
			io.emit('trackLights returned', lights)
		}, 500)

		setTimeout(() => {
			io.emit('tracksPower', lights.power)
		}, 750)

		setTimeout(() => {
			io.emit('lightsModule update', lights.power)
		}, 1000)
	}

	function sendCommand(addr, id, value) {
		request(addr, function (error, response, body) {
			if (error) {
				logMe(error)
			} else {
				logMe(body)
			}
		});
	};

	function trackLoop(level) {
		console.log(lights.trackID);
		setTimeout(function () {

			if (level[b]) {
				setLights = link + devHeader + lights.trackID[b] + dimChange + level[b]
				sendCommand(setLights, lights.trackID[b], level[b].toString());
				b += 1;
			}

			if (b < lights.trackID.length) {
				trackLoop(level)
			} else {
				logMe('trackloop ended')
				setTimeout(() => {
					console.log('trackloop end get data call');
					getData(readVera)
				}, 3000);
			}
		}, 1000);
	};

	function getData(addr) {
		logMe('get data function!')
		console.log(addr)
		 request(addr, function (error, response, body) {
//			fs.readFile('./server_modules/JSON/lu_sdata.json', (error, body) => {
			if (error) {
				logMe(error)
				return;
			} else if (body) {
				for (var index = 0; index < JSON.parse(body).devices.length; index++) {
					lights.currentLevels[index] = JSON.parse(body).devices[index].level
					lights.trackID[index] = JSON.parse(body).devices[index].id
				}
				for (var i = 0; i < lights.currentLevels.length; i++) {
					if (lights.currentLevels[i] !== '0') {
						lights.power = true;
						break;
					} else {
						lights.power = false;
					}
				}
				storage.trackLightLevels(lights, (cb) => {
					if (cb === 'error') {
						logMe(error)
					} else if (cb.ok) {
						updateClient()
					} else {
						console.log('super fuck');
					}
				})
			}
		});
	}

	function userModDelay(sender) {

	}

	function pollLights(x) {
		logMe('pollLights function...')
		let pollInterval = setInterval(function () {
			getData(readVera)
		}, x);
	}

	pollLights(600000);

	io.sockets.on('connection', function (socket) {

		socket.on('lightsInit', () => {
			getData(readVera)
			console.log('socket on lightsinit get data call - delayed 1 second...');
		})

		socket.on('presetChange', (msg) => {
			storage.setPresets(msg, (cb) => {
				if (cb.ok === 1) {
					setTimeout(() => {
						storage.connect()
							.then((state) => {
								if (state === true) {
									nodeMain.pubsub.emit('storage', true)
								}
							})
							.catch((error) => {
								console.log(error);
							});
					}, 1000);
				}
			})
		});



		socket.on('trackLights', function (data) {
			logMe(data.handle + ' : ' + data.value);
			switch (data.handle) {
				case 't1':
					setLights = link + devHeader + "4" + dimChange + data.value.toString();
					sendCommand(setLights, "4", data.value)
					break;
				case 't2':
					setLights = link + devHeader + "6" + dimChange + data.value.toString();
					sendCommand(setLights, "6", data.value);
					break;
				case 't3':
					setLights = link + devHeader + "7" + dimChange + data.value.toString();
					sendCommand(setLights, "7", data.value);
					break;
				case 't4':
					setLights = link + devHeader + "8" + dimChange + data.value.toString();
					sendCommand(setLights, "8", data.value);
					break;
			};
			setTimeout(() => {
				io.emit('server message', 'tracklights slider update')
				getData(readVera)
			}, 2500);
		})


		socket.on('tracksPower', (msg) => {
			b = 0
			logMe('tracksPower socket received')
			console.log(`socket message: ${msg}`)
			console.log(`lights.power: ${lights.power}`)

			// logMe(`tracksPower socket; lights power state is: ${lights.power}`)
			if (lights.power === true) { // lights are on, turn them off.
//				oldTargetLevel = lights.currentLevels
				trackLoop(['0', '0', '0', '0'])
				socket.emit('lightsModule update', false)
			} else if (lights.power === false) { // lights are off, turn them on
				b = 0
				trackLoop(['50', '50', '50', '50'])
				socket.emit('lightsModule update', true)
			} else {
				logMe('trackspower message no good.');
			}
		});

		socket.on('recall preset', (msg) => {
			b = 0
			storage.recallPreset(msg)
				.then((items) => {
					console.log(`levels to recall: ${items[0].values}`)
					trackLoop(items[0].values)
				})
				.catch((error) => {
					console.error(error)
				});
		})

	});
}
