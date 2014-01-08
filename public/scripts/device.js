// device.js: a unified way to handle those newspangled JavaScript APIs.

var device = {};

// an object type to return from onPaste
function ClipboardValue(type, data, attachments) {
  // either 'text', 'image', 'html'
  this.type = type;
  // a string (plaintext), a file handle, html source, depending on the type
  this.data = data;
  this.attachments = attachments;
}

// clipboard
device.initPaste = function() {
  var pasteCatcher = document.createElement('div');
  pasteCatcher.setAttribute('contenteditable', '');
  // make div invisible
  pasteCatcher.style.opacity = 0;
  pasteCatcher.style.marginLeft = "-9001px";
  pasteCatcher.style.marginTop = "-9001px";
  pasteCatcher.id = "pasteCatcher";
  document.body.appendChild(pasteCatcher);

  // initially focus on nothing.
  document.body.focus();
  function onkeydown(event) {
    // we only want to take away focus if no text element was focused
    // to begin with, or there is no text selection (so user can copy)
    var selectionEmpty = true;
    if (window.getSelection) {
      selectionEmpty = !(window.getSelection().toString());
    } else if (document.selection && document.selection.type !== 'Control') {
      selectionEmpty = !document.selection.createRange().text;
    }
    if (document.activeElement === document.body && selectionEmpty) {
      switch (event.keyCode || event.which || window.event.keyCode) {
        case 16: // shift for shift + insert
        case 17: // ctrl for ctrl + v
        case 91: // cmd for cmd + v in chrome?
        case 224: // cmd in firefox?
          // reaim the focus
          pasteCatcher.focus();
          break;
      }
    }
  }
  document.addEventListener('keydown', onkeydown);
  // take advantage of IE's onbeforepaste as well, which triggers
  // when a menu containing the paste command is opened
  window.onbeforepaste = window.onkeydown;
};

// this method only fires when the focus is not on a text input, so
// that pasting in the regular text input works as normal.
device.onPaste = function(handler) {

  function checkPasteCatcher() {
    var pasteCatcher = document.getElementById("pasteCatcher");
    var child = pasteCatcher.childNodes[0];
    console.log(child);
    // TODO: convert child into a ClipboardValue and pass into handler
    handler(null);
    pasteCatcher.innerHTML = "";
  }

  document.onpaste = function(event) {
    // only if we're pasting into the pasteCatcher do we want to do anything.
    if (event.target.id === 'pasteCatcher') {
      // clear the paste catcher so it only contains the clipboard data
      document.getElementById('pasteCatcher').innerHTML = "";

      var data = event.clipboardData || event.originalEvent.clipboardData;
      // are we in Chrome? Chrome and Firefox support event.clipboardData
      if (data) {
        var items = data.items;
        //console.log(JSON.stringify(data.files));
        // does it have the .items attribute? If so, we're in luck
        // and probably using Chrome.
        if (items) {
          console.log(JSON.stringify(data));
          // clipboardData is a DataTransfer object with:
          // clipboardData.items is a DataTransferItemsList object. Each
          // element of the list has a .kind which is either "string" or
          // "file", and has a .type which is a mimetype string. If it is
          // a file, get the File object with .getAsFile(). If it is a string,
          // get it with .getAsString(callback) where callback takes in the
          // string.
          // clipboardData.files is a FileList object containing any
          // images/attachment refs in an HTML paste (with type text/html).
          // First, loop through the items array to find an image.
          for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              var file = items[i].getAsFile();
              return handler(new ClipboardValue('image', file));
            }
          }
          // no image found, try to find html
          for (var i = 0; i < items.length; i++) {
            if (items[i].type === 'text/html') {
              return items[i].getAsString(function(str) {
                return handler(new ClipboardValue('html', str));
              });
            }
          }
          // no html, find plain text
          for (var i = 0; i < items.length; i++) {
            if (items[i].type === 'text/plain') {
              return items[i].getAsString(function(str) {
                return handler(new ClipboardValue('text', str));
              });
            }
          }
          // no image or text found, return nothing and don't call handler.
          return null;
        }
        // if not, try to read contents from the div. We don't do this with
        // Chrome because you cannot directly paste images into html nodes
        // in Chrome.
      }
      // IE supports window.clipboardData, but it only supports .getData on
      // the 'Text' and 'URL' types, so we'll read from the div as well.

      // wait some time for the content to be pasted, then get its contents
      // since the onpaste event runs before the content is inserted
      setTimeout(checkPasteCatcher, 100);
    }
  };
};

// drag and drop
device.dragAndDrop = false;
device.onDrop = function(handler) {

};

// video/audio recording
device.record = false;
device.startRecording = function(handler) {

};
device.interruptRecording = function(handler) {

};
device.stopRecording = function(handler) {

};
device.isRecording = function(handler) {

};
device.takePicture = function(handler) {

};

// geolocation
device.geolocation = false;
device.onLocationUpdate = function(handler) {

};

// battery management & page visibility
device.battery = false;
device.getBatteryLevel = function(handler) {

};
device.useBatteryStrategy = function(strategy) {

};

device.initPaste();
device.onPaste(function(){
  console.log('paste received!');
});
