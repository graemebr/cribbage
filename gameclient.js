var GameClient = (function() {
    var instance;

    function init() {
        var self = this;
        //properties
        this.chatWindow = document.getElementById("chatWindow");
        this.messageManager = new MessageManager();


        this.openLoginScreen = function() {
            //hide connecting screen
            $('#connecting').hide();
            //show login screen
            $('#chooseNamePanel').show();
        };

        this.openErrorScreen = function() {
            $('#connecting').text("error connecting to server");
        };

        this.handleMessage = function(msg) {
            switch(msg.type) {
                case 'chatHistory':
                    for (var i = 0; i < msg.data.length; i++) {
                        self.addChatMessage(msg.data[i]);
                    }
                    break;
                case 'chatMessage':
                    self.addChatMessage(msg.data);
                    $('#chatPanel input')[0].disabled = false;
                    break;
                case 'playerJoin':
                    var playerName = document.createElement('li');
                    playerName.appendChild(document.createTextNode(msg.data.name));
                    playerName.style.display = 'none';
                    playerName.setAttribute('id', msg.data.id);
                    console.log(msg.data.id);
                    $('#playersPanel ul').append(playerName);
                    $('#' + msg.data.id).fadeIn('slow');
                    self.addMessage(msg.data.name + ' connected', 'notice');
                    break;
                case 'playerLeave':
                    $('#' + msg.data.id).fadeOut('slow');
                    self.addMessage(msg.data.name + ' disconnected', 'error');
                    break;
            }
        };

        $('#chooseNamePanel input').keydown(function(event) {
            if (event.keyCode === 13) {
                //enter key
                var msg = this.value;
                if (!msg) {
                    return false;
                }

                selfS.messageManager.send({
                    type: 'name',
                    data: msg
                });

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

            self.messageManager.send({
                type: 'name',
                data: msg
            });

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

                self.messageManager.send({
                    type: 'chat',
                    data: msg
                });

                this.value = '';
                $('#chatPanel input')[0].disabled = true;
            }
        });

        $('#chatPanel button').click(function(event) {
            var msg = $('#chatPanel input')[0].value;
            if (!msg) {
                return false;
            }

            self.messageManager.send({
                type: 'chat',
                data: msg
            });

            $('#chatPanel input')[0].value = '';
            $('#chatPanel input')[0].focus();
            $('#chatPanel input')[0].disabled = true;
        });

        this.addChatMessage = function(msgData) {
            var nameNode = document.createElement('span');
            nameNode.setAttribute('class', 'name');
            nameNode.appendChild(document.createTextNode(msgData.author + ': '));
            var messageNode = document.createElement('p');
            messageNode.appendChild(nameNode);
            messageNode.appendChild(document.createTextNode(msgData.text));
            this.chatWindow.appendChild(messageNode);

            this.chatWindow.scrollTop = chatWindow.scrollHeight;
        };

        this.addMessage = function(msg, cssClass) {
            var messageNode = document.createElement('p');
            messageNode.appendChild(document.createTextNode(msg));
            messageNode.setAttribute('class', cssClass);
            this.chatWindow.appendChild(messageNode);

            this.chatWindow.scrollTop = chatWindow.scrollHeight;
        };
    }

    return {
        getInstance: function() {
            if(!instance) {
                instance = new init();
            }

            return instance;
        }
    };

})();



var MessageManager = function() {
    if (!('WebSocket' in window)) {
        console.log('websockets not supported');
        return;
    }

    this.connection = new WebSocket('ws://52.24.149.122:1337');

    this.connection.onopen = function() {
        console.log('connection open!');
        GameClient.getInstance().openLoginScreen();
    };

    this.connection.onclose = function() {
        console.log('connection closed');
    };

    this.connection.onerror = function(error) {
        console.log('connection error!');
        GameClient.getInstance().openErrorScreen();
    };

    this.connection.onmessage = function(message) {
        //try to parse JSON message
        var json;
        try {
            json = JSON.parse(message.data);
        } catch (e) {
            console.log("invalid JSON: ", message.data);
            return;
        }

        GameClient.getInstance().handleMessage(json);
    };

    this.send = function(obj) {
        this.connection.send(JSON.stringify(obj));
    };
};



window.onload = function() {
    game = GameClient.getInstance();
};