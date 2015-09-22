//sets up the window with player names and team setting abilities
function players() {
    //setup DOM stuff


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
        console.log('enabling selectboxes');
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

    function createPlayer(player) {
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

        updatePlayerTeam(player);

        $('#' + player.clientId).fadeIn('slow');

        if (globals.clientId === player.clientId) {
            enableSelectBoxes();
        }
    }

    function onPlayerJoin(player) {
        // if($('#' + player.clientId)[0]) {
        //     $('#' + player.clientId).remove();
        // }    //TODO: Fix bug where old 'li' element is used for rejoining of player? Is it even a bug? Hmm

        createPlayer(player);

        subpub.emit('chatAlert', {
            msg: player.name + ' connected',
            cssClass: 'notice'
        });
    }
    var playerJoin = subpub.on('server/playerJoin', onPlayerJoin);

    var playerLeave = subpub.on('server/playerLeave', function(player) {
        $('#' + player.clientId).fadeOut('slow');
        subpub.emit('chatAlert', {
            msg: player.name + ' disconnected',
            cssClass: 'error'
        });
    });

    function updatePlayerTeam(player) {
        $('#' + player.clientId + ' .selected').css('backgroundColor', player.team);
    }

    var updateTeam = subpub.on('server/updateTeam', updatePlayerTeam);

    var currentTeams = subpub.on('server/currentTeams', function(teams) {
        for (var i = 0; i < teams.red.length; i++) {
            createPlayer({
                clientId: teams.red[i].clientId,
                team: 'red',
                name: teams.red[i].name
            });
        }
        for (i = 0; i < teams.blue.length; i++) {
            createPlayer({
                clientId: teams.blue[i].clientId,
                team: 'blue',
                name: teams.blue[i].name
            });
        }
        for (i = 0; i < teams.green.length; i++) {
            createPlayer({
                clientId: teams.green[i].clientId,
                team: 'green',
                name: teams.green[i].name
            });
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
        var i;
        if(teams.red) {
            for (i = 0; i < teams.red.length; i++) {
                updatePlayerTeam({
                    clientId: teams.red[i].clientId,
                    team: 'red'
                });
            }
        }
        if(teams.blue) {
            for (i = 0; i < teams.blue.length; i++) {
                updatePlayerTeam({
                    clientId: teams.blue[i].clientId,
                    team: 'blue'
                });
            }
        }
        if(teams.green) {
            for (i = 0; i < teams.green.length; i++) {
                updatePlayerTeam({
                    clientId: teams.green[i].clientId,
                    team: 'green'
                });
            }
        }
    });

    subpub.on('server/lobbyScreen', function() {
        $('#playersPanel ul').empty();
    });

}


subpub.on('onload', players);