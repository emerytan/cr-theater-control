define(function (require) {

	var projectorHTML = require('text!html/projector.html');

	//// locals
	var $ = require('jquery'),
		socket = require('socketRouter'),
		jqxButton = require('jqxButton'),
		jqxButtonGroup = require('jqxButtonGroup'),
		jqxcheckbox = require('jqxcheckbox');

	var macroButtons = '#macro1, #macro2, #macro3, #macro4, #macro5, #macro6';

	function appendLog(msg, b) {
		console.log(`}---> ${msg} says ${b}`);
		$('#log').append('>>|:  ' + msg + ' : ' + b + '<br/>');
		var hgt = document.getElementById("log").scrollHeight;
		$('#log').scrollTop(hgt);
	};

	//// exports
	var projectorInit = function projectorInit() {

		$(projectorHTML).appendTo('#deviceContainer');


		var macroWidth = $('#projectorPresets').innerWidth().toFixed(0) - 40;
		$(macroButtons).css('width', macroWidth);


		$(window).resize(function (event) {
			macroWidth = $('#projectorPresets').width().toFixed(0) - 10;
			$(macroButtons).css('width', macroWidth);
		});


		$('#barcoMacros').jqxButtonGroup({
			theme: 'dark',
			mode: 'radio'
		});


		$("#barcoMacros").on('buttonclick', function (event, elem) {
			var clickedButton = event.args.index;
			// var macro = clickedButton[0].text;
			socket.emit('barco macro', clickedButton);
		});


		//// sockets     
		socket.on('lastMac', function lastMac(val) {
			console.log(val);
			$('#barcoMacros').jqxButtonGroup('setSelection', val.id);
			$('#projectorMacro').text(`Barco preset: ${val.name}`).css('color', '#20cc20');
		});

		socket.on('barco Macros', function (val) {
			console.log('barcoMacros: ' + val.macroID);
			$(val.macroID).text(val.macroName);
			appendLog(val.macroID, val.macroName);
		});

		socket.on('barcoMacros', function (msg) {
			console.log(msg)
			var m = 0;
			for (m; m < msg.macroID.length; m++) {
				$(msg.macroID[m]).text(msg.macros[m]);

			}

			var macroMatch = msg.macros.indexOf(msg.lastMacro);
			$('#barcoMacros').jqxButtonGroup('setSelection', macroMatch);

		});

	}


	return {
		init: projectorInit
	};

});
