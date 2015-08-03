function Chat(section) {
    this.history = [];
    this.section = section;

    this.section.on('client/chat', this.onChat.bind(this));
    this.section.on('game/playerJoin', this.onPlayerJoin.bind(this));
}

Chat.prototype.onPlayerJoin = function(clientId) {
    //send history to new client
    if (this.history.length > 0) {
        this.section.emit(clientId, {
            event: 'chatHistory',
            data: this.history
        });
    }
};

Chat.prototype.onChat = function(clientId, message) {
    //send chat to clients and add to history
    console.log(message.author + " : " + message.text);

    this.addToHistory(message);

    this.section.emit('allClients', {
        event: 'chatMessage',
        data: message
    });
};

Chat.prototype.addToHistory = function(message) {
    this.history.push(message);
    this.history = this.history.slice(-100);
};

module.exports = Chat;