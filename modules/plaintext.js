exports.type = "text/plain";
exports.scorer = function(note){
	if (note.type == "text"){
		return 100;
	}
	if (note.type == "html"){
		return 50;
	}
	else return 0;
};
exports.extractor = function(note){
	
};
exports.template = "{{data.data.text}}";
exports.render = function(data){
	return data.data.text;
};