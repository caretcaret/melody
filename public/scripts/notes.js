function hideNote() {
  socket.emit('hideNote', $(this).attr('id'));
}

$('.preview-item').bind('closed.bs.alert', hideNote);

function createCloseBtn() {
  return $('<button></button>')
    .attr('class', 'close')
    .attr('data-dismiss', 'alert')
    .attr('aria-hidden', 'true')
    .html('&times;');
}

socket.on('doneCreatingImage', function(data) {
  var img = $('<img>')
    .attr('src', '/images/' + data.id)
    .attr('class', 'preview');
  var div = $('<div></div>')
    .attr('class', 'preview-item')
    .attr('id', data.id)
    .append(createCloseBtn())
    .append(img);
  $('#previewContainer').prepend(div);
});

socket.on('doneCreatingText', function(data) {
  var div = $('<div></div>')
    .html(data.data)
    .attr('class', 'preview-item')
    .attr('id', data.id)
    .append(createCloseBtn());
  $('#previewContainer').prepend(div);
});

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
    ss(socket).emit('createImage', stream,
      {
        size: value.data.size,
        type: value.data.type
      });
    ss.createBlobReadStream(value.data).pipe(stream);
  }
});
