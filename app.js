"use strict";

/*
 * Main application file
 *
 */
const express = require('express')
  , path = require('path')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , basicAuth = require('express-basic-auth')
  , helmet = require('helmet')
  , sanitizer = require('express-sanitized')
  , app = express()
  , config = require('./config.json')
  , responseHelper = require('./lib/formatter/response')
  , indexRoutes = require('./routes/index')
  , btRoutes = require('./routes/bt');

// uncomment after placing your favicon in /public
//app.use(favicon(Path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('combined'));
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*
  The below peice of code should always be before routes.
  Docs: https://www.npmjs.com/package/express-sanitized
*/
app.use(sanitizer());

// load index routes
app.use('/', indexRoutes);

// Mount member company routes
for (var key in config.Members) {
  const member = config.Members[key];
  member.Route = "/bt" + member.Route
  console.log("Mounting branded token", member.Name, "on", member.Route);
  app.use(member.Route, basicAuth(member.ApiAuth), new btRoutes(member));
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  return responseHelper.error('404', 'Not Found').renderResponse(res, 404);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  console.error(err);
  return responseHelper.error('500', 'Something went wrong').renderResponse(res, 500);
});

module.exports = app;
