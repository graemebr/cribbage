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

    subpub.on('server/startGame', function() {
        $('#startButton').hide();
    });
}

subpub.on('loginScreenSubmitted', function() {
    //show main game screens
    $('#gamePanel').show();
    $('#sidePanel').show();
});

subpub.on('onload', startButton);