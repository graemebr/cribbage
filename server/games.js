    // Global subpub for events

var util = require("util");
var EventEmitter = require('events').EventEmitter;
var subpub = require('./subpub');

var Client = require('./client');
var Chat = require('./chat');
var Teams = require('./teams');
// var GameLogic = require('./gameLogic');

var genclientId = 0;
var genGameId = 0;

var tempGames = []; //TODO: REMOVE

function Game(name) {
    EventEmitter.call(this);
    this.clients = {};
    this.numClients = 0;
    this.gameId = 'g' + (++genGameId);
    this.name = name;
    var self = this;

    Chat(this);
    Teams(this);

    function onJoinGame(gameId, client) {
        if (gameId !== self.gameId) {
            return;
        }

        client.setSection(self);
        self.clients[client.clientId] = client;
        self.numClients++;
        self.emit(client.clientId, {
            event: 'gameSetupScreen'
        });
        self.emit('game/playerJoin', client.clientId);
    }
    subpub.on('lobby/joinGame', onJoinGame);

    function onLeaveGame(clientId) {
        subpub.emit('game/joinLobby', self.clients[clientId]);
        onClientClose(clientId, name);
    }
    this.on('client/leaveGame', onLeaveGame);

    function onClientClose(clientId) {
        var name =  self.clients[clientId].name;
        self.clients[clientId] = null;  //TODO: ensure no memory leak
        self.numClients--;
        self.emit('game/playerLeave', clientId, name);
        if(self.numClients <= 0) {
            subpub.emit('game/gameEmpty', self.gameId);
        }
    }
    this.on('client/clientClose', onClientClose);

    function onStartGame() {
        subpub.emit('game/gameStarted', self.gameId);
    }
    this.on('teams/startGame', onStartGame);
}

function Lobby() {
    EventEmitter.call(this);
    this.clients = {};
    this.gameList = [];
    var self = this;

    function onNewClient(connection) {
        var clientId = 'p' + (++genclientId);
        self.clients[clientId] = new Client(connection, self, clientId);
    }
    subpub.on('cribbageServer/newClient', onNewClient);

    function onJoinLobby(client) {
        client.setSection(self);
        self.clients[client.clientId] = client;
        self.emit(client.clientId, {
            event: 'lobbyScreen',
            data: self.gameList
        });
    }
    subpub.on('game/joinLobby', onJoinLobby);

    function onClientLogin(clientId, name) {
        console.log('new user: ' + name);
        self.emit(clientId, {
            event: 'clientName',
            data: name
        });
        self.emit(clientId, {
            event: 'lobbyScreen',
            data: self.gameList
        });
    }
    this.on('client/login', onClientLogin);

    function onClientJoinGame(clientId, gameId) {
        subpub.emit('lobby/joinGame', gameId, self.clients[clientId]);
        self.clients[clientId] = null;
    }
    this.on('client/joinGame', onClientJoinGame);

    function onClientClose(clientId, name) {
        self.clients[clientId] = null;
    }
    this.on('client/clientClose', onClientClose);

    function onClientCreateGame(clientId, gameName) {
        var game = new Game(gameName);
        tempGames.push(game);
        var gameData = {
            gameId: game.gameId,
            name: gameName
        };
        self.gameList.push(gameData);
        self.emit('allClients', {
            event: 'newGameCreated',
            data: gameData
        });
        onClientJoinGame(clientId, gameData.gameId);
    }
    this.on('client/createGame', onClientCreateGame);

    function onGameStarted(gameId) {
        for (var i = 0; i < self.gameList.length; i++) {
            if(self.gameList[i].gameId === gameId) {
                self.gameList.splice(i,1);
            }
        }
        self.emit('allClients', {
            event: 'removeGame',
            data: gameId
        });
    }
    subpub.on('game/gameStarted', onGameStarted);

    function onGameEmpty(gameId) {
        for (var i = 0; i < tempGames.length; i++) {
            if(tempGames[i].gameId === gameId) {
                tempGames.splice(i,1);
            }
        }
        onGameStarted(gameId);
    }
    subpub.on('game/gameEmpty', onGameEmpty);
}

util.inherits(Game, EventEmitter);
util.inherits(Lobby, EventEmitter);



//create lobby
var lobby = new Lobby();