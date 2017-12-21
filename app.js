"use strict";

/*
 * Main application file
 *
 */

//All Module Requires.
const express = require('express')
  , path = require('path')
  , morgan = require('morgan')
  , logger = require('./helpers/custom_console_logger')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , basicAuth = require('express-basic-auth')
  , helmet = require('helmet')
  , sanitizer = require('express-sanitized')
  , cluster = require('cluster')
  , customMiddleware = require('./helpers/custom-middleware')
  , http = require('http');
;

morgan.token('id', function getId (req) {
  return req.id;
});

//All the requires.
const rootPrefix    = "."
  , coreConstants   = require( rootPrefix + '/config/core_constants' )
  , responseHelper  = require( rootPrefix + '/lib/formatter/response')
  , indexRoutes     = require( rootPrefix + '/routes/index')
  , btRoutes        = require( rootPrefix + '/routes/bt')
  , config          = require( coreConstants.OST_MEMBER_CONFIG_FILE_PATH )
;

console.log( "config file path:", coreConstants.OST_MEMBER_CONFIG_FILE_PATH );


if (cluster.isMaster) {
  // Set worker process title
  process.title = "OpenST-Platform node master";

  // Fork workers equal to number of CPUs
  const numCPUs = require('os').cpus().length;

  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Worker started listening and is ready
  cluster.on('listening', function(worker, address) {
    logger.info(`[worker-${worker.id} ] is listening`);
  });

  // Worker came online. Will start listening shortly
  cluster.on('online', function(worker) {
    logger.info(`[worker-${worker.id}] is online`);
  });

  // When someone try to kill the worker
  cluster.on('disconnect', function(worker) {
    logger.error(`[worker-${worker.id}] is disconnected`);
  });

  // When worker existed
  cluster.on('exit', function(worker, code, signal) {
    if (worker.exitedAfterDisconnect === true) {
      // don't restart worker as voluntary exit
      logger.info(`[worker-${worker.id}] voluntary exit. signal: ${signal}. code: ${code}`);
    } else {
      // restart worker as died unexpectedly
      logger.error(`[worker-${worker.id}] restarting died. signal: ${signal}. code: ${code}`, worker.id, signal, code);
      cluster.fork();
    }
  });

  // When someone try to kill the master process
  // kill <master process id>
  process.on('SIGTERM', function() {
    for (var id in cluster.workers) {
      cluster.workers[id].exitedAfterDisconnect = true;
    }
    cluster.disconnect(function() {
      logger.info('Master received SIGTERM. Killing/disconnecting it.');
    });
  });

} else if (cluster.isWorker) {

  // Set worker process title
  process.title = "OpenST-Platform node worker-"+cluster.worker.id;

  //Constants
  const app = express();

  app.use(customMiddleware({worker_id: cluster.worker.id}));
  app.use(morgan(':id :remote-addr - :remote-user [:date[clf]] :method :url :response-time HTTP/:http-version" :status :res[content-length] :referrer :user-agent'));
  app.use(helmet());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(cookieParser());

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
    member.Route = "/bt" + member.Route;
    console.log("Mounting branded token", member.Name, "on", member.Route, "on Worker", cluster.worker.id);
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

  /**
   * Get port from environment and store in Express.
   */

  var port = normalizePort(process.env.PORT || '3000');
  app.set('port', port);

  /**
   * Create HTTP server.
   */

  var server = http.createServer(app);

  /**
   * Listen on provided port, on all network interfaces.
   */

  server.listen(port, 443);
  server.on('error', onError);
  server.on('listening', onListening);

}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
}
