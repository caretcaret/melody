exports.type = "text/plain";
exports.scorer = function(note){
	if (note.type == "text"){
		return 100;
	}
	if (note.type == "html"){
		return 75;
	}
	else return 0;
};
exports.extractor = function(note){
	return note.data;
};
exports.template = "{{data.text}}";
exports.render = function(data){
	return data.text;
};