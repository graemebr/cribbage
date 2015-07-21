var subpub = require('./subpub');

module.exports = (function() {
    var clientIds = [];
    var clientData = {};
    var genclientId = 0;

    var forEachClient = function(func) {
        //execute func for each clientId
        for (var i = 0; i < clientIds.length; i++) {
            func(clientIds[i]);
        }
    };

    subpub.on('toAllClients', function(obj) {
        //send obj to each client
        var json = JSON.stringify(obj);
        for (var i = 0; i < clientIds.length; i++) {
            clientData[clientIds[i]].connection.sendUTF(json);
        }
    });

    subpub.on('toClient', function(clientId, obj) {
        //send obj to clientId
        clientData[clientId].connection.sendUTF(JSON.stringify(obj));
    });

    subpub.on('newClient', function(clientId) {
        //send the new client a list of all named clients
        //(not clients who haven't logged in yet)
        forEachClient(function(id) {
            if (clientData[id].name !== false) {
                subpub.emit('toClient', clientId, {
                    event: 'playerJoin',
                    data: {
                        name: clientData[id].name,
                        id: id
                    }
                });
            }
        });
    });

    subpub.on('client/name', function(clientId, name) {
        //set player's name
        clientData[clientId].name = name;
        console.log('new user: ' + name);
        //send message to clients
        subpub.emit('toAllClients', {
            event: 'playerJoin',
            data: {
                name: name,
                id: clientId
            }
        });
        subpub.emit('playerJoin', {
            name: name,
            id: clientId
        });
    });

    return ({
        add: function(connection) {
            //add connection to clientData
            var clientId = 'p' + genclientId++;
            clientData[clientId] = {
                connection: connection,
                name: false
            };
            //add clientId to list of connected clients
            clientIds.push(clientId);

            //callbacks for connection events
            connection.on('message', function(message) {
                if (message.type === 'utf8') {
                    var json;
                    try {
                        json = JSON.parse(message.utf8Data);
                    } catch (e) {
                        console.log("invalid JSON: ", message.utf8Data);
                        return;
                    }
                    subpub.emit('client/' + json.event, clientId, json.data);
                }
            });

            connection.on('close', function(con) {
                //user connection closed
                console.log("Client " + clientData[clientId].connection.remoteAddress + " disconnected");

                //remove client from clientIds
                clientIds.splice(clientIds.indexOf(clientId), 1);
                if (clientData[clientId].name !== false) {
                    //remove from all clients
                    subpub.emit('toAllClients', {
                        event: 'playerLeave',
                        data: {
                            name: clientData[clientId].name,
                            id: clientId
                        }
                    });
                    subpub.emit('playerLeave', {
                        name: clientData[clientId].name,
                        id: clientId
                    });
                }
            });

            subpub.emit('toClient', clientId, {
                event: 'clientId',
                data: clientId
            });
            subpub.emit('newClient', clientId);
        },

        forEach: forEachClient,

        getName: function(clientId) {
            return clientData[clientId].name;
        }
    });
})();