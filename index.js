var debug = require('debug')('test-app');
var path = require('path');
var SimpleApp = require('./server/SimpleApp');

function App () {
  var self = this;

  var opts = {
    name: 'Simple App',
    port: 9000,
    cookieSecret: 'secret' // TODO: Get a better secret for the cookie
  };

  // Call the parent constructor
  SimpleApp.call(self, opts, self.init.bind(self));
}
App.prototype = Object.create(SimpleApp.prototype);

/* Setup app-specific routes and middleware */
App.prototype.init = function () {
  var self = this;
  var app = self.app;

  app.get('/files', function (req, res) {
    res.render('files');
  });
};

/* Start the app */
new App();
