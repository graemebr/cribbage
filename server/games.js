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
        self.clients[clientId] = null;
        self.emit('game/playerLeave', clientId, name);
    }
    this.on('client/clientClose', onClientClose);
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
    }
    this.on('client/createGame', onClientCreateGame);
}

util.inherits(Game, EventEmitter);
util.inherits(Lobby, EventEmitter);



//create lobby
var lobby = new Lobby();