var mongoose = require('mongoose'),
	Note = mongoose.model('Note'),
	User = mongoose.model('User'),
	_ = require('underscore');

function generateSlug(){
	var dict = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890";
	var result = "";
	for (var i = 0; i < 16; i++){
		result += dict[Math.floor(Math.random() * dict.length)];
	}
	return result;
}

exports.handle = function(user, data){
	User.lookupByEmail(user, function(err,user){
		//check for errors
		if (err) {
			console.log("[ERROR] could not lookup user: " + err);
			req.flash('error', err);
			return res.redirect('/');
        }
        //assume user is found, since he must be logged in
        //generate note object based on data
        var now = new Date();
        var newNote = {
			owner : user._id,
			collaborators : [],
			type : data.type,
			source : data.source,
			data : data.data,
			created : now,
			modified : now,
			title : "Untitled",
			visibility : data.visibility,
			shareId : generateSlug()
        };
        var note = new Note(newNote);
        note.save(function(err){
			if (err) {
				console.log("[ERROR] could not save note: " + err);
				req.flash('error', err);
				return res.redirect('/');
			}
        });
	});
};