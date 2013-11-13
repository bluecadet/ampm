var express = require('express'); // Routing framework. http://expressjs.com/
var http = require('http'); // HTTP support. http://nodejs.org/api/http.html
var fs = require('node-fs'); // Recursive directory creation. https://github.com/bpedro/node-fs
var osc = require('node-osc'); // OSC server. https://github.com/TheAlphaNerd/node-osc
var _ = require('underscore'); // Utilities. http://underscorejs.org/
var Backbone = require('backbone'); // Data model utilities. http://backbonejs.org/

// Load config file.
try {
    global.config = JSON.parse(fs.readFileSync('./config.json'));
} catch (error) {
    console.log("Couldn't load config file.");
    console.log(error);
}

// Set up server.
var app = express();
var server = http.createServer(app);
global.io = require('socket.io').listen(server);
io.set('log level', 2);
server.listen(3000);

// Set up models.
var ServerState = require('./model/serverState.js').ServerState;
var serverState = new ServerState();

// Set up view routing.
app.use('/static', express.static(__dirname + '/view'));
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/view/index.html');
});

// Set up OSC routing.
var oscServer = new osc.Server(3001);
oscServer.on('message', function(msg, rinfo) {
    // Forward messages to the UI.
    var parts = msg[0].split('/');
    parts.shift();
    var action = parts[0];

    var message = {};
    while (parts.length) {
        var key = parts.shift();
        var val = parts.shift();
        var f = parseFloat(val);
        message[key] = isNaN(f) ? val : f;
    }

    serverState.onOSC(action, message);
});

// Update clients by sending the whole state every frame.
// TODO: This sort of sucks. It would be nice to do some fancier syncing.
io.sockets.on('connection', function(socket) {
    socket.on('getServerState', function(message) {
        socket.emit('serverState', serverState.xport());
    });
});

///// Comm
// Pull model -- client requests frame, requests again after it gets it
// Server-to-app: send state, also pull model?

///// Support multiple clients
// Each client connects with a config, including its network path for updating content

///// Updater
// Kill/start button
// Update button: kill process, update content, update client, restart client
// Update server
// Support to update from non-web location

///// App controller
// Monitor process
// Restart on hang
// Give up restart after n times

///// Server
// Schedule content update (shut down before, restart after)
// Schedule shutdown/restart
// Run as service? https://npmjs.org/package/node-windows

///// Logger
// Server listens to events from updater/controller and sends those to logger
// Logger listens on a port for log messages

///// Monitor
// Monitor listens on a port for monitor messages
// Revisit ICE for patterns

///// UI
// shut down / start (toggle)
// update (show progress)
// Display monitor status
// Display recent logs
// Memory/CPU usage https://github.com/markitondemand/node-perfmon

///// Central UI
// Forward all messages to another instance of server?
// UI displays all inputs at once?
// Send commands (shutdown etc) back to clients?

///// Plugin for custom app logic
// Short term -- extend serverState class
// Long term -- define a set of properties/types/intervals to keep in sync across clients.

///// Analytics
// Hook into analytics service? Or log analysis tool?

///// V.next
// Try to reduce export payload
