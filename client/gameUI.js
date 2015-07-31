function startButton() {
    subpub.on('server/validTeams', function() {
        // $('#startButton')[0].disabled = false;
        $('#startButton').show();
    });
    subpub.on('server/invalidTeams', function() {
        // $('#startButton')[0].disabled = true;
        $('#startButton').hide();
    });

    $('#startButton').click(function(event) {
        subpub.emit('toServer', {
            event: 'startGame'
        });
    });

    subpub.on('server/finalTeams', function() {
        $('#startButton').hide();
    });

    subpub.on('server/gameSetupScreen', function() {
        //show main game screens
        $('#gamePanel').show();
        $('#sidePanel').show();
    });
}

function leaveButton() {
    $('#leaveButton').click(function(event) {
        subpub.emit('toServer', {
            event: 'leaveGame'
        });
        $('#gamePanel').hide();
        $('#sidePanel').hide();
    });

    subpub.on('server/finalTeams', function() {
        $('#leaveButton').hide();
    });
}


subpub.on('onload', startButton);
subpub.on('onload', leaveButton);