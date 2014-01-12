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
  updated: Date,
  title: String,
  visibility: String,
  shareId: String
});

noteSchema.statics.lookupByUserId = function(id, next){
  this.find({'owner': id, 'visibility' : 'show'}).sort('-created').exec(next);
};

noteSchema.statics.lookupImageById = function(id, next){
  this.findOne({shareId: id}).exec(next);
};

noteSchema.statics.updateVisibility = function(id, v, next){
  this.update({shareId: id}, {$set: {visibility: v}}).exec(next);
};

module.exports = mongoose.model('Note', noteSchema, 'notes');
