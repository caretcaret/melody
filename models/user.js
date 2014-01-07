var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  scrypt = require('scrypt'),
  env = process.env.NODE_ENV || 'development',
  config = require('../config')[env];

var userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  passhash: { type: String, required: true }
});

// takes in a password and a callback(err) function.
// asynchronously hashes the password using scrypt.
userSchema.methods.setPassword = function(password, next) {
  var user = this;
  scrypt.passwordHash(password, config.scrypt.maxtime, function(err, passhash) {
    if (!err) {
      user.passhash = passhash;
    } else {
      console.log("[ERROR] Password unable to be hashed: %s", err);
    }
    next(err);
  });
}

// takes in a password and a callback(result).
userSchema.methods.verifyPassword = function(password, next) {
  scrypt.verifyHash(this.passhash, password, function(err, result) {
    if (!err) {
      next(result);
    } else {
      next(false);
    }
  });
}

module.exports = mongoose.model('User', userSchema, 'users');
