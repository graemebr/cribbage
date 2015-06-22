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
//text colours
var colors = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange'];
//randomize colors
colors.sort(function(a, b) {
    return Math.random() > 0.5;
});

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
    var userColor = false;

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
            //process WebSocket message
            if (userName === false) {
                //client is sending username
                userName = message.utf8Data;

                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({
                    type: 'color',
                    data: userColor
                }));

                console.log('userName: ' + userName + ' color: ' + userColor);
            } else {
                //client sending message
                console.log((new Date()) + ' ' + userName + " : " + message.utf8Data);

                var messageObj = {
                    time: (new Date()).getTime(),
                    text: message.utf8Data,
                    author: userName,
                    color: userColor
                };
                history.push(messageObj);
                history = history.slice(-100);

                //send message to clients
                var json = JSON.stringify({
                    type: 'message',
                    data: messageObj
                });
                for (var i = 0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });

    connection.on('close', function(con) {
        //user connection closed
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Client " + connection.remoteAddress + " disconnected");
            //remove client from array
            clients.splice(clients.indexOf(connection), 1);
            // return user color to pool
            colors.push(userColor);
        }
    });
});

console.log((new Date()) + ' game server started');