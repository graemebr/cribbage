window.onload = function() {
    //do stuff here if you want

    var chatWindow = document.getElementById("chatWindow");

    // var myColor = false;
    var myName = false;


    if (!('WebSocket' in window)) {
        console.log('websockets not supported');
        return;
    }

    //websocket is supported!
    var connection = new WebSocket('ws://52.24.149.122:1337');
    connection.onopen = function() {
        console.log('connection open!');
        //hide connecting screen
        $('#connecting').hide();
        //show login/name choosing screen
        $('#chooseNamePanel').show();
    };
    connection.onclose = function() {
        console.log('connection closed');
    };
    connection.onerror = function(error) {
        $('#connecting').text("error connectin to server");
        // //hide connecting screen
        // $('#connecting').hide();
        // //show login/name choosing screen
        // $('#chooseNamePanel').show();
    };
    connection.onmessage = function(message) {
        //try to parse JSON message
        var json;
        try {
            json = JSON.parse(message.data);
        } catch (e) {
            console.log("invalid JSON: ", message.data);
            return;
        }

        if (json.type === 'chatHistory') {
            for (var i = 0; i < json.data.length; i++) {
                addChatMessage(json.data[i]);
            }
        } else if (json.type === 'chatMessage') {
            addChatMessage(json.data);
            $('#chatPanel input')[0].disabled = false;
        } else if (json.type === 'playerJoin') {
            var playerName = document.createElement('li');
            playerName.appendChild(document.createTextNode(json.data.name));
            playerName.style.display = 'none';
            playerName.setAttribute('id', json.data.id);
            console.log(json.data.id);
            $('#playersPanel ul').append(playerName);
            $('#' + json.data.id).fadeIn('slow');
            addMessage(json.data.name + ' connected', 'notice');
        } else if (json.type === 'playerLeave') {
            $('#'+json.data.id).fadeOut('slow');
            addMessage(json.data.name + ' disconnected', 'error');
        }
    };

    $('#chooseNamePanel input').keydown(function(event) {
        if (event.keyCode === 13) {
            //enter key

            var msg = this.value;
            if (!msg) {
                return false;
            }

            myName = msg;
            var jsonMessage = JSON.stringify({
                type: 'name',
                data: msg
            });
            connection.send(jsonMessage);

            this.value = '';

            //hide login/name choosing screen
            $('#chooseNamePanel').hide();
            //show main game screens
            $('#gameCanvas').show();
            $('#sidePanel').show();
        }
    });

    $('#chooseNamePanel button').click(function(event) {
        console.log("Clicked!!");
        var msg = $('#chooseNamePanel input')[0].value;
        if (!msg) {
            return false;
        }

        myName = msg;
        var jsonMessage = JSON.stringify({
            type: 'name',
            data: msg
        });
        connection.send(jsonMessage);

        $('#chooseNamePanel input')[0].value = '';

        //hide login/name choosing screen
        $('#chooseNamePanel').hide();
        //show main game screens
        $('#gameCanvas').show();
        $('#sidePanel').show();
    });

    $('#chatPanel input').keydown(function(event) {
        if (event.keyCode === 13) {
            //enter key
            var msg = this.value;
            if (!msg) {
                return false;
            }

            var jsonMessage = JSON.stringify({
                type: 'chat',
                data: msg
            });
            connection.send(jsonMessage);

            this.value = '';
            $('#chatPanel input')[0].disabled = true;
        }
    });

    $('#chatPanel button').click(function(event) {
        var msg = $('#chatPanel input')[0].value;
        if (!msg) {
            return false;
        }

        var jsonMessage = JSON.stringify({
            type: 'chat',
            data: msg
        });
        connection.send(jsonMessage);

        $('#chatPanel input')[0].value = '';
        $('#chatPanel input')[0].focus();
        $('#chatPanel input')[0].disabled = true;
    });

    function addChatMessage(msgData) {
        var nameNode = document.createElement('span');
        nameNode.setAttribute('class', 'name');
        nameNode.appendChild(document.createTextNode(msgData.author + ': '));
        var messageNode = document.createElement('p');
        messageNode.appendChild(nameNode);
        messageNode.appendChild(document.createTextNode(msgData.text));
        chatWindow.appendChild(messageNode);

        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function addMessage(msg, cssClass) {
        var messageNode = document.createElement('p');
        messageNode.appendChild(document.createTextNode(msg));
        messageNode.setAttribute('class', cssClass);
        chatWindow.appendChild(messageNode);

        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
};