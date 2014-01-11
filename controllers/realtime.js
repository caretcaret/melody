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
      //send acknowledgement
      socket.emit('createTextAck', "Receiving " + value.type + ": " +
          value.data.length + " chars");

      //handle the new note
      notes.handle(socket.handshake.user.email, value, function(id){
        //tell client that we're done handling
        socket.emit('doneCreatingText', {
          data: value.data,
          id: id,
        });
      });
    });

    ss(socket).on('createImage', function(stream, data) {
      console.log("createImage - %s sent %s containing %d bytes",
        socket.handshake.user.email, data.type, data.size);
      var bufs = [];
      stream.on('data', function(data){
        bufs.push(data);
      });

      stream.on('end', function(){
        var buf = Buffer.concat(bufs);
        socket.emit('createImageAck', "Receiving image: " +
          data.size + " bytes");

        //handle the new note
        notes.handle(socket.handshake.user.email, {data: buf, type: data.type} , function(id){
          //tell client that we're done handling
          socket.emit('doneCreatingImage', {
            id: id
          });
        });
      });
    });

    socket.on('hideNote', function(id){
      notes.hide(id);
    });
  });
};
