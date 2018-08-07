define(['jquery'], function ($) {

	var logHTML = '<div id="logContainer"><div id="log"><p></p></div></div>';

	var logInit = function logInit () {

		$(logHTML).appendTo('#deviceContainer');

		function appendLog(msg, b) {
	    console.log(`}---> ${msg} says ${b}`);
	    $('#log').append('>>|:  ' + msg + ' : ' + b + '<br/>');
	    var hgt = document.getElementById("log").scrollHeight;
	    $('#log').scrollTop(hgt);
	  };
	  
	};
	
	
	return {
		init: logInit
	};

});