var requirejs = require('requirejs'),
    express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    colors = require('colors'),
    net = require('net'),
    EventEmitter = require('events'),
    devices = require('./devices/devices.js'),
    projector = require('./server_modules/projector.js'),
    integra = require('./server_modules/integra.js'),
    arduino = require('./server_modules/mega.js'),
//    jnior = require('./server_modules/jnior.js'),
    vera = require('./server_modules/trackLights.js'),
    kramer = require('./server_modules/kramer.js'),
    storage = require('./server_modules/storage');
    connections = [];

class MyEmitter extends EventEmitter {}
const deviceOnline = new MyEmitter();
exports.io = io;
exports.pubsub = deviceOnline;

app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/'));
app.use(express.static('./scripts/lib/bootstrap'));

server.listen(3000, function () {
    console.log('\n\n' + 'CR Device Control APP!!'.yellow + '\n');
    console.log('server listening on port '.cyan + app.get('port') + '\n----:: ::----');
    
    storage.connect()
    .then((state) => {
        if (state === true) {
            deviceOnline.emit('storage', true);
        }
    })
    .catch((error) => {
        console.log(error);
    });
});

deviceOnline.on('rgbPower', function (data) {
    console.log(`server has ${data} from rgb lights`);
    io.sockets.emit('rgbPower', data);

});

io.sockets.on('connection', function (socket) {

    connections.push(socket);
    console.log('server: '.green + ' new connection!!! ' + connections.length + ' clients');

    io.emit('client count', connections.length);

    socket.on('disconnect', function (socket) {
        connections.splice(connections.indexOf(socket), 1);
        console.log('server: connection dropped ' + connections.length + ' clients connected');
        io.emit('client count', connections.length);
    });

    socket.on('triggerOn', function () {
        socket.emit('blinkOn', {
            setting: 'power',
            trigger: 'run'
        });
    });

    socket.on('triggerOff', function () {
        socket.emit('blinkOff', {
            setting: 'power',
            trigger: 'stop'
        });
    });

    socket.on('qSet', function (val) {
        console.log('socket:'.cyan + ' : quicksetups ' + val.macroName + " : " + val.buttonNumber);
//        states.radio = val.macroName;
        socket.broadcast.emit('qSet', val);
    });

});

//
projector(io);
integra(io);
arduino(io);
vera(io);
kramer(io);

