socket.on('doneCreatingText', function(data){
  var newDiv = '<div class="note">' + data + '</div>';
  $('#noteContainer').append(newDiv);
});

// if the app is in a state to accept pastes and upload them
var acceptPastes = true;

device.initPaste();
device.onPaste(function(value) {
  console.log(value.type + " paste received.");
  if (!acceptPastes) {
    console.log("Paste rejected.");
    return;
  }

  if (value.type === 'text' || value.type === 'html') {
    // don't use a stream, just a regular text
    socket.emit('createText', value);

  } else if (value.type === 'image') {
    var stream = ss.createStream();

    // upload the file
    ss(socket).emit('createImage', stream, {size: value.data.size});
    ss.createBlobReadStream(value.data).pipe(stream);
  }
});
