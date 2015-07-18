//set the process name
process.title = 'gameserver';



//modules
var WebSocketServer = require('websocket').server;
var http = require('http');
var clients = require('./clients');
var chat = require('./chat');



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
    clients.add(request.accept(null, request.origin)); //TODO: check request origin
    console.log('connection accepted');
});

console.log('game server started');