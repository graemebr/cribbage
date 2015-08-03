var util = require("util");
var EventEmitter = require('events').EventEmitter;

var subpub = require('./subpub');
var Client = require('./client');
var Game = require('./game');

function Lobby() {
    EventEmitter.call(this);
    this.clients = {};
    this.games = {};
    this.gameList = [];

    subpub.on('cribbageServer/newClient', this.onNewClient.bind(this));
    subpub.on('game/joinLobby', this.onJoinLobby.bind(this));
    subpub.on('game/gameStarted', this.onGameStarted.bind(this));
    subpub.on('game/gameEmpty', this.onGameEmpty.bind(this));

    this.on('client/login', this.onClientLogin.bind(this));
    this.on('client/joinGame', this.onClientJoinGame.bind(this));
    this.on('client/clientClose', this.onClientClose.bind(this));
    this.on('client/createGame', this.onClientCreateGame.bind(this));
}
util.inherits(Lobby, EventEmitter);

Lobby.prototype.onNewClient = function(connection) {
    var newClient = new Client(connection, this);
    this.clients[newClient.clientId] = newClient;
};

Lobby.prototype.onJoinLobby = function(client) {
    client.setSection(this);
    this.clients[client.clientId] = client;
    this.emit(client.clientId, {
        event: 'lobbyScreen',
        data: this.gameList
    });
};

Lobby.prototype.onClientLogin = function(clientId, name) {
    console.log('new user: ' + name);
    if (this.clients[clientId]) {
        this.clients[clientId].name = name;

        this.emit(clientId, {
            event: 'clientName',
            data: name
        });

        this.emit(clientId, {
            event: 'lobbyScreen',
            data: this.gameList
        });
    }
};

Lobby.prototype.onClientJoinGame = function(clientId, gameId) {
    subpub.emit('lobby/joinGame', gameId, this.clients[clientId]);
    this.clients[clientId] = null;
};

Lobby.prototype.onClientClose = function(clientId, name) {
    delete this.clients[clientId];
    this.clients[clientId] = null;
};

Lobby.prototype.onClientCreateGame = function(clientId, gameName) {
    var game = new Game(gameName);
    this.games[game.gameId] = game;

    var gameData = {
        gameId: game.gameId,
        name: game.name
    };
    this.gameList.push(gameData);

    this.emit('allClients', {
        event: 'newGameCreated',
        data: gameData
    });

    this.onClientJoinGame(clientId, game.gameId);
};

Lobby.prototype.onGameStarted = function(gameId) {
    for (var i = 0; i < this.gameList.length; i++) {
        if (this.gameList[i].gameId === gameId) {
            this.gameList.splice(i, 1);
        }
    }
    this.emit('allClients', {
        event: 'removeGame',
        data: gameId
    });
};

Lobby.prototype.onGameEmpty = function(gameId) {
    delete this.games[gameId];
    this.games[gameId] = null;
    this.onGameStarted(gameId);
};