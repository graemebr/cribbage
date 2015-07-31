module.exports = function(section) {

    var red = [],
        blue = [],
        green = [];
    var numPlayers = 0;

    var addToSmallest = function(clientId) {
        if (red.length <= blue.length) {
            if (red.length <= green.length) {
                //red
                red.push(clientId);
                return 'red';
            } else {
                //green
                green.push(clientId);
                return 'green';
            }
        } else {
            if (blue.length <= green.length) {
                //blue
                blue.push(clientId);
                return 'blue';
            } else {
                //green
                green.push(clientId);
                return 'green';
            }
        }
    };

    var addToSizeOne = function(clientId) {
        if (red.length === 1) {
            //red
            red.push(clientId);
            return 'red';
        } else if (blue.length === 1) {
            //blue
            blue.push(clientId);
            return 'blue';
        } else if (green.length === 1) {
            //green
            green.push(clientId);
            return 'green';
        } else {
            return addToSmallest(clientId);
        }
    };

    var remove = function(clientId) {
        if (!removeFromArray(red, clientId)) {
            if (!removeFromArray(blue, clientId)) {
                removeFromArray(green, clientId);
            }
        }
    };

    var removeFromArray = function(arr, clientId) {
        var index = arr.indexOf(clientId);
        if (index === -1) {
            return false;
        }
        arr.splice(index, 1);
        return true;
    };

    var validateTeams = function() {
        switch (numPlayers) {
            case 2:
            case 3:
                return (red.length < 2 &&
                    blue.length < 2 &&
                    green.length < 2);
            case 4:
                return ((red.length === 2 || red.length === 0) &&
                    (blue.length === 2 || blue.length === 0) &&
                    (green.length === 2 || green.length === 0));
            case 6:
                return (red.length === 2 &&
                    blue.length === 2 &&
                    green.length === 2);
        }
        return false;
    };

    var cementTeams = function() {
        //remove all callbacks for changing teams
        section.removeListener('client/setTeam', setTeamCallback);
        section.removeListener('game/playerJoin', playerJoinCallback);
        section.removeListener('game/playerLeave', playerLeaveCallback);
        section.removeListener('client/startGame', startGameCallback);

        //TODO: add new callback for playerLeave events
    };

    var setTeamCallback = function(clientId, team) {
        console.log('team: ' + team);
        remove(clientId);
        switch (team) {
            case 'red':
                red.push(clientId);
                break;
            case 'blue':
                blue.push(clientId);
                break;
            case 'green':
                green.push(clientId);
                break;
        }

        section.emit('allClients', {
            event: 'updateTeam',
            data: {
                clientId: clientId,
                team: team
            }
        });

        if (validateTeams()) {
            section.emit('allClients', {
                event: 'validTeams'
            });
        } else {
            section.emit('allClients', {
                event: 'invalidTeams'
            });
        }
    };
    section.on('client/setTeam', setTeamCallback);

    var playerJoinCallback = function(clientId) {
        //send new player current teams
        section.emit(clientId, {
            event: 'currentTeams',
            data: {
                red: red,
                blue: blue,
                green: green
            }
        });

        var team;

        if (numPlayers === 3) {
            team = addToSizeOne(clientId);
        } else {
            team = addToSmallest(clientId);
        }
        numPlayers++;

        section.emit('allClients', {
            event: 'updateTeam',
            data: {
                clientId: clientId,
                team: team
            }
        });

        if (validateTeams()) {
            section.emit('allClients', {
                event: 'validTeams'
            });
        } else {
            section.emit('allClients', {
                event: 'invalidTeams'
            });
        }
    };
    section.on('game/playerJoin', playerJoinCallback);

    var playerLeaveCallback = function(clientId) {
        remove(clientId);
        numPlayers--;

        if (validateTeams()) {
            section.emit('allClients', {
                event: 'validTeams'
            });
        } else {
            section.emit('allClients', {
                event: 'invalidTeams'
            });
        }
    };
    section.on('game/playerLeave', playerLeaveCallback);

    var startGameCallback = function() {
        console.log('start game');
        if (validateTeams()) {
            console.log('valid teams');
            //can start game
            //cement teams to disallow changes
            cementTeams();
            //tell clients game has started and final teams
            section.emit('allClients', {
                event: 'finalTeams',
                data: {
                    red: red,
                    blue: blue,
                    green: green
                }
            });
            //tell rest of server that game is started
            section.emit('teams/startGame');
        }
    };
    section.on('client/startGame', startGameCallback);
};