var subpub = require('./subpub');
var clients = require('./clients');

module.exports = (function() {
    var chatHistory = [];

    var addToHistory = function(msg) {
        chatHistory.push(msg);
        chatHistory = chatHistory.slice(-100);
    };

    subpub.on('client/chat', function(clientId, msg) {
        //send chat to clients and add to history

        var chatMessage = {
            author: clients.getName(clientId),
            text: msg
        };

        console.log(chatMessage.author + " : " + chatMessage.text);

        addToHistory(chatMessage);

        subpub.emit('toAllClients', {
            event: 'chatMessage',
            data: chatMessage
        });
    });

    subpub.on('newClient', function(clientId) {
        //send chatHistory to new client
        if (chatHistory.length > 0) {
            subpub.emit('toClient', clientId, {
                event: 'chatHistory',
                data: chatHistory
            });
        }
    });
})();