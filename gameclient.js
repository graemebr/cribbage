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

        if (json.type === 'history') {
            for (var i = 0; i < json.data.length; i++) {
                addMessage(json.data[i]);
            }
        } else if (json.type === 'message') {
            addMessage(json.data);
            $('#chatPanel input')[0].disabled = false;
        }
    };

    $('#chooseNamePanel input').keydown(function(event) {
        if (event.keyCode === 13) {
            //enter key

            var msg = this.value;
            if (!msg) {
                return;
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
            return;
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
                return;
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
            return;
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

    function addMessage(msgData) {
        var messageNode = document.createElement('p');
        // var t = document.createTextNode(msgData.time + '\t' + msgData.author + ': ' + msgData.text);
        var t = document.createTextNode(msgData.author + ': ' + msgData.text);
        messageNode.appendChild(t);
        //content.insertBefore(messageNode, content.firstChild);
        chatWindow.appendChild(messageNode);

        chatWindow.scrollTop = chatWindow.scrollHeight;

    }
};