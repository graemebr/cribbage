window.onload = function() {
    var handleLoginSubmit = function(msg) {
        if (!msg) {
            return false;
        }

        subpub.publish('server', {
            type: 'name',
            data: msg
        });

        $('#chooseNamePanel input')[0].value = '';

        //hide login/name choosing screen
        $('#chooseNamePanel').hide();
        //show main game screens
        $('#gameCanvas').show();
        $('#sidePanel').show();
    };

    var handleChatSubmit = function(msg) {
        if (!msg) {
            return false;
        }

        subpub.publish('server', {
            type: 'chat',
            data: msg
        });

        $('#chatPanel input')[0].value = '';
        $('#chatPanel input')[0].disabled = true;
    };


    $('#chooseNamePanel input').keydown(function(event) {
        if (event.keyCode === 13) { //enter key
            handleLoginSubmit(this.value);
        }
    });


    $('#chooseNamePanel button').click(function(event) {
        handleLoginSubmit($('#chooseNamePanel input')[0].value);
    });


    $('#chatPanel input').keydown(function(event) {
        if (event.keyCode === 13) { //enter key
            handleChatSubmit(this.value);
        }
    });

    $('#chatPanel button').click(function(event) {
        handleChatSubmit($('#chatPanel input')[0].value);
        $('#chatPanel input')[0].focus(); //PUT THIS IN HANDLE , MAYBE CHANGE keydown to keypress?
    });



    //chat window
    var chatWindow = document.getElementById("chatWindow");

    var chatMessage = subpub.subscribe('chatMessage', function(msgData) {
        var nameNode = document.createElement('span');
        nameNode.setAttribute('class', 'name');
        nameNode.appendChild(document.createTextNode(msgData.author + ': '));
        var messageNode = document.createElement('p');
        messageNode.appendChild(nameNode);
        messageNode.appendChild(document.createTextNode(msgData.text));
        chatWindow.appendChild(messageNode);

        chatWindow.scrollTop = chatWindow.scrollHeight;

        $('#chatPanel input')[0].disabled = false;
    });

    var chatAlert = subpub.subscribe('chatAlert', function(data) {
        var messageNode = document.createElement('p');
        messageNode.appendChild(document.createTextNode(data.msg));
        messageNode.setAttribute('class', data.cssClass);
        chatWindow.appendChild(messageNode);

        chatWindow.scrollTop = chatWindow.scrollHeight;
    });


    var loginScreen = subpub.subscribe('loginScreen', function() {
        //hide connecting screen
        $('#connecting').hide();
        //show login screen
        $('#chooseNamePanel').show();
    });

    var errorScreen = subpub.subscribe('errorScreen', function() {
        $('#connecting').show();
        $('#connecting').text("error connecting to server");
    });

    if (!('WebSocket' in window)) {
        console.log('websockets not supported');
        return;
    }

    var connection = new WebSocket('ws://52.24.149.122:1337');

    connection.onopen = function() {
        console.log('connection open!');
        subpub.publish('loginScreen');
    };

    connection.onclose = function() {
        console.log('connection closed');
    };

    connection.onerror = function(error) {
        console.log('connection error!');
        subpub.publish('errorScreen');
    };

    connection.onmessage = function(message) {
        //try to parse JSON message
        var msg;
        try {
            msg = JSON.parse(message.data);
        } catch (e) {
            console.log("invalid JSON: ", message.data);
            return;
        }

        switch (msg.type) {
            case 'chatHistory':
                for (var i = 0; i < msg.data.length; i++) {
                    subpub.publish('chatMessage',msg.data[i]);
                }
                break;
            case 'chatMessage':
                subpub.publish('chatMessage',msg.data);
                break;
            case 'playerJoin':
                var playerName = document.createElement('li');
                playerName.appendChild(document.createTextNode(msg.data.name));
                playerName.style.display = 'none';
                playerName.setAttribute('id', msg.data.id);
                console.log(msg.data.id);
                $('#playersPanel ul').append(playerName);
                $('#' + msg.data.id).fadeIn('slow');
                subpub.publish('chatAlert', {
                    msg: msg.data.name + ' connected',
                    cssClass: 'notice'
                });
                break;
            case 'playerLeave':
                $('#' + msg.data.id).fadeOut('slow');
                subpub.publish('chatAlert', {
                    msg: msg.data.name + ' disconnected',
                    cssClass: 'error'
                });
                break;
        }
    };

    var server = subpub.subscribe('server', function(obj) {
        connection.send(JSON.stringify(obj));
    });
};