module.exports = SimpleApp

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var compression = require('compression');
var csrf = require('csurf');
var debug = require('debug')('simple-app');
var errorHandler = require('errorhandler');
var express = require('express');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var fs = require('fs');
var http = require('http');
var jade = require('jade');
var mongoose = require('mongoose');
var path = require('path');
var passport = require('passport');
var passport_local = require('passport-local');
var session = require('express-session');

// Store for session data
// HACK: See https://github.com/kcbanner/connect-mongo/issues/109
var MongoStore = require('connect-mongo')({ session: session });

var config = require('../config');
var User = require('./models').User;
var util = require('./util');

function SimpleApp (opts, cb) {
  var self = this;

  self.name = (opts && opts.name) || 'SimpleApp';
  self.port = opts && opts.port;
  self.cookieSecret = (opts && opts.cookieSecret) || 'notsecret';

  self.start(cb);
}

SimpleApp.prototype.start = function (cb) {
  var self = this;

  // Set up the HTTP server.
  var app = express();
  self.app = app;
  self.server = http.createServer(app);

  app.disable('x-powered-by'); // disable advertising
  app.use(util.expressLogger(debug)); // readable logs
  app.use(compression()); // gzip
  app.use(expressValidator()); // validate user input
  app.use(bodyParser()); // parse POST parameters
  app.use(cookieParser(self.cookieSecret)); // parse cookies
  // manage session cookies
  app.use(session({
    store: new MongoStore({
      db: config.mongo.db,
      host: config.mongo.host,
      port: config.mongo.port,
      auto_reconnect: true
    }),
    secret: self.cookieSecret
  }));
  app.use(csrf()); // protect against CSRF
  app.use(passport.initialize()); // use passport for user auth
  app.use(passport.session()); // have passport use cookies for user auth
  app.use(flash()); // errors during login are propogated by passport using `req.flash`

  // Use jade for templating
  app.set('views', path.join(config.rootPath, '/views'));
  app.set('view engine', 'jade');

  // CSRF helper
  app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
  });

  // Setup passport
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
  passport.use(new passport_local.Strategy(User.authenticate()));

  function auth (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  }

  // Always set the `user` variable in the context of the templates
  // If no user is logged in, then it's `null`.
  app.use(function (req, res, next) {
    res.locals.user = req.user;
    next();
  });


  // Mongoose
  mongoose.set('debug', true);
  mongoose.connect('mongodb://' + config.mongo.host + '/' + config.mongo.db);

  // Routes

  app.get('/login', function (req, res) {
    if (req.user) {
      res.redirect('/');
    } else {
      res.render('login', {messages: req.flash('error')});
    }
  });

  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    successRedirect: '/',
    failureFlash: true
  }));

  app.post('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/signup', function (req, res) {
    if (req.user) {
      res.redirect('/');
    } else {
      res.render('signup', {messages: req.flash('error')});
    }
  });

  app.post('/signup', function (req, res, next) {

    req.assert('username', 'Not a valid email address').isEmail();
    req.assert('password', 'Password must be greater than 4 characters').len(4).notEmpty();

    var errors = req.validationErrors();
    if (errors) {
      errors.forEach(function (error) {
        req.flash('error', error.msg);
      })
      res.redirect('/signup');
      return;
    }

    // TODO: Handle different kinds of errors that passport-local-monogoose
    // throws in a user friendly way
    var username = req.body.username;
    var password = req.body.password;
    User.register(new User({username: username}), password, function (err, user) {
      if (err) {
        req.flash('error', err.name + ': ' + err.message);
        res.redirect('/signup');
      } else {
        passport.authenticate('local')(req, res, function () {
          res.redirect('/');
        });
      }
    });

  });

  app.get('/', function (req, res) {
    res.render('index');
  })

  // Static files
  app.use(express.static(path.join(config.rootPath, 'build')));

  // Call the callback so the subclass can implement its own routes
  // and add middleware or static files
  cb && cb();

  app.use(errorHandler());

  self.server.listen(self.port, function (err) {
    if (!err) {
      debug(self.name + ' started on port ' + self.port);
    } else {
      throw new Error(err);
    }
  });
}

SimpleApp.prototype.close = function (done) {
  var self = this;

  self.server.close(function (err) {
    if (!err) {
      debug(self.name + ' closed on port ' + self.port);
    }
    done && done(err);
  })
}
