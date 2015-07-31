//sets up the window with player names and team setting abilities
function players() {
    //setup DOM stuff
    //
    //
    var unusedPlayerTeams = {};

    var createSelectOption = function(htmlClass) {
        var selectOption = document.createElement('span');
        selectOption.setAttribute('class', htmlClass);
        return selectOption;
    };

    var createSelectBox = function() {
        var selectBox = document.createElement('div');
        selectBox.setAttribute('class', 'selectBox');

        var selected = document.createElement('span');
        selected.setAttribute('class', 'selected');
        selectBox.appendChild(selected);

        var selectOptions = document.createElement('div');
        selectOptions.setAttribute('class', 'selectOptions');
        selectOptions.appendChild(createSelectOption('redTeam'));
        selectOptions.appendChild(createSelectOption('blueTeam'));
        selectOptions.appendChild(createSelectOption('greenTeam'));
        selectBox.appendChild(selectOptions);

        return selectBox;
    };

    var enableSelectBoxes = function() {
        $('.selectBox').each(function() {
            //clicking on select box opens / closes it!
            $(this).children('.selected').click(function() {
                if ($(this).parent().children('.selectOptions').css('display') == 'none') {
                    $(this).parent().children('.selectOptions').css('display', 'block');
                } else {
                    $(this).parent().children('.selectOptions').css('display', 'none');
                }
            });

            //clicking on an option changes the currently displayed option
            $(this).find('.selectOptions span').click(function() {
                $(this).parent().css('display', 'none');
                $(this).parent().siblings('.selected').css('backgroundColor', $(this).css('backgroundColor'));
                var team = '';
                switch ($(this)[0].className) {
                    case 'redTeam':
                        team = 'red';
                        break;
                    case 'blueTeam':
                        team = 'blue';
                        break;
                    case 'greenTeam':
                        team = 'green';
                        break;
                }
                // console.log('team: ' + team);
                subpub.emit('toServer', {
                    event: 'setTeam',
                    data: team
                });
            });
        });
    };

    var createTeamBox = function() {
        var teamBox = document.createElement('div');
        teamBox.setAttribute('class', 'teamBox');

        var selected = document.createElement('span');
        selected.setAttribute('class', 'selected');
        teamBox.appendChild(selected);

        return teamBox;
    };

    var playerJoin = subpub.on('server/playerJoin', function(player) {
        var playerName = document.createElement('li');
        playerName.appendChild(document.createTextNode(player.name));
        playerName.style.display = 'none';
        playerName.setAttribute('class', 'playerLI');
        playerName.setAttribute('id', player.clientId);

        if (globals.clientId === player.clientId) {
            playerName.appendChild(createSelectBox());
        } else {
            playerName.appendChild(createTeamBox());
        }

        $('#playersPanel ul').append(playerName);

        if(unusedPlayerTeams[player.clientId]) {
            updatePlayerColor(player.clientId, unusedPlayerTeams[player.clientId]);
            delete unusedPlayerTeams[player.clientId];
        }

        $('#' + player.clientId).fadeIn('slow');
        subpub.emit('chatAlert', {
            msg: player.name + ' connected',
            cssClass: 'notice'
        });

        if (globals.clientId === player.clientId) {
            enableSelectBoxes();
        }
    });

    var playerLeave = subpub.on('server/playerLeave', function(player) {
        $('#' + player.clientId).fadeOut('slow');
        subpub.emit('chatAlert', {
            msg: player.name + ' disconnected',
            cssClass: 'error'
        });
    });

    function updatePlayerColor(clientId, team) {
        $('#' + clientId + ' .selected').css('backgroundColor', team);
    }

    function updatePlayerTeam(clientId, team) {
        if (document.getElementById(clientId)) {
            updatePlayerColor(clientId, team);
        } else {
            unusedPlayerTeams[clientId] = team;
        }
    }

    var updateTeam = subpub.on('server/updateTeam', function(player) {
        updatePlayerTeam(player.clientId, player.team);
    });

    var currentTeams = subpub.on('server/currentTeams', function(teams) {
        for (var i = 0; i < teams.red.length; i++) {
            updatePlayerTeam(teams.red[i], 'red');
        }
        for (i = 0; i < teams.blue.length; i++) {
            updatePlayerTeam(teams.blue[i], 'blue');
        }
        for (i = 0; i < teams.green.length; i++) {
            updatePlayerTeam(teams.green[i], 'green');
        }
    });

    var startGame = subpub.on('server/finalTeams', function(teams) {
        console.log('start game');
        //unsubscribe to playerJoin event
        subpub.off(playerJoin);
        //switch own player from selectBox to teamBox
        $('#' + globals.clientId + ' .selectBox').remove();
        $('#' + globals.clientId)[0].appendChild(createTeamBox());
        //set final team colors
        for (var i = 0; i < teams.red.length; i++) {
            $('#' + teams.red[i] + ' .selected').css('backgroundColor', 'red');
        }
        for (i = 0; i < teams.blue.length; i++) {
            $('#' + teams.blue[i] + ' .selected').css('backgroundColor', 'blue');
        }
        for (i = 0; i < teams.green.length; i++) {
            $('#' + teams.green[i] + ' .selected').css('backgroundColor', 'green');
        }
    });

    subpub.on('server/lobbyScreen', function() {
        $('#playersPanel ul').empty();
    });

}


subpub.on('onload', players);