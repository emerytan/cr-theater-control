define(['io'], function souketRouter(io) {

    var socket = io.connect();

    require(['jquery'], function ($) {
        // body...

        function appendLog(msg, b) {
            console.log(`}---> ${msg} : ${b}`);
        };

        socket.on('connect', function (socket) {
            appendLog('socketRouter', 'says hi');
            $('#headerText').text('Cinereach Screening Room').css('color', '#33f');
        });


        socket.on('disconnect', function () {
            appendLog('socketRouter', 'says bye');
            $('#headerText').text('<---||   Control server is down!   ||--->').css('color', '#f33');
            $('#devices').empty();
            //      $('#devices').text('node server is down').css('color', 'red');
        });


        socket.on('client count', function (cnt) {
            appendLog('client count: ', cnt);
            $('#clientCount').text('client count: ' + cnt);
        });


        socket.on('devices', function (data) {
            console.log(data);
            $(data.id).text(`${data.name}`);
            if (data.online === true) {
                $(data.id).css('color', '#20cc20');
            } else {
                $(data.id).css('color', '#cc2020');
            }
        });

    }); // end of jquery require statement

    return socket;

}); // opening define
