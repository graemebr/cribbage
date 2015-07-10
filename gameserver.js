//set the process name (for use with commands like 'ps')
process.title = 'gameserver';


//modules
var WebSocketServer = require('websocket').server;
var http = require('http');


//optionally run server with a port specified on the command line
var webSocketsServerPort = 1337;
if (process.argv[2])
    webSocketsServerPort = process.argv[2];


//chat
//history of messages
var chatHistory = [];

//list of clients
var clientIds = [];
var clientData = {};
var genPlayerId = 0;

//http server
var server = http.createServer(function(request, response) {});
server.listen(webSocketsServerPort, function() {});

//WebSocket server
wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function(request) {
    console.log((new Date()) + ' connection from ' + request.origin);

    var playerId = 'p' + genPlayerId++;
    clientData[playerId] = {
        connection: request.accept(null, request.origin),
        name: false
    };
    clientIds.push(playerId);

    console.log((new Date()) + ' connection accepted');

    //send connected players
    for (var i = 0; i < clientIds.length; i++) {
        var id = clientIds[i];
        if (clientData[id].name !== false) {
            clientData[playerId].connection.sendUTF(JSON.stringify({
                type: 'playerJoin',
                data: {
                    name: clientData[id].name,
                    id: id
                }
            }));
        }
    }

    //send chat chatHistory
    if (chatHistory.length > 0) {
        clientData[playerId].connection.sendUTF(JSON.stringify({
            type: 'chatHistory',
            data: chatHistory
        }));
    }

    clientData[playerId].connection.on('message', function(message) {

        if (message.type === 'utf8') {
            var json;
            try {
                json = JSON.parse(message.utf8Data);
            } catch (e) {
                console.log("invalid JSON: ", message.utf8Data);
                return;
            }

            if (json.type === 'name') {
                handleNameMessage(json.data);
            } else if (json.type === 'chat') {
                handleChatMessage(json.data);
            }
        }
    });

    clientData[playerId].connection.on('close', function(con) {
        //user connection closed
        console.log((new Date()) + " Client " + clientData[playerId].connection.remoteAddress + " disconnected");
        //remove client from clientIds
        clientIds.splice(clientIds.indexOf(playerId), 1);
        if(clientData[playerId].name !== false) {
            //remove from all clients
            for(var i = 0; i<clientIds.length; i++) {
                clientData[clientIds[i]].connection.sendUTF(JSON.stringify({
                    type: 'playerLeave',
                    data: {
                        name: clientData[playerId].name,
                        id: playerId
                    }
                }));
            }
        }
    });

    function handleNameMessage(name) {
        clientData[playerId].name = name;
        console.log('new user: ' + name);
        //send message to clients
        var json = JSON.stringify({
            type: 'playerJoin',
            data: {
                name: name,
                id: playerId
            }
        });
        for (var i = 0; i < clientIds.length; i++) {
            clientData[clientIds[i]].connection.sendUTF(json);
        }
    }

    function handleChatMessage(text) {
        console.log((new Date()) + ' ' + clientData[playerId].name + " : " + text);

        var chatMessage = {
            text: text,
            author: clientData[playerId].name
        };
        chatHistory.push(chatMessage);
        chatHistory = chatHistory.slice(-100);

        //send message to clients
        var json = JSON.stringify({
            type: 'chatMessage',
            data: chatMessage
        });
        for (var i = 0; i < clientIds.length; i++) {
            clientData[clientIds[i]].connection.sendUTF(json);
        }
    }
});

console.log((new Date()) + ' game server started');