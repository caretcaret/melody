var mongoose = require('mongoose'),
	Note = mongoose.model('Note'),
	User = mongoose.model('User'),
	_ = require('underscore'),
	fs = require('fs'),
	modules = [],
	modules_path = __dirname + '/../modules';


fs.readdirSync(modules_path).forEach(function (file) {
	modules.push(require(modules_path+'/'+file));
});


function generateSlug(){
	var dict = "abcdefghijklmnopqrstuvwxyz01234567890";
	var result = "";
	for (var i = 0; i < 16; i++){
		result += dict[Math.floor(Math.random() * dict.length)];
	}
	return result;
}

function bestHandler(note){
	var bestModule = null, bestScore, currScore;
	for (var i = 0; i < modules.length; i++){
		currScore = modules[i].scorer(note);
		if (bestModule === null || currScore > bestScore){
			bestModule = i;
			bestScore = currScore;
		}
	}
	return modules[bestModule];
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
        var slug = generateSlug(); //7.96e24 unique values
        var newNote;

        //TODO: make sure slugs are unique (very low probability of collision)
        //TODO: generate titles?
        //TODO: figure out source of text/image/whatever


        var handler = bestHandler(data);
        console.log("best module: " + handler.type);

        if (data.type == 'html' || data.type == 'text'){
			if (data.type == 'text'){
				data.data = data.data.replace("\n","<br>");
			}
			var mime = data.type == 'html' ? 'text/html' : 'text/plain';
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
				data : {
					text : data.data,
					mimetype : mime
				}
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
				data: {
					binary: data.data,
					mimetype: data.type
				}
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

exports.hide = function(id, userid){
	//hiding an object doesn't delete it, just sets a flag
	Note.updateVisibility(id, userid, "hide", function(err){
		if (err) {
			console.log("[ERROR] could not hide note: " + err);
			req.flash('error', err);
			return res.redirect('/');
		}
	});
};