define(function (require) {

	const socket = require('socketRouter'),
		$ = require('jquery'),
		jqxcheckbox = require('jqxcheckbox'),
		jqxSwitchButton = require('jqxSwitchButton'),
		jqxButton = require('jqxButton'),
		jqxButtonGroup = require('jqxButtonGroup'),
		qsHTML = require('text!html/quickSetups.html'),
		qsSelectors = '#qs1, #qs2, #qs3, #qs4, #qs5, #qs6',
		dcpPlayer = '#dcpPlay, #dcpPause, #dcpStop';

	var quickSetups = function quickSetups() {

		$(qsHTML).appendTo('#deviceContainer');

		socket.emit('get quickSetups');


		// setup buttons
		$('#qsCont').jqxButtonGroup({
			theme: 'dark',
			mode: 'radio'
		});

		$(dcpPlayer).jqxButton({
			theme: 'dark',
			width: 120,
			height: 40
		});



		// resizes
		var qsSelWidth = $('#quickSetups').innerWidth().toFixed(0) - 40;
		$(qsSelectors).css('width', qsSelWidth);


		$(window).resize(function (event) {
			qsSelWidth = $('#quickSetups').width().toFixed(0) - 10;
			console.log('quickSetups: on resize === ' + qsSelWidth);
			$(qsSelectors).css('width', qsSelWidth);
		});




		// local functions
		function appendLog(msg, b) {
			console.log(`}---> ${msg} : ${b}`);
		};


		function quickSetups() {
			var g = $('input[type=radio]:checked').val();
			appendLog('quickSetups', g);
			socket.emit('qSet', g);
		};




		function sendQuickSetups(g, h) {
			socket.emit('qSet', {
				macroName: g,
				buttonNumber: h
			});

			switch (g) {
				case 'DCP Flat':
					console.log('DCP Flat switch');
					socket.emit('barco macro', 0)

					setTimeout(function () {
						socket.emit('masking', {
							motor: 'DCP FLat',
							command: 1
						});
					}, 1000);

					setTimeout(function () {
						socket.emit('input', 'multiCH');
					}, 2000);
					break;
				case 'DCP Scope':
					socket.emit('barco macro', 1)

					setTimeout(function () {
						socket.emit('masking', {
							motor: 'DCP Scope',
							command: 3
						});
					}, 1000);
					setTimeout(function () {
						socket.emit('input', 'multiCH');
					}, 2000);

					break;
				case 'MacMini':
					socket.emit('barco macro', 4)

					setTimeout(function () {
						socket.emit('masking', {
							motor: 'HD',
							command: 3
						});
					}, 1000);


					setTimeout(function () {
						socket.emit('kramer command', {
							source: "2",
							dest: "2"
						});
					}, 3000);


					setTimeout(function () {
						socket.emit('input', 'analog');
					}, 5000);

					break;
				case 'Apple TV':
					socket.emit('barco macro', 3)

					setTimeout(function () {
						socket.emit('masking', {
							motor: 'HD',
							command: 3
						});
					}, 1000);

					setTimeout(function () {
						socket.emit('input', 'multiCH');
					}, 2000);

					break;
				case 'PS3':
					socket.emit('barco macro', 2)

					setTimeout(function () {
						socket.emit('masking', {
							motor: 'HD',
							command: 3
						});
					}, 1000);

					setTimeout(function () {
						socket.emit('input', 'hdmi');
					}, 2000);

					setTimeout(function () {
						socket.emit('kramer command', {
							source: "1",
							dest: "2"
						});
					}, 3000);

					break;
				case 'HD SDI':
					socket.emit('barco macro', 5)

					setTimeout(function () {
						socket.emit('masking', {
							motor: 'HD',
							command: 3
						});
					}, 1000);

					setTimeout(function () {
						socket.emit('input', 'multiCH');
					}, 2000);
					break;
				default:
					break;
			}

		};


		// button events
		$("#qsCont").on('buttonclick', function (event, elem) {
			
			var clickedButton = event.args.button;
			var qs = clickedButton[0].id;
			var x = $('#' + qs).text();
			var y = $('#qsCont').jqxButtonGroup('getSelection');
			sendQuickSetups(x, y);
			$('#command1, #command2, #command3, #command4').text('...').css('color', '#eee');
			
		});



		$(dcpPlayer).on('mousedown touchstart', function (event) {
			var handle = $(this).attr('id');
			$('#testPara1').text(`dcpPlayer: ${handle}`)
			$('#testPara2').text(`event: ${event.type}`)

			socket.emit('jnior command', {
				setting: 'dcpPlayer',
				command: handle
			});
		});




		// sockets
		socket.on('qSet', function (val) {
			appendLog(val.macroName, val.buttonNumber);
			$('#qsCont').jqxButtonGroup('setSelection', val.buttonNumber);
		});


		socket.on('qSet', function (val) {
			$(val).button('toggle');
			appendLog('qSet', val);
		});


		socket.on('barcoStates', function (msg) {
			$('#command1').text('barco macro: ' + msg.lastMacro).css('color', '#20cc20');
		});

		socket.on('listenMode', function (msg) {
			$('#command4').text('Integra ListenMode: ' + msg).css('color', '#20cc20');
		});

		socket.on('integraInput', function (msg) {
			$('#command3').text('Integra input: ' + msg).css('color', '#20cc20');
		});
		
		socket.on('kramer', function (msg) {
			$('#command2').text(`HDMI to SDI: ${msg.avRTR}`).css('color', '#20cc20');
		});
	};


	return {
		init: quickSetups
	}

});


// out1 = bottom 1
// out2 = bottom 2
// out3 = bottom 3
// out4 = sp bottom
// out6 = bottom 4

// out7 = side 1
// out8 = side 2
// out9 = side 3
// out5 = sp side
// out10 = side 4


// DCP Flat: pulse 2, pulse 9
// DCP Scopr: pulse 6, pulse 9
// HD-SDI: pulse 2: pulse 8
// macmini appleTV: pulse 3: pulse 8
