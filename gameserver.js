//set the process name (for use with commands like 'ps')
process.title = 'gameserver';

//modules
var WebSocketServer = require('websocket').server;
var http = require('http');

//optionally run server with a port specified on the command line
var webSocketsServerPort = 1337;
if (process.argv[2])
    webSocketsServerPort = process.argv[2];

//chat example variables
//hitory of messages
var history = [];
//clients
var clients = [];

//http server
var server = http.createServer(function(request, response) {});
server.listen(webSocketsServerPort, function() {});

//WebSocket server
wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function(request) {
    console.log((new Date()) + ' connection from ' + request.origin);

    var connection = request.accept(null, request.origin);
    clients.push(connection);
    var userName = false;

    console.log((new Date()) + ' connection accepted');

    //send chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify({
            type: 'history',
            data: history
        }));
    }

    connection.on('message', function(message) {

        if (message.type === 'utf8') {
            var json;
            try {
                json = JSON.parse(message.utf8Data);
            } catch (e) {
                console.log("invalid JSON: ", message.utf8Data);
                return;
            }

            if (json.type === 'name') {
                userName = json.data;
                console.log('userName: ' + userName);
            } else if (json.type === 'chat') {
                //client sending message
                console.log((new Date()) + ' ' + userName + " : " + json.data);
                var messageObj = {
                    time: (new Date()).getTime(),
                    text: json.data,
                    author: userName
                };
                history.push(messageObj);
                history = history.slice(-100);

                //send message to clients
                var jsonMessage = JSON.stringify({
                    type: 'message',
                    data: messageObj
                });
                for (var i = 0; i < clients.length; i++) {
                    clients[i].sendUTF(jsonMessage);
                }
            }
        }
    });

    connection.on('close', function(con) {
        //user connection closed
        if (userName !== false) {
            console.log((new Date()) + " Client " + connection.remoteAddress + " disconnected");
            //remove client from array
            clients.splice(clients.indexOf(connection), 1);
        }
    });
});

console.log((new Date()) + ' game server started');