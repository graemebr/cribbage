var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function (request, response) {
    //http stuff, nothing
});
server.listen(1337, function() { });

wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function(request) {
    console.log('request received');
    var connection = request.accept(null, request.origin);

    connection.on('message', function(message) {
        if(message.type === 'utf8') {
            //process WebSocket message
            console.log('message received');
        }
    });

    connection.on('close', function (connection) {
        //close user connection
        console.log('connection closed');
    });
});

console.log('started app');