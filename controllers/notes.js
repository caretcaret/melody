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

exports.handle = function(user, data, next){
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
        var slug = generateSlug();
        var newNote;

        //TODO: make sure slugs are unique
        //TODO: generate titles?
        //TODO: figure out source of text/image/whatever

        if (data.type == 'html' || data.type == 'text'){
			newNote = {
				owner : user._id,
				collaborators : [],
				type : data.type,
				source : data.source,
				data : data.data,
				created : now,
				modified : now,
				title : "Untitled",
				visibility : "show",
				shareId : slug
			};
        }

        else if (data.type.indexOf('image') !== -1) {
			newNote = {
				owner : user._id,
				collaborators : [],
				type : data.type,
				source : data.source,
				created : now,
				modified : now,
				title : "Untitled",
				visibility : "show",
				shareId : slug,
				attachments: [{
					binary: data.data,
					mimetype: data.type
				}]
			};
        }

        //save note object to database
        var note = new Note(newNote);
        note.save(function(err){
			if (err) {
				console.log("[ERROR] could not save note: " + err);
				req.flash('error', err);
				return res.redirect('/');
			}
			next(slug);
        });
	});
};

exports.hide = function(id){

	//TODO: add security to make sure only owner can hide his notes

	//hiding an object doesn't delete it, just sets a flag
	Note.updateVisibility(id, "hide", function(err){
		if (err) {
			console.log("[ERROR] could not save note: " + err);
			req.flash('error', err);
			return res.redirect('/');
		}
	});
};