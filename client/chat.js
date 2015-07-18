function chat() {
    var chatWindow = document.getElementById("chatWindow");

    var handleChatSubmit = function(msg) {
        if (!msg) {
            return false;
        }

        subpub.emit('toServer', {
            event: 'chat',
            data: msg
        });

        $('#chatPanel input')[0].value = '';
        $('#chatPanel input')[0].focus();
        $('#chatPanel input')[0].disabled = true;
    };

    var addMessage = function(author, text) {
        var nameNode = document.createElement('span');
        nameNode.setAttribute('class', 'name');
        nameNode.appendChild(document.createTextNode(author + ': '));
        var messageNode = document.createElement('p');
        messageNode.appendChild(nameNode);
        messageNode.appendChild(document.createTextNode(text));
        chatWindow.appendChild(messageNode);

        chatWindow.scrollTop = chatWindow.scrollHeight;

        $('#chatPanel input')[0].disabled = false;
    };

    var chatHistory = subpub.on('server/chatHistory', function(history) {
        for (var i = 0; i < history.length; i++) {
            addMessage(history[i].author, history[i].text);
        }
    });

    var chatMessage = subpub.on('server/chatMessage', function(msgData) {
        addMessage(msgData.author, msgData.text);
    });

    var chatAlert = subpub.on('chatAlert', function(data) {
        var messageNode = document.createElement('p');
        messageNode.appendChild(document.createTextNode(data.msg));
        messageNode.setAttribute('class', data.cssClass);
        chatWindow.appendChild(messageNode);

        chatWindow.scrollTop = chatWindow.scrollHeight;
    });

    $('#chatPanel input').keydown(function(event) {
        if (event.keyCode === 13) { //enter key
            handleChatSubmit(this.value);
            event.preventDefault();
        }
    });

    $('#chatPanel button').click(function(event) {
        handleChatSubmit($('#chatPanel input')[0].value);
        event.preventDefault();
    });
}

subpub.on('onload', chat);