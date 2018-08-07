// projector commands

var i,
    total,
    cmdSum,
    cmdVerify

function string2ascii(str) {
    var arr = [];
	var len = str.length;
    for (i = 0; i < len; i++) {
        arr[i] = str.charCodeAt(i)
    };

	return arr;
}

function chksumCalc(input) {
    cmdSum = 361
    total = 0;
    for (i = 0; i < input.length; i++) {
        total += input[i];
    }
    return (cmdSum + total) % 256;
}


// out1 = bottom 1
// out2 = bottom 2 flat
// out3 = bottom 3 hd
// out4 = sp bottom
// out6 = bottom 4 scope

// out7 = side 1  scope
// out8 = side 2  flat
// out9 = side 3  hd
// out5 = sp side
// out10 = side 4



var CMD = {
    success: [0xfe, 0x00, 0x00, 0x03, 0x01, 0x04, 0xff],
    ACK: [0xfe, 0x00, 0x00, 0x06, 0x06, 0xff],
    mac1: [0xfe, 0x00, 0xe8, 0x05, 0x01, 238, 255],
    mac2: [254, 0, 232, 5, 2, 239, 255],
    mac3: [254, 0, 232, 5, 3, 240, 255],
    mac4: [254, 0, 232, 5, 4, 241, 255],
    mac5: [254, 0, 232, 5, 5, 242, 255],
    mac6: [254, 0, 232, 5, 6, 243, 255],
    lastMac: [0xfe, 0x00, 0xe8, 0x01, 0xe9, 0xff],
    powerOff: [254, 0, 0, 3, 2, 102, 107, 255],
    powerOn: [254, 0, 0, 3, 2, 101, 106, 255],
    lampRes: [254, 0, 118, 154, 1, 16, 255],
    powerRes: [254, 0, 103, 1, 102, 255],
    shutterRes: [254, 0, 33, 66, 1, 99, 255],
    powerRead: [254, 0, 103, 1, 104, 255],
    lampOff: [254, 0, 0, 3, 2, 118, 26, 0, 149, 255],
    lampOn: [254, 0, 0, 3, 2, 118, 26, 1, 150, 255],
    lampRead: [254, 0, 118, 154, 16, 255],
    shutterClose: [254, 0, 0, 3, 2, 35, 66, 0, 106, 255],
    shutterOpen: [254, 0, 0, 3, 2, 34, 66, 0, 105, 255],
    shutterRead: [254, 0, 33, 66, 99, 255],
    macroHeader: [254, 0, 232, 129],
    zoomIn: [0xfe, 0x00, 0x00, 0x03, 0x02, 0xf4, 0x82, 0x00, 0x7b, 0xff],
    zoomOut: [0xfe, 0x00, 0x00, 0x03, 0x02, 0xf4, 0x82, 0x01, 0x7c, 0xff],
    focusIn: [0xfe, 0x00, 0x00, 0x03, 0x02, 0xf4, 0x83, 0x00, 0x7c, 0xff],
    focusOut: [0xfe, 0x00, 0x00, 0x03, 0x02, 0xf4, 0x83, 0x01, 0x7d, 0xff],
    shiftUp: [0xfe, 0x00, 0x00, 0x03, 0x02, 0xf4, 0x81, 0x00, 0x7a, 0xff],
    shiftDown: [0xfe, 0x00, 0x00, 0x03, 0x02, 0xf4, 0x81, 0x01, 0x7b, 0xff],
    shiftLeft: [0xfe, 0x00, 0x00, 0x03, 0x02, 0xf4, 0x81, 0x02, 0x7c, 0xff],
    shiftRight: [0xfe, 0x00, 0x00, 0x03, 0x02, 0xf4, 0x81, 0x03, 0x7d, 0xff]
};





module.exports.CMD = CMD;

exports.getStates = function (projector) {
    setTimeout(pwRead, 500);
    setTimeout(lmpRead, 600);
    setTimeout(dowRead, 700);

    function pwRead() {
        projector.write(Buffer.from(CMD.powerRead));
    };

    function lmpRead() {
        projector.write(Buffer.from(CMD.lampRead));
    };

    function dowRead() {
        projector.write(Buffer.from(CMD.shutterRead));
    };

}

exports.getMacros = function (projector) {
    setTimeout(mac1, 800);
    setTimeout(mac2, 900);
    setTimeout(mac3, 1000);
    setTimeout(mac4, 1100);
    setTimeout(mac5, 1200);
    setTimeout(mac6, 1300);
    setTimeout(macRead, 1600);

    function mac1() {
        projector.write(Buffer.from(CMD.mac1));
    };

    function mac2() {
        projector.write(Buffer.from(CMD.mac2));
    };

    function mac3() {
        projector.write(Buffer.from(CMD.mac3));
    };

    function mac4() {
        projector.write(Buffer.from(CMD.mac4));
    };

    function mac5() {
        projector.write(Buffer.from(CMD.mac5));
    };

    function mac6() {
        projector.write(Buffer.from(CMD.mac6));
    };

    function macRead() {
        projector.write(Buffer.from(CMD.lastMac));
    };

}

exports.writeMacro = function (projector, macroName) {
    // var trim = macroName.slice(1);
    var decArr = string2ascii(macroName);
    var chkSUM = chksumCalc(decArr);
    var endPacket = [0, chkSUM, 255];
    var buildCMD = CMD.macroHeader.concat(decArr, endPacket);
    console.log('commands - barco: ');
	console.log(Buffer.from(buildCMD));
	projector.write(Buffer.from(buildCMD));
	
}



////
////  Integra
////



var hdrBuf, lvlBuf, end, xxy;
var integraCommands = {
    readInput: [73, 83, 67, 80, 0, 0, 0, 10, 0, 0, 0, 12, 1, 0, 0, 0, 33, 49, 83, 76, 73, 81, 83, 84, 78, 13],
    readVolume: [73, 83, 67, 80, 0, 0, 0, 10, 0, 0, 0, 12, 1, 0, 0, 0, 33, 49, 77, 86, 76, 81, 83, 84, 78, 13],
    readMode: [73, 83, 67, 80, 0, 0, 0, 10, 0, 0, 0, 12, 1, 0, 0, 0, 33, 49, 76, 77, 68, 81, 83, 84, 78, 13],
    readPower: [73, 83, 67, 80, 0, 0, 0, 10, 0, 0, 0, 12, 1, 0, 0, 0, 33, 49, 80, 87, 82, 81, 83, 84, 78, 13],
    volPrefix: [73, 83, 67, 80, 0, 0, 0, 10, 0, 0, 0, 10, 1, 0, 0, 0, 33, 49, 77, 86, 76],
    hdmi: [73, 83, 67, 80, 0, 0, 0, 10, 0, 0, 0, 10, 1, 0, 0, 0, 33, 49, 83, 76, 73, 49, 48, 13],
    analog: [73, 83, 67, 80, 0, 0, 0, 10, 0, 0, 0, 10, 1, 0, 0, 0, 33, 49, 83, 76, 73, 50, 51, 13],
    multiCH: [73, 83, 67, 80, 0, 0, 0, 10, 0, 0, 0, 10, 1, 0, 0, 0, 33, 49, 83, 76, 73, 51, 48, 13],
    stereo: [73, 83, 67, 80, 0, 0, 0, 10, 0, 0, 0, 10, 1, 0, 0, 0, 33, 49, 76, 77, 68, 48, 48, 13],
    powerOn: [73, 83, 67, 80, 0, 0, 0, 10, 0, 0, 0, 10, 1, 0, 0, 0, 33, 49, 80, 87, 82, 48, 49, 13],
    powerOff: [73, 83, 67, 80, 0, 0, 0, 10, 0, 0, 0, 10, 1, 0, 0, 0, 33, 49, 80, 87, 82, 48, 48, 13]
}

module.exports.integraCMD = integraCommands;

exports.getVolume = function (integra) {
    integra.write(Buffer.from(integraCommands.readVolume));
}

exports.getSoundInput = function (integra) {
    integra.write(Buffer.from(integraCommands.readInput));
}

exports.getListenMode = function (integra) {
    integra.write(Buffer.from(integraCommands.readMode));
}

exports.setStereo = function (integra) {
    integra.write(Buffer.from(integraCommands.stereo));
}

exports.hdmi = function (integra) {
    integra.write(Buffer.from(integraCommands.hdmi));
}

exports.analog = function (integra) {
    integra.write(Buffer.from(integraCommands.analog));
}

exports.multiCH = function (integra) {
    integra.write(Buffer.from(integraCommands.multiCH));
}

