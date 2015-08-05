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
    this.boundOnValidateTeams = this.onValidateTeams.bind(this);
    this.boundOnStartGame = this.onStartGame.bind(this);

    this.section.on('client/setTeam', this.boundOnSetTeam);
    this.section.on('game/playerJoin', this.boundOnPlayerJoin);
    this.section.on('game/playerLeave', this.boundOnPlayerLeave);
    this.section.on('game/validateTeams', this.boundOnValidateTeams);
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
    var player = new Player(clientId, clientName);
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

Teams.prototype.onValidateTeams = function() {
    if (this.validTeams()) {
        console.log('valid teams');
        this.section.emit('teams/validTeams');
    }
};

Teams.prototype.onStartGame = function() {
    //cement teams to disallow changes
    this.cementTeams();
    //tell clients final teams
    this.section.emit('allClients', {
        event: 'finalTeams',
        data: this.getCurrentTeams()
    });
};






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






function Player(clientId, name) {
    this.clientId = clientId;
    this.name = name;
}

module.exports = Teams;