var hideNote = function(){
  socket.emit('hideNote', $(this).attr('id'));
};

$('.note').bind('closed.bs.alert', hideNote);

// after a note is saved to database, update the page
socket.on('doneCreatingText', function(data){
  var button = '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>';
  var newDiv = '<div class="note" id="'+ data.id +'">' + button + data.data + '</div>';
  $('#noteContainer').prepend(newDiv);
  $('#'+data.id).bind('closed.bs.alert', hideNote);
});

socket.on('doneCreatingImage', function(data){
  var button = '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>';
  var image = '<img src="/images/' + data.id + '">';
  var newDiv = '<div class="note" id="'+ data.id +'">' + button + image + '</div>';
  $('#noteContainer').prepend(newDiv);
  $('#'+data.id).bind('closed.bs.alert', hideNote);
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
    console.log(value.data);
    ss(socket).emit('createImage', stream, {size: value.data.size, type: value.data.type});
    ss.createBlobReadStream(value.data).pipe(stream);
  }
});