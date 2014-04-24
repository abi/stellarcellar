var fs = require('fs');
var path = require('path');

exports.rootPath = path.resolve(__dirname, '..');

exports.mongo = {
  db: 'stellarcellar',
  host: 'localhost',
  port: 27017
};


exports.s3 = {
  cors: fs.readFileSync(path.join(__dirname, 's3-cors.xml'), 'utf8')
};
