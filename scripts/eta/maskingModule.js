define(function (require) {

    var maskingHTML = require('text!html/masking.html');

    //// locals
    var $ = require('jquery'),
        socket = require('socketRouter'),
        jqxButton = require('jqxButton'),
        jqxButtonGroup = require('jqxButtonGroup'),
        jqxcheckbox = require('jqxcheckbox');

    var maskingButtons = '#openSide, #closeSide, #raise, #lower',
        lensButtons = '#focusOut, #focusIn, #zoomOut, #zoomIn, #shiftLeft, #shiftRight, #shiftUp, #shiftDown';

    function appendLog(msg, b) {
        console.log(`}---> ${msg} says ${b}`);
        $('#log').append('>>|:  ' + msg + ' : ' + b + '<br/>');
        var hgt = document.getElementById("log").scrollHeight;
        $('#log').scrollTop(hgt);
    };

    var maskingInit = function maskingInit() {

        $(maskingHTML).appendTo('#deviceContainer');

        $(maskingButtons).jqxButton({
            theme: 'dark',
            width: 120,
            height: 40
        });


        $(maskingButtons).on('mousedown touchstart', function (event) {
            var action = $(this).attr('id');
            socket.emit('masking', {
                motor: action,
                command: 0
            });
        });


        $(maskingButtons).on('mouseup touchend', function (event) {
            var action = $(this).attr('id');
            socket.emit('masking', {
                motor: action,
                command: 1
            });
        });


        $(lensButtons).jqxButton({
            theme: 'dark',
            width: 120,
            height: 40
        });


        $(lensButtons).on('mousedown touchstart', function (event) {
            var handle = $(this).attr('id');
            $('#testPara1').text(`lens: ${handle}`)
            $('#testPara2').text(`event: ${event.type}`)
            
            socket.emit('barco command', {
                setting: 'lens',
                state: handle
            });
        });


//        $(lensButtons).on('mouseup touchend', function (event) {
//            var handle = $(this).attr('id');
//            $('#testPara2').text(`event: ${event.type}`)
//            
//            $('#testPara1').text(`lens: ${handle}`);
//            socket.emit('barco command', {
//                setting: 'lens',
//                state: handle
//            });
//        });


    }

    return {
        init: maskingInit
    };

});