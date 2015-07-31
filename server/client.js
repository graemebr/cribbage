module.exports = function(connection, section, clientId) {
    this.section = section;
    this.name = "";
    this.clientId = clientId;

    var self = this;

    function onClientMessage(obj) {
        connection.sendUTF(JSON.stringify(obj));
    }

    function onMessage(message) {
        if (message.type === 'utf8') {
            var json;
            try {
                json = JSON.parse(message.utf8Data);
            } catch (e) {
                console.log("invalid JSON: ", message.utf8Data);
                return;
            }
            // console.log('emit: client/' + json.event);
            self.section.emit('client/' + json.event, clientId, json.data);
        }
    }
    connection.on('message', onMessage);

    function onClose(con) {
        //user connection closed
        console.log("Client " + connection.remoteAddress + " disconnected");
        connection.removeListener('message', onMessage);
        removeListeners();
        self.section.emit('client/clientClose', clientId);
    }
    connection.once('close', onClose);

    function onLogin(clientId, name) {
        if (clientId === self.clientId) {
            self.name = name;
        }
    }

    function onPlayerJoin(clientId) {
        if(clientId !== self.clientId) {
            self.section.emit(clientId, {
                event: 'playerJoin',
                data: {
                    name: self.name,
                    clientId: self.clientId
                }
            });
        } else {
            self.section.emit('allClients', {
                event: 'playerJoin',
                data: {
                    name: self.name,
                    clientId: self.clientId
                }
            });
        }
    }

    function onPlayerLeave(clientId, name) {
        self.section.emit(self.clientId, {
            event: 'playerLeave',
            data: {
                clientId: clientId,
                name: name
            }
        });
    }

    function removeListeners() {
        self.section.removeListener(clientId, onClientMessage);
        self.section.removeListener('allClients', onClientMessage);
        self.section.removeListener('game/playerJoin', onPlayerJoin);
        self.section.removeListener('client/login', onLogin);
        self.section.removeListener('game/playerLeave', onPlayerLeave);
    }

    function addListeners() {
        self.section.on(clientId, onClientMessage);
        self.section.on('allClients', onClientMessage);
        self.section.on('game/playerJoin', onPlayerJoin);
        self.section.on('client/login', onLogin);
        self.section.on('game/playerLeave', onPlayerLeave);
    }

    this.setSection = function(section) {
        removeListeners();
        self.section = section;
        addListeners();
    };

    this.setSection(section);

    this.section.emit(clientId, {
        event: 'clientId',
        data: clientId
    });
};