//setup websocket connection with server!
//ons to server events
//emites events from the server

subpub.on('onload', function() {
    if (!('WebSocket' in window)) {
        console.log('websockets not supported');
        return;
    }

    var connection = new WebSocket('ws://52.24.149.122:1337');

    connection.onopen = function() {
        console.log('connection open!');
        subpub.emit('loginScreen');
    };

    connection.onclose = function() {
        console.log('connection closed');
    };

    connection.onerror = function(error) {
        console.log('connection error!');
        subpub.emit('errorScreen');
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
        subpub.emit('server/' + msg.event, msg.data);
    };

    var server = subpub.on('toServer', function(obj) {
        connection.send(JSON.stringify(obj));
    });
});