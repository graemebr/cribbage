var Player = require('./player');

function Team(teamId) {
    this.teamId = teamId;
    this.players = [];
}

Team.prototype.add = function(player) {
    this.players.push(player);
};

Team.prototype.popPlayer = function(clientId) {
    for (var i = this.players.length - 1; i >= 0; i--) {
        if(this.players[i].clientId === clientId) {
            return this.players.splice(i, 1)[0];
        }
    }
};

Team.prototype.getPlayerList = function() {
    var playerList = [];
    this.players.forEach(function(player) {
        playerList.push({
            clientId: player.clientId,
            name: player.name
        });
    });
    return playerList;
};

Team.prototype.getNumPlayers = function() {
    return this.players.length;
};

// Team.prototype.forEach = function(func, ctx, args) {
//     this.players.forEach(function(player) {
//         var funcArgs = [player];
//         if(args) {
//             funcArgs = funcArgs.concat(args);
//         }
//         func.apply(ctx, funcArgs);
//     });
// };

module.exports = Team;