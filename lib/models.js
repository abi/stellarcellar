var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var User = new mongoose.Schema({
    username: String,
    passphrase: String,
    publicKey: String,
    privateKey: String
});

User.plugin(passportLocalMongoose);

module.exports = {
  User: mongoose.model('User', User)
};
