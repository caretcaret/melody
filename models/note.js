var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var noteSchema = new Schema({
  owner: {type: Schema.Types.ObjectId, ref: 'User'},
  collaborators: [{type: Schema.Types.ObjectId, ref: 'User'}],
  type: String,
  source: String,
  data: String,
  attachments: [{
    binary: Buffer,
    mimetype: String
  }],
  created: Date,
  updated: Date,
  title: String,
  visibility: String,
  shareId: String
});

noteSchema.statics.lookupByUserId = function(id, next){
  this.find({'owner': id}).exec(next);
};

module.exports = mongoose.model('Note', noteSchema, 'notes');
