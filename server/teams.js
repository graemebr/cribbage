var Team = require('./team');
var Player = require('./player');
function Teams(section) {
    this.section = section;

    this.teams = [];
    this.teams.push(new Team('red'));
    this.teams.push(new Team('blue'));
    this.teams.push(new Team('green'));
    this.numPlayers = 0;

    this.boundOnSetTeam = this.onSetTeam.bind(this);
    this.boundOnPlayerJoin = this.onPlayerJoin.bind(this);
    this.boundOnPlayerLeave = this.onPlayerLeave.bind(this);
    // this.boundOnValidateTeams = this.onValidateTeams.bind(this);
    this.boundOnStartGame = this.onStartGame.bind(this);

    this.section.on('client/setTeam', this.boundOnSetTeam);
    this.section.on('game/playerJoin', this.boundOnPlayerJoin);
    this.section.on('game/playerLeave', this.boundOnPlayerLeave);
    // this.section.on('game/validateTeams', this.boundOnValidateTeams);
    this.section.on('game/startGame', this.boundOnStartGame);
}

Teams.prototype.addPlayerToSmallestTeam = function(player) {
    this.teams[0].add(player);
    return this.teams[0].teamId;
};

Teams.prototype.addPlayerToTeamN = function(player, n) {
    // var nPlayerTeams = this.teams.filter(function(team) {
    //     return team.numPlayers === numPlayers;
    // });
    // if (nPlayerTeams) {
    //     nPlayerTeams[0].add(player);
    //     return nPlayerTeams[0].teamId;
    // }
    // return addPlayerToSmallestTeam(player);
    for (var i = this.teams.length - 1; i >= 1; i--) {
        if (this.teams[i].getNumPlayers() === n) {
            this.teams[i].add(player);
            return this.teams[i].teamId;
        }
    }
    this.teams[0].add(player);
    return this.teams[0].teamId;
};

Teams.prototype.popPlayer = function(clientId) {
    var player;
    this.teams.some(function(team) {
        player = team.popPlayer(clientId);
        return player;
    });
    return player;
};

Teams.prototype.validTeams = function() {
    switch (this.numPlayers) {
        case 2:
        case 3:
            return this.teams.every(function(team) {
                return team.getNumPlayers() < 2;
            });
        case 4:
            return this.teams.every(function(team) {
                return team.getNumPlayers() === 2 || team.getNumPlayers() === 0;
            });
        case 6:
            return this.teams.every(function(team) {
                return team.getNumPlayers() === 2;
            });
    }
    return false;
};

Teams.prototype.emitValidTeams = function() {
    if (this.validTeams()) {
        this.section.emit('allClients', {
            event: 'validTeams'
        });
    } else {
        this.section.emit('allClients', {
            event: 'invalidTeams'
        });
    }
};

Teams.prototype.cementTeams = function() {
    //remove all callbacks for changing teams
    this.section.removeListener('client/setTeam', this.boundOnSetTeam);
    this.section.removeListener('game/playerJoin', this.boundOnPlayerJoin);
    this.section.removeListener('game/playerLeave', this.boundOnPlayerLeave);

    //tell the players' what their teams are
    this.teams.forEach(function(team) {
        team.setPlayerTeam();
    });
};

Teams.prototype.getCurrentTeams = function() {
    var currentTeams = {};
    this.teams.forEach(function(team) {
        currentTeams[team.teamId] = team.getPlayerList();
    });
    return currentTeams;
};

Teams.prototype.sortTeams = function() {
    this.teams.sort(function(teamA, teamB) {
        return teamA.getNumPlayers() - teamB.getNumPlayers();
    });
};

Teams.prototype.onSetTeam = function(clientId, teamId) {
    var player = this.popPlayer(clientId);
    this.teams.some(function(team) {
        if (team.teamId === teamId) {
            if (player) {
                team.add(player);
            }
            return true;
        }
        return false;
    });

    this.sortTeams();

    this.section.emit('allClients', {
        event: 'updateTeam',
        data: {
            clientId: clientId,
            team: teamId
        }
    });

    this.emitValidTeams();
};

Teams.prototype.onPlayerJoin = function(clientId, clientName) {
    //send new player current teams
    this.section.emit(clientId, {
        event: 'currentTeams',
        data: this.getCurrentTeams()
    });

    //add player
    var player = new Player(clientId, clientName, this.section);
    var teamId;
    if (this.numPlayers === 3) {
        teamId = this.addPlayerToTeamN(player, 1);
    } else {
        teamId = this.addPlayerToSmallestTeam(player);
    }
    this.numPlayers++;

    this.sortTeams();

    //send all players the new player
    this.section.emit('allClients', {
        event: 'playerJoin',
        data: {
            clientId: clientId,
            name: clientName,
            team: teamId
        }
    });

    this.emitValidTeams();
};

Teams.prototype.onPlayerLeave = function(clientId) {
    var player = this.popPlayer(clientId);
    this.numPlayers--;

    this.sortTeams();

    this.section.emit('allClients', {
        event: 'playerLeave',
        data: {
            clientId: clientId,
            name: player.name
        }
    });

    this.emitValidTeams();
};

// Teams.prototype.onValidateTeams = function() {
//     if (this.validTeams()) {
//         console.log('valid teams');
//         this.section.emit('teams/validTeams');
//     }
// };

Teams.prototype.onStartGame = function() {
    //cement teams to disallow changes
    this.cementTeams();
    //tell clients final teams
    this.section.emit('allClients', {
        event: 'finalTeams',
        data: this.getCurrentTeams()
    });
};

Teams.prototype.getTeams = function() {
    return this.teams;
};


// Teams.prototype.nexRound = function() {
//     //set CribPlayer
//     this.cribIndex = (this.cribIndex+1)%this.teams.length;
//     this.teams[this.cribIndex].incrementCribPLayer();
//     this.teams[(this.cribIndex+1)%this.teams.length].incrementFirstPlayer();
//     this.teams.forEach(function(team) {
//         team.nextRound();
//     });
// };

// Teams.prototype.getCribPlayer = function() {
//     return this.teams[this.cribIndex].getCribPlayer();
// };

// Teams.prototype.getFirstPlayer = function() {
//     return this.teams[(this.cribIndex+1)%this.teams.length].getFirstPlayer();
// };

// Teams.prototype.getNextPlayer = function() {
//     return this.teams[this.lastIndex++].getNextPlayer();
// };

// Teams.prototype.setLastPlayer = function(player) {
//     this.teams.some(function(team, index) {
//         if(team.setLastPlayer(player)) {
//             this.lastIndex = index;
//             return true;
//         }
//         return false;
//     });
// };


// Teams.prototype.forEachPlayer = function(func, ctx, args) {
//     //forEachPlayer(func, ctx [, args])
//     this.teams.forEach(function(team) {
//         team.forEach(func, ctx, args);
//     });
// };

// Teams.prototype.forEachTeam = function(func, ctx, args) {
//     //forEachTeam(func, ctx [, args])
//     this.teams.forEach(function(team) {
//         var funcArgs = [team];
//         if (args) {
//             funcArgs = funcArgs.concat(args);
//         }
//         func.apply(ctx, funcArgs);
//     });
// };

module.exports = Teams;