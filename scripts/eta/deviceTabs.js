define(function (require, exports, module) {
	'use strict'
	const socket = require('socketRouter'),
		$ = require('jquery'),
		jqxButton = require('jqxButton'),
		jqxToggleButton = require('jqxButton'),
		jqxButtonGroup = require('jqxButtonGroup'),
		jqxSwitchButton = require('jqxSwitchButton'),
		jqxcheckbox = require('jqxcheckbox'),
		jqxTouch = require('jqxTouch'),
		slider = require('jquery-ui'),
		VOL = require('integraModule').volume();

	$(document).ready(function () {
		require('lightsModule').init();
		require('lightsModule').trackLights;
		var myStates = {},
			qsButtons = '#dm0, #dm1, #dm2, #dm3, #dm4, #dm5',
			lightsButtons = '#rgbPower, #tracksPower',
			activeContainer,
			blinkTimer,
			blinkTrigger,
			fadeTime = 500,
			handle,
			audioRef = 80,
			qsWidth = $('#c1').innerWidth().toFixed(0) - 40,
			c3Width = $('#c3').innerWidth().toFixed(0) - 20,
			trackLights = {};

		$(qsButtons).css('width', qsWidth);


		$(window).resize(function (event) {
			qsWidth = $('#c1').width().toFixed(0) - 10;
			$(qsButtons).css('width', qsWidth);
			c3Width = $('#c3').innerWidth().toFixed(0) - 20;
			$('#audioMute, #audioRef').css('width', c3Width);
			$('#testPara1').text(`new widths: ${qsWidth} | ${c3Width}`);

		});


		socket.emit('get states');
		socket.emit('read barco main');
		$('#barcoInfo').hide();
		$('#testPara1').text(`c3 width: ${c3Width}`);


		function appendLog(msg, b) {
			console.log(`}---> ${msg} : ${b}`);
		};


		$('#deviceModules').jqxButtonGroup({
			theme: 'dark',
			mode: 'radio'
		});


		$('#power, #lamp, #shutter, #rgbPower, #tracksPower').jqxToggleButton({
			height: 40,
			width: 150,
			theme: 'dark'
		});


		$('#test1, #test2').jqxButton({
			theme: 'dark',
			width: 120,
			height: 40
		});


		$('#test1, #test2').hide(500);

		$('#test1, #test2').on('click', function (event) {
			var handle = $(this).attr('id');
			if (handle === 'test1') {
				socket.emit('integra setPower', true);
			}
			if (handle === 'test2') {
				socket.emit('integra setPower', false);
			};
		});


		$('#audioMute, #audioRef').jqxButton({
			theme: 'dark',
			width: c3Width,
			height: 40
		});


		$('#audioMute, #audioRef').on('click', function (event) {
			var handle = $(this).attr('id');
			var level;
			if (handle == 'audioMute') level = "00";
			if (handle == 'audioRef') level = audioRef;
			socket.emit('volume', level);
		});


		$('#power, #lamp, #shutter').on('click', function (event) {
			var handle = $(this).attr('id');
			var state = $(this).jqxToggleButton('toggled');
			if (state === false) {
				state = true
			} else if (state === true) {
				state = false
				$('#barcoText').fadeIn(2000, function () {
					$('#barcoText').text('This will take a couple mintues.');
				});
			} else {
				state = undefined
			}

			socket.emit('barco command', {
				setting: handle,
				state: state
			});
			blinkTrigger = 'run';
			if (handle == 'power' && state == false) {
				$('#lampSwitch, #shutterSwitch').fadeOut(1000, function () {
					$('#testPara5').text('bye...')
				});
			}
		});


		$('#tracksPower').on('click', function (element, event) {
			var state = $(this).jqxToggleButton('toggled');
			socket.emit('tracksPower', state);
		});


		$('#rgbPower').on('click', function (element, event) {
			var handle = $(this).attr('id');
			var state = $(this).jqxToggleButton('toggled');

			if (state !== undefined) { 
				console.log(`rgb power toggle button state: ${state}`)
			}
			
			if (state === true) {
					socket.emit('rgbPower', false);
			} else if (state === false) {
					socket.emit('rgbPower', true);				
			} else {
				console.error('rgb lights stata undefined...');
			}
		
		});


		///// device group buttons
		$('#deviceModules').on('buttonclick', function deviceTabs() {
			var g = $('#deviceModules').jqxButtonGroup('getSelection');
			switch (g) {
				case 0:
					activeContainer = $('#deviceContainer > div').attr('id');
					$('#deviceContainer').fadeOut(fadeTime, function () {
						$('#' + activeContainer).detach();
						setTimeout(getLights, fadeTime);
					});

					function getLights() {
						$('#deviceContainer').fadeIn(fadeTime, function () {
							require(['lightsModule'], function (lights) {
								lights.init();
							});
						});
					}
					break;
				case 1:
					activeContainer = $('#deviceContainer > div').attr('id');
					$('#deviceContainer').fadeOut(fadeTime, function () {
						$('#' + activeContainer).detach();
						setTimeout(getSound, fadeTime);
					});

					function getSound() {
						$('#deviceContainer').fadeIn(fadeTime, function () {
							require(['integraModule'], function (sound) {
								sound.init();
							});
						});
					}
					break;
				case 2:
					activeContainer = $('#deviceContainer > div').attr('id');
					$('#deviceContainer').fadeOut(fadeTime, function () {
						$('#' + activeContainer).detach();
						setTimeout(getProjector, fadeTime);
					});

					function getProjector() {
						$('#deviceContainer').fadeIn(fadeTime, function () {
							require(['projectorModule'], function (projector) {
								projector.init();
								socket.emit('read barco macros');
							});
						});
					};
					break;
				case 3:
					activeContainer = $('#deviceContainer > div').attr('id');
					$('#deviceContainer').fadeOut(fadeTime, function () {
						$('#' + activeContainer).detach();
						setTimeout(getMasking, fadeTime);
					});

					function getMasking() {
						$('#deviceContainer').fadeIn(fadeTime, function () {
							// noting here
							require(['maskingModule'], function (masking) {
								masking.init();
							});
						});
					};
					break;
				case 4:
					activeContainer = $('#deviceContainer > div').attr('id');
					$('#deviceContainer').fadeOut(fadeTime, function () {
						$('#' + activeContainer).detach();
						setTimeout(getQS, fadeTime);
					});

					function getQS() {
						$('#deviceContainer').fadeIn(fadeTime, function () {
							require(['quickSetups'], function (quickSetups) {
								quickSetups.init();
							});
						});
					};
					break;
				default:
					// noting here				
					break;
			};
		});



		//// sockets

		socket.on('lightsModule update', function (msg) {
			if (msg === true) {
				myStates.power = true;
				$('#tracksPower').jqxToggleButton({ // lights are on, show the sliders
					toggled: true
				});
			}

			if (msg === false) { // lights are off, dim the sliders
				myStates.tracksPower = false;
				$('#tracksPower').jqxToggleButton({
					toggled: false
				});
			}

		});



		socket.on('barco', function (val) {

			console.log(`socket-barco dataParse }---> ${val.setting} : ${val.state} <---{`);
			console.log(val);
			var showItems = '#lampSwitch, #shutterSwitch, #deviceIO, #exhaustStatus, #integraPower, #dm1, #dm2, #dm3, #dm4, #dm5, #volumeContainer, #onlineStatus, #lmpshtSwitches';
			var detachedItems = '#lampSwitch, #shutterSwitch, #deviceIO, #volumeContainer, #onlineStatus, #lmpshtSwitches';

			switch (val.setting) {

				case 'power':
					if (val.state === true) {
						
						$('#power').jqxToggleButton({
							toggled: true
						});

					
						$(showItems).css('visibility', 'visible');

						$(showItems).fadeTo(3000, 1, function () {
							$('#lamp, #shutter').jqxToggleButton({
								disabled: false
							});
							
							$('#barcoInfo').fadeOut();
						});
					
					} else if (val.state === false) {
					
						$('#power').jqxToggleButton({
							toggled: false
						});
						
						$('#lamp, #shutter').jqxToggleButton({
							disabled: true
						});
						
						$(detachedItems).fadeTo(4000, 0, function () {
							$(detachedItems).css('visibility', 'hidden');
							//							$('header').show(1000);
						});
						
						$('#dm1, #dm2, #dm3, #dm4, #dm5, #exhaustStatus, #integraPower').hide(3000, function () {
							$('#messages').text('Cinema devices offline...').css('color', '#20aa20').css('padding-top', '10px');
							$('#messages').show(2000);
						});
					
					} else {
						console.error('socket error - no match to barco power state.')
					};

					break;
				case 'lamp':
					if (val.state !== undefined) {
						$('#lamp').jqxToggleButton({
							toggled: val.state
						});
					}

					break;
				case 'shutter':
					if (val.state !== undefined) {
						$('#shutter').jqxToggleButton({
							toggled: val.state
						});
					};
					break;

				default:
					console.log('you suck at this.');
					break;
			};
		});



		function blinkLoop(handle) {
			blinkTimer = setTimeout(function () {
				$('#testPara1').text('BlinkLoop is running ');
				$(handle).fadeTo(750, .6).fadeTo(750, 0.2);
				switch (blinkTrigger) {
					case 'run':
						blinkLoop(handle);
						break;
					case 'stop':

						break;
					default:
						break;
				}

			}, 1600);
		}


		socket.on('trackLights returned', function (lights) {
			trackLights.track1 = lights.track1;
			trackLights.track2 = lights.track2;
			trackLights.track3 = lights.track3;
			trackLights.track4 = lights.track4;
			trackLights.power = lights.power;
		});


		socket.on('blinkOn', function (skt) {
			console.log(`blinkTrigger: ${blinkTrigger}`)
			var handle = '#' + skt.setting;
			blinkLoop(handle);
			$(handle + ' .jqx-switchbutton-label-on').css('background', 'yellow');
			$(handle).fadeTo(1500, .2, function () {
				$('#messages').fadeIn(500, function () {
					$('#messages').text(`${skt.setting} starting up...`).css('color', 'yellow');
				});
			});
		});

		socket.on('server message', function (msg) {
			console.log(`server message: ${msg}`);
			$('#messages').fadeIn(1000, function () {
				$('#messages').text(`${msg} OK...`).css('color', '#20cc20').fadeOut(4000);
			})

		})

		socket.on('blinkOff', function (skt) {
			clearInterval(blinkTimer);
			blinkTrigger = skt.trigger;
			console.log(blinkTrigger);
			var handle = '#' + skt.setting;
			$(handle + ' .jqx-switchbutton-label-on').css('background', 'green');
			$(handle).fadeTo(1000, 1, function () {
				$('#messages').text(`projector ${skt.setting} OK...`).css('color', '#20cc20').fadeOut(4000);

			});
		});


		socket.on('rgbPower', function (msg) {
			$('#messages').text(msg)
			console.log(`rgb Power socket on: ${msg}`);
			if (msg !== undefined) {
				$('#rgbPower').jqxToggleButton({
					toggled: msg
				});
			}
		});


		socket.on('temp meter', function (temp) {
			$('#tempMeter').text('Rack Temperature: ' + temp).css('color', '#20aa20');
		});


		socket.on('exhaust', function (data) {
			if (data === 0) {
				$('#exhaustStatus').text('Lamp exhaust: Off').css('color', '#7e7e7e');
			};
			if (data === 1) {
				$('#exhaustStatus').text('Lamp exhaust: ON').css('color', '#20cc20');
			};
		});




		socket.on('integra power', function (msg) {
			if (msg === true) $('#integraPower').text('Integra: ON').css('color', '#20cc20');
			if (msg === false) $('#integraPower').text('Integra: OFF').css('color', 'gray');

		});


		socket.on('kramer', function (msg) {
			$('#hdmiSource').text(`HDMI to SDI: ${msg.avRTR}`).css('color', '#20cc20');
		});

		socket.on('barcoStates', function (msg) {
			console.info(msg)
			$('#projectorMacro').text(`Barco preset: ${msg.lastMacro}`).css('color', '#20cc20');

			if (msg.power === false) {

				$('#lamp, #shutter').jqxToggleButton({
					disabled: true
				});
				$('#lampSwitch, #shutterSwitch').fadeOut(3000);
				$('#power').jqxToggleButton({
					toggled: msg.power
				})
			} else if (msg.power === true) {
				$('#power').jqxToggleButton({
					toggled: msg.power
				})
				
			} else {
				console.error('barcoStates socket parse logic error')
			}


			if (msg.lamp !== undefined) {
				$('#lamp').jqxToggleButton({
					toggled: msg.lamp
				})
			}

			if (msg.shutter !== undefined) {
				$('#shutter').jqxToggleButton({
					toggled: msg.shutter
				})
			}


		});

		socket.on('setRefVol', function (val) {
			audioRef = val;
			$('#audioRef').attr('value', 'REF: ' + val);
		});


		socket.on('send volume', function (val) {
			$('#volReturned').text(`Volume: ${val}`);
			//		$('#masterVolume').slider('value', val);
		});

		socket.on('integraInput', function (msg) {
			$('#inputSetting').text(`Integra IN: ${msg}`).css('color', '#20cc20');;
		});

		socket.on('listenMode', function (msg) {
			$('#listenMode').text(`Listen mode: ${msg}`).css('color', '#20cc20');;
		});

	});


});
