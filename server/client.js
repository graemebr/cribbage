//creates unique clientIds
var genclientId = 0;

function Client(connection, section) {
    this.connection = connection;
    this.section = section;
    this.clientId = 'p' + (++genclientId);
    this.name = "";
    this.boundOnMessage = this.onMessage.bind(this);
    this.boundOnClientMessage = this.onClientMessage.bind(this);

    this.connection.on('message', this.boundOnMessage);
    this.connection.once('close', this.onClose.bind(this));
    this.addSectionListeners();

    this.section.emit(this.clientId, {
        event: 'clientId',
        data: this.clientId
    });
}

Client.prototype.onClientMessage = function(obj) {
    this.connection.sendUTF(JSON.stringify(obj));
};

Client.prototype.onMessage = function(message) {
    if (message.type === 'utf8') {
        var json;
        try {
            json = JSON.parse(message.utf8Data);
        } catch (e) {
            console.log("invalid JSON: ", message.utf8Data);
            return;
        }
        this.section.emit('client/' + json.event, this.clientId, json.data);
    }
};

Client.prototype.onClose = function(connection) {
    //user connection closed
    console.log("Client " + this.connection.remoteAddress + " disconnected");
    this.connection.removeListener('message', this.boundOnMessage);
    this.removeSectionListeners();
    this.section.emit('client/clientClose', this.clientId);
};

Client.prototype.addSectionListeners = function() {
    if (this.section) {
        this.section.on(this.clientId, this.boundOnClientMessage);
        this.section.on('allClients', this.boundOnClientMessage);
    }
};

Client.prototype.removeSectionListeners = function() {
    if (this.section) {
        this.section.removeListener(this.clientId, this.boundOnClientMessage);
        this.section.removeListener('allClients', this.boundOnClientMessage);
    }
};

Client.prototype.setSection = function(section) {
    this.removeSectionListeners();
    this.section = section;
    this.addSectionListeners();
};

module.exports = Client;