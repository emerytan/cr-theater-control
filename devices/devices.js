var devices = {
  
}

module.exports.devices = devices;

exports.createDevice = function (id, name, host, port) {
  devices[id] = {
    name: name,
    host: host,
    port: port
  }
};