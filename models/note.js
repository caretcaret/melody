var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var noteSchema = new Schema({
  owner: {type: Schema.Types.ObjectId, ref: 'User'},
  collaborators: [{type: Schema.Types.ObjectId, ref: 'User'}],
  type: String,
  source: String,
  data: {
    binary: Buffer,
    text: String,
    mimetype: String
  },
  created: Date,
  modified: Date,
  title: String,
  visibility: String,
  shareId: String
});

noteSchema.statics.lookupByUserId = function(id, next){
  this.find({'owner': id, 'visibility' : 'show'}).sort('-created').exec(next);
};

noteSchema.statics.lookupImageById = function(id, next){
  this.findOne({shareId: id}).exec(function(err,img){
    if (img === null || img.type.indexOf('image') < 0){
      e = err || "[ERROR] Requested file is not a valid image.";
      return next(e,null);
    }
    else return next(null,img);
  });
};

noteSchema.statics.updateVisibility = function(id, userid, vis, next){
  var now = new Date();
  this.update({shareId: id, owner: userid},
    {$set: {visibility: vis, modified: now}}).exec(next);
};

module.exports = mongoose.model('Note', noteSchema, 'notes');
