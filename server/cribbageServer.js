//set the process name
process.title = 'cribbageServer';



var WebSocketServer = require('websocket').server;
var http = require('http');

var subpub = require('./subpub');
var games = require('./games');



//optionally run server with a port specified on the command line
//(port 1337 is hardcoded into client code currently)
var webSocketsServerPort = 1337;
if (process.argv[2])
    webSocketsServerPort = process.argv[2];

//http server
var server = http.createServer(function(request, response) {});
server.listen(webSocketsServerPort, function() {});

//WebSocket server
wsServer = new WebSocketServer({
    httpServer: server
});

//handle new WebSocket connection
wsServer.on('request', function(request) {
    console.log('connection from ' + request.origin);
    var connection = request.accept(null, request.origin); //TODO: check request origin
    subpub.emit('cribbageServer/newClient', connection);
    console.log('connection accepted');
});

console.log('game server started');