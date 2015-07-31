// var clients = require('./clients');

module.exports = function(section) {
    var chatHistory = [];

    var addToHistory = function(msg) {
        chatHistory.push(msg);
        chatHistory = chatHistory.slice(-100);
    };

    section.on('client/chat', function(clientId, chatMessage) {
        //send chat to clients and add to history
        console.log(chatMessage.author + " : " + chatMessage.text);

        addToHistory(chatMessage);

        section.emit('allClients', {
            event: 'chatMessage',
            data: chatMessage
        });
    });

    section.on('game/playerJoin', function(clientId) {
        //send chatHistory to new client
        if (chatHistory.length > 0) {
            section.emit(clientId, {
                event: 'chatHistory',
                data: chatHistory
            });
        }
    });
};