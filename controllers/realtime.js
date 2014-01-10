var ss = require('socket.io-stream'),
  fs = require('fs'),
  notes = require('./notes');

module.exports = function(io) {
  io.sockets.on('connection', function(socket) {
    socket.emit('userinfo', {
      name: socket.handshake.user.name,
      email: socket.handshake.user.email
    });

    socket.on('createText', function(value) {
      //console.log("createText - %s sent %s containing %d bytes",
      //  socket.handshake.user.email, value.type, value.data.length);
      socket.emit('createTextAck', "Receiving " + value.type + ": " +
          value.data.length + " chars");
      notes.handle(socket.handshake.user.email, value);
      socket.emit('doneCreatingText', value.data);
    });

    ss(socket).on('createImage', function(stream, data) {
      console.log("createImage - %s sent image containing %d bytes",
        socket.handshake.user.email, data.size);
        stream.pipe(fs.createWriteStream('./upload/test.png'));
        socket.emit('createImageAck', "Receiving image: " +
          data.size + " bytes");
    });
  });
};
