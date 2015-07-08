window.onload = function() {
    //do stuff here if you want

    var content = document.getElementById("content");
    var status = document.getElementById("status");
    var input = document.getElementById("input");

    var myColor = false;
    var myName = false;


    if (!('WebSocket' in window)) {
        console.log('websockets not supported');
        return;
    }

    //websocket is supported!
    var connection = new WebSocket('ws://52.24.149.122:1337');
    connection.onopen = function() {
        console.log('connection open!');
        input.disabled = false;
        status.textContent = 'Choose name:';
    };
    connection.onclose = function() {
        console.log('connection closed');
    };
    connection.onerror = function(error) {
        console.log('Error detected: ' + error);
        var errorNode = document.createElement('p');
        var t = document.createTextNode('error connecting to server');
        errorNode.appendChild(t);
        content.appendChild(errorNode);
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

        if (json.type === 'color') {
            myColor = json.data;
            //setup status
            status.textContent = myName;
            //TODO change colour
            input.disabled = false;
        } else if (json.type === 'history') {
            for (var i = 0; i < json.data.length; i++) {
                addMessage(json.data[i]);
            }
        } else if (json.type === 'message') {
            addMessage(json.data);
            input.disabled = false;
        }
    };

    input.onkeypress = function(event) {
        if (event.keyCode === 13) {
            //enter key
            var msg = this.value;
            if (!msg) {
                return;
            }

            connection.send(msg);

            if(myName === false) {
                myName = msg;
            }

            this.value = '';
            input.disabled = true;
        }
    };

    function addMessage(msgData) {
        var messageNode = document.createElement('p');
        // var t = document.createTextNode(msgData.time + '\t' + msgData.author + ': ' + msgData.text);
        var t = document.createTextNode(msgData.author + ': ' + msgData.text);
        messageNode.appendChild(t);
        //content.insertBefore(messageNode, content.firstChild);
        content.appendChild(messageNode);
    }
};