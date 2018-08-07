define(function (require) {

	var integraHTML = require('text!html/integra.html');

	//// locals
	const $ = require('jquery'),
		socket = require('socketRouter'),
		jqxButton = require('jqxButton'),
		jqxButtonGroup = require('jqxButtonGroup'),
		jqxcheckbox = require('jqxcheckbox'),
		slider = require('jquery-ui'),
		defaultRef = 80;

	var integraButtons = '#hdmi, #analog, #multiCH';
	var refButtons = '#setRef, #restoreRef',
		userRef,
		currentRef;

	function appendLog(msg, b) {
		console.log(`}---> ${msg} says ${b}`);
		$('#log').append('>>|:  ' + msg + ' : ' + b + '<br/>');
		var hgt = document.getElementById("log").scrollHeight;
		$('#log').scrollTop(hgt);
	};



	var sliderVolume = function () {

		function slideMove(evt, elem) {
			if (elem.value >= 10) {
				socket.emit('volume', elem.value);
			} else {
				socket.emit('volume', `0${elem.value}`);
			}
		};

		function slideChange(evt, elem) {
			setTimeout(function () {
				if (elem.value >= 10) {
					socket.emit('volume', elem.value);
				} else {
					socket.emit('volume', `0${elem.value}`);
				}
			}, 1000)
		};


		$("#masterVolume").slider({
			orientation: "vertical",
			range: 'min',
			min: 0,
			max: 100,
			animate: 3000,
			value: 30,
			slide: slideMove,
			stop: slideChange
		});

		socket.on('send volume', function (val) {
			$('#masterVolume').slider('value', val);
		});


	}

	var integraInit = function () {

		$(integraHTML).appendTo('#deviceContainer');


		currentRef = defaultRef;

		$('#currentRef').text(`REF value: ${currentRef}`);

		$(integraButtons).jqxButton({
			theme: 'dark',
			width: 160,
			height: 40
		});

		$(refButtons).jqxButton({
			theme: 'dark',
			width: 160,
			height: 40
		});


		$(integraButtons).on('mousedown', function () {
			var input = $(this).attr('id');
			socket.emit('input', input);
		});


		$('#setRef').on('mousedown', function () {
			userRef = $('#masterVolume').slider('value');
			currentRef = userRef;
			socket.emit('refVolume', currentRef);
		});


		$('#restoreRef').on('mousedown', function () {
			currentRef = defaultRef;
			socket.emit('refVolume', currentRef);
		});


		socket.on('send volume', function (val) {
			$('#volReturned').text(`Volume: ${val}`);
		});

		socket.on('integraInput', function (msg) {
			$('#inputSetting').text('Integra Input: ' + msg).css('color', '#20cc20');
		});

		socket.on('setRefVol', function (val) {
			$('#currentRef').text(`REF value: ${val}`);
		})


	}

	return {
		init: integraInit,
		volume: sliderVolume,
		ref: currentRef
	};



});
