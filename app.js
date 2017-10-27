const Express = require('express');
const Path = require('path');
//const favicon = require('serve-favicon');
const Logger = require('morgan');
const CookieParser = require('cookie-parser');
const BodyParser = require('body-parser');
const BasicAuth = require('express-basic-auth');

const Index = require('./routes/index');
const ERC20 = require('./lib/erc20contract');
const BT = require('./routes/bt');

const Config = require('./config.json');

const BrandedTokenJson = require("./contracts/BrandedToken.json");
const BrandedTokenContract = BrandedTokenJson.contracts['BrandedToken.sol:BrandedToken'];

const NDEBUG = process.env.npm_package_scripts_start === undefined;

var app = Express();

// view engine setup
app.set('views', Path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(Path.join(__dirname, 'public', 'favicon.ico')));
app.use(Logger('dev'));
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: false }));
app.use(CookieParser());
app.use(Express.static(Path.join(__dirname, 'public')));
app.use('/', Index);

for (var key in Config.Members) {
  const member = Config.Members[key];
  console.log("Mounting branded token", member.Name, "on", member.Route);
  const callback = NDEBUG ? member.Callback : "http://localhost:3000/transaction";
  const erc20 = new ERC20(member.Reserve, BrandedTokenContract, member.ERC20);
  app.use(member.Route, BasicAuth(member.ApiAuth), new BT(erc20, callback, member.CallbackAuth));
}

// debug transaction callback handler
app.post('/transaction', function(req, res, next) {
  console.log(req.body);
});

// catch 404
app.use(function(req, res, next) {
  res.locals.error = {}
  res.locals.message = 'Not Found';
  res.status(404).render('error')
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.error(err.stack);
  res.status(err.status || 400).json({error: err.message});
});

module.exports = app;
