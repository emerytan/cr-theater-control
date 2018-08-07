define(function (require) {
	const $ = require('jquery'),
		socket = require('socketRouter'),
		lightsHTML = require('text!html/lights.html'),
		slider = require('jquery-ui'),
		jqxButton = require('jqxButton'),
		jqxButtonGroup = require('jqxButtonGroup'),
		modal = require('bsModal'),
		jqxDropDownList = require('jqxDropDownList'),
		mockDrop = ['Preset 1', 'Preset 2', 'Preset 3', 'Preset 4', 'Preset 5'],
		presetButtons = "#preset0, #preset1, #preset2, #preset3, #preset4, #setPresets";




	var myStates = {
			rgbLights: false
		},
		presets = {},
		buttonNames = [],
		currentLightValues = [];

	var init = function lightsInit() {
		$(function () {

			$(lightsHTML).appendTo('#deviceContainer');

			socket.emit('lightsInit');

			$(window).resize(function () {
				var presetsWidth = $('#trackLightPresets').outerWidth().toFixed(0)
				$(presetButtons).css('width', presetsWidth)
			})

			$("#red, #green, #blue").slider({
				orientation: "horizontal",
				range: "min",
				min: 0,
				max: 128,
				value: 0,
				animate: 2000,
				slide: slideMove,
				stop: slideChange
			});

			$("#t1, #t2, #t3, #t4").slider({
				orientation: "horizontal",
				range: "min",
				min: 0,
				max: 100,
				animate: 2000,
				slide: moveTracks,
				stop: sendTracks
			});

			$('#trackLightPresets').jqxButtonGroup({
				theme: 'dark',
				mode: 'radio'
			});

			function setPresetNames(mongoDoc) {
				for (var index = 0; index < mongoDoc.length; index++) {
					if (mongoDoc[index].name) {
						$(`#${mongoDoc[index].element}`).val(mongoDoc[index].name)
						buttonNames[index] = mongoDoc[index].name
					}
				}
				return buttonNames
			}


			function getCurrentLevels() {
				$("#trackLights > div").each(function (index, element) {
					currentLightValues[index] = $(element).slider('value');
				});
				return currentLightValues;
			};


			var presetWidth = $('#trackLightPresets').innerWidth().toFixed(0);
			$(presetButtons).css('width', presetWidth);

			// $('#ledPreset1, #ledPreset2').jqxButton({
			//   theme: 'dark',
			//   width: 150,
			//   height: 40
			// });

			$('#setPresets').jqxButton({
				theme: 'dark',
				width: $('#trackLightPresets').outerWidth().toFixed(0),
				height: 40
			});

			$('#myModal').modal({
				keyboard: false,
				show: false
			});

			$("#trackLightPresets").on('buttonclick', function (event, element) {
				var recallIndex = 'preset' + event.args.index
				for (var key in presets) {
					if (presets.hasOwnProperty(key)) {
						if (key === recallIndex) {
							setSlider('t1', presets[key].values[0]);
							setSlider('t2', presets[key].values[1]);
							setSlider('t3', presets[key].values[2]);
							setSlider('t4', presets[key].values[3]);
							socket.emit('recall preset', recallIndex)
						}
					}
				}
			});

			$('#setPresets').on('click', function () {
				var newPresetName = undefined;
				var presetIndex = undefined;
				var presetNumber = undefined;


				$('#lightsDropdown').jqxDropDownList({
					template: 'info',
					source: buttonNames,
					dropDownHeight: 130,
					selectedIndex: -1,
					placeHolder: "Select Preset to Replace",
					width: '200',
					height: '32'
				});


				$('#myModal').modal('show');

				$('#myModal').on('shown.bs.modal', function () {
					$('#trackInput').submit(function () {
						newPresetName = $('#getPreset').val();
						$('#messages').text(`newPresetName: ${newPresetName}`);
						return false;
					});

					$('#lightsDropdown').on('select', function (event) {
						if (args) {
							presetNumber = args.index;
							presetIndex = 'preset' + args.index;
						}
					});

					$('#closeModal').on('click', function (event, element) {
						$('#myModal').modal('hide');
					})


					$('#saveChanges').on('click', function (event, element) {
						getCurrentLevels();
						newPresetName = $('#getPreset').val();
						if (newPresetName === '') {
							newPresetName = buttonNames[presetNumber]
						}
						if (typeof (newPresetName) === 'string') {
							// presets[presetIndex].name = newPresetName
							buttonNames[presetNumber] = newPresetName
							// $(`#${presetIndex}`).val(newPresetName)
							$('#messages').text(`sending to mongo: ${presetIndex}: ${presetNumber}: ${newPresetName} ${presets[presetNumber].values}`)
							for (var key in presets) {
								if (key === presetIndex) {
									socket.emit('presetChange', {
										element: presetIndex,
										values: currentLightValues,
										name: newPresetName
									})
								}
							}
						}
						// console.log(presets)          
						$('#myModal').modal('hide');
					});

					$('#myModal').on('hidden.bs.modal', function (e) {
						document.getElementById("trackInput").reset();
						newPresetName = undefined;
						presetIndex = undefined;
						currentLightValues = [];
						presets = {};
						$('#lightsDropdown').jqxDropDownList({
							source: buttonNames
						})
					});
				});
			});

			function slideMove(evt, elem) {
				var i = $(this).prop('id');
				var R = $('#red').slider('value');
				var G = $('#green').slider('value');
				var B = $('#blue').slider('value');
				if (myStates.rgbPower === true) {
					socket.emit('sliderMove', {
						red: R,
						green: G,
						blue: B
					});
				}
			};

			function slideChange(evt, elem) {
				var i = $(this).prop('id');
				$('#log').text('slider change: ' + elem.value + " : " + i);
				var R = $('#red').slider('value');
				var G = $('#green').slider('value');
				var B = $('#blue').slider('value');
				socket.emit('rgb slider', {
					value: elem.value,
					handle: i
				});
				if (myStates.rgbPower === true) {
					socket.emit('sliderMove', {
						red: R,
						green: G,
						blue: B
					});
				}
			};

			function sendTracks(evt, elem) {
				var h = $(this).prop('id');
				socket.emit('trackLights', {
					value: elem.value,
					handle: h
				});
			}

			function moveTracks(evt, elem) {
				var h = $(this).prop('id');
				var y = elem.value;
			}

			function setSlider(handle, value) {
				var $handle = '#' + handle;
				$($handle).slider('value', value);
			};

			function appendLog(msg, b) {
				// console.log(`}---> ${msg} says ${b}`);
				$('#log').append('>>|:  ' + msg + ' : ' + b + '<br/>');
				var hgt = document.getElementById("log").scrollHeight;
				$('#log').scrollTop(hgt);
			};

			socket.on('rgb states', function (val) {
				for (var keys in val) {
					$('#' + keys).slider('value', val[keys])
				};
			});

			socket.on('rgb slider', function (val) {
				if (val.value <= 128 && val.value >= 0) {

				}
				setSlider(val.handle, val.value);
			});

			socket.on('trackLights returned', function (lights) {
				myStates.power = lights.power
				if (lights.power === true) {
					setSlider('t1', lights.currentLevels[0]);
					setSlider('t2', lights.currentLevels[1]);
					setSlider('t3', lights.currentLevels[2]);
					setSlider('t4', lights.currentLevels[3]);
				}
			});

			socket.on('mongo trackLights', function (msg) {
				// console.log('mongo update');
				presets = msg;
				for (var i = 0; i < msg.length; i++) {
					if (msg[i].element) {
						presets[msg[i].element] = msg[i]
					}
				}
				// console.log(presets);
				setPresetNames(msg);
			});

			socket.on('lightsModule update', function (msg) {
				if (msg === true) { // lights are on - make sliders active
					myStates.tracksPower = true;
					$('#trackLights').fadeTo(1000, 1);
				}

				if (msg === false) { // lights are off, dim the sliders
					myStates.tracksPower = false;
					$('#trackLights').fadeTo(1000, .4);
				}
			});

			socket.on('rgbPower', function (msg) {
				// console.log(msg);
				if (msg === true) {
					$('#rgbLED').fadeTo(1000, 1);
					myStates.rgbPower = true;
				};
				if (msg === false) {
					$('#rgbLED').fadeTo(1000, .4);
					myStates.rgbPower = false;
				};
			});
		})
	};

	return {
		init: init,
		trackLights: myStates.tracklights
	};

});