hdrBuf = Buffer.from(integraCommands.volPrefix);
end = Buffer.from([13]);
exports.changeLevel = function (integra, level) {
    xxy = level.toString(16).toUpperCase();
    lvlBuf = Buffer.from(xxy);
    integra.write(Buffer.concat([hdrBuf, lvlBuf, end]));
}

exports.integraPWR = (integra) => {
    integra.write(Buffer.from(integraCommands.readPower));
}

exports.integraOn = (integra) => {
    integra.write(Buffer.from(integraCommands.powerOn));
}

exports.integraOff = (integra) => {
    integra.write(Buffer.from(integraCommands.powerOff));
}







////
////  JNIOR
////
var JNIOR = {
    login: [0x01, 0x00, 0x0D, 0xFF, 0xFF, 0x7E, 0x05, 0x6A, 0x6E, 0x69, 0x6F, 0x72, 0x05, 0x6A, 0x6E, 0x69, 0x6F, 0x72],
    exhaustON: [0x01, 0x00, 0x04, 0xFF, 0xFF, 0x0A, 0x01, 0x00, 0x0B],
    exhaustOFF: [0x01, 0x00, 0x04, 0xFF, 0xFF, 0x0A, 0x02, 0x00, 0x0B],
    pingJR: [0x01, 0x00, 0x02, 0xff, 0xff, 0x0a, 0x06],
    dcpPlay: [0x01, 0x00, 0x11, 0xFF, 0xFF, 0xFF, 0x05, 0x6D, 0x61, 0x63, 0x72, 0x6F, 0x01, 0x00, 0x07, 0x70, 0x6C, 0x61, 0x79, 0x44, 0x43, 0x50],
    dcpPause: [0x01, 0x00, 0x12, 0xFF, 0xFF, 0xFF, 0x05, 0x6D, 0x61, 0x63, 0x72, 0x6F, 0x01, 0x00, 0x08, 0x70, 0x61, 0x75, 0x73, 0x65, 0x44, 0x43, 0x50],
    dcpStop: [0x01, 0x00, 0x11, 0xFF, 0xFF, 0xFF, 0x05, 0x6D, 0x61, 0x63, 0x72, 0x6F, 0x01, 0x00, 0x07, 0x73, 0x74, 0x6F, 0x70, 0x44, 0x43, 0x50],
    pulseOut1: [0x01, 0x00, 0x08, 0xFF, 0xFF, 0x0A, 0x06, 0x00, 0x01, 0x00, 0x00, 0x01, 0xC8],
    pulseOut2: [0x01, 0x00, 0x08, 0xFF, 0xFF, 0x0A, 0x06, 0x00, 0x02, 0x00, 0x00, 0x01, 0xC8],
    pulseOut3: [0x01, 0x00, 0x08, 0xFF, 0xFF, 0x0A, 0x06, 0x00, 0x03, 0x00, 0x00, 0x01, 0xC8],
    pulseOut6: [0x01, 0x00, 0x08, 0xFF, 0xFF, 0x0A, 0x06, 0x00, 0x06, 0x00, 0x00, 0x01, 0xC8],
    pulseOut7: [0x01, 0x00, 0x08, 0xFF, 0xFF, 0x0A, 0x06, 0x00, 0x07, 0x00, 0x00, 0x01, 0xC8],
    pulseOut8: [0x01, 0x00, 0x08, 0xFF, 0xFF, 0x0A, 0x06, 0x00, 0x08, 0x00, 0x00, 0x01, 0xC8],
    pulseOut9: [0x01, 0x00, 0x08, 0xFF, 0xFF, 0x0A, 0x06, 0x00, 0x09, 0x00, 0x00, 0x01, 0xC8],
    pulseOut10: [0x01, 0x00, 0x08, 0xFF, 0xFF, 0x0A, 0x06, 0x00, 0x0a, 0x00, 0x00, 0x01, 0xC8]
};
// 01 00 02 f0 20 7d 80> login good
// 01 00 02 10 61 7d ff> login failed
module.exports.JNIOR = JNIOR;






////
////  kramer
////
var kramer = {
    getInput1: '# VID? 1 \r',
    getInput2: '# VID? 2 \r',
    powerSaveOn: 'POWER-SAVE?\r',
    powerSaveOff: 'POWER-SAVE?\r',
	audSwap: '#AUD-SWAP?\r',
    switchOutput: function (src, dest) {
        return '# VID ' + src + '>' + dest + ' \r'
    }
};

module.exports.kramer = kramer;
