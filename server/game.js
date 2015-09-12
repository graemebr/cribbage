var util = require("util");
var EventEmitter = require('events').EventEmitter;

var subpub = require('./subpub');
var Chat = require('./chat');
var Teams = require('./teams');
var GameLogic = require('./gameLogic');

//creates unique gameIds
var genGameId = 0;

function Game(name) {
    EventEmitter.call(this);
    this.clients = {};
    this.numClients = 0;
    this.gameId = 'g' + (++genGameId);
    this.name = name;

    this.chat = new Chat(this);
    this.teams = new Teams(this);
    // this.gameLogic = new GameLogic(this, this.teams);

    this.boundOnJoinGame = this.onJoinGame.bind(this);
    subpub.on('lobby/joinGame', this.boundOnJoinGame);

    this.boundOnClientClose = this.onClientClose.bind(this);
    this.on('client/leaveGame', this.onLeaveGame.bind(this));
    this.on('client/clientClose', this.boundOnClientClose);
    this.on('client/startGame', this.onStartGame.bind(this));
    this.on('teams/validTeams', this.onValidTeams.bind(this));
}
util.inherits(Game, EventEmitter);

Game.prototype.onJoinGame = function(gameId, client) {
    if (gameId !== this.gameId) {
        return;
    }

    client.setSection(this);
    this.clients[client.clientId] = client;
    this.numClients++;
    this.emit(client.clientId, {
        event: 'gameSetupScreen'
    });
    this.emit('game/playerJoin', client.clientId, client.name);
};

Game.prototype.onLeaveGame = function(clientId) {
    this.clients[clientId].setSection(null); //stop client from receiving game events for this game
    subpub.emit('game/joinLobby', this.clients[clientId]);
    this.removeClientFromGame(clientId);
};

Game.prototype.onClientClose = function(clientId) {
    delete this.clients[clientId];
    this.removeClientFromGame(clientId);
};

Game.prototype.removeClientFromGame = function(clientId) {
    this.clients[clientId] = null;
    this.numClients--;
    this.emit('game/playerLeave', clientId);
    if (this.numClients <= 0) {
        subpub.emit('game/gameEmpty', this.gameId);
    }
};

Game.prototype.onClientQuit = function(clientId) {
    delete this.clients[clientId];
    this.emit('game/playerQuit', clientId);
};

Game.prototype.onStartGame = function() {
    if(this.teams.validTeams()) {
        subpub.removeListener('lobby/joinGame', this.boundOnJoinGame);
        this.removeListener('client/clientClose', this.boundOnClientClose);
        this.on('client/clientClose', this.onClientQuit.bind(this));

        subpub.emit('game/gameStarted', this.gameId);

        this.gameLogic = new GameLogic(this, this.teams.getTeams());

        this.emit('game/startGame');
    }
};

// Game.prototype.onValidTeams = function() {
//     subpub.removeListener('lobby/joinGame', this.boundOnJoinGame);
//     this.removeListener('client/clientClose', this.boundOnClientClose);
//     this.on('client/clientClose', this.onClientQuit.bind(this));

//     subpub.emit('game/gameStarted', this.gameId);

//     this.emit('game/startGame');
// };

module.exports = Game;