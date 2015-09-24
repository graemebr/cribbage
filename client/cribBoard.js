function cribBoard(teams) {
    var canvas = document.getElementById('gameCanvas');
    var context = document.getElementById('gameCanvas').getContext('2d');

    var teamPoints = {};
    var place = 0;
    for (var i in teams) {
        if (teams.hasOwnProperty(i)) {
            teamPoints[i] = {
                points: 0,
                place: place
            };
            place++;
        }
    }

    subpub.on('canvasUpdate', update);

    function update() {}

    subpub.on('canvasDraw', draw);

    function draw() {
        context.fillStyle = 'SandyBrown';

        var startX = (canvas.width-800)/2;
        var startY = (canvas.height-200)/2;

        context.fillRect(startX, startY, 800, 200);

        for (var i = 0; i < place; i++) {
            for (var j = 0; j <= 121; j++) {
                context.fillStyle = 'black';
                context.fillRect(startX + 10 + j * 780 / 121, startY + 50 + 50 * i, 5, 5);
            }
        }

        for (i in teamPoints) {
            if (teamPoints.hasOwnProperty(i)) {
                context.fillStyle = i;
                context.fillRect(startX + 10 + teamPoints[i].points * 780 / 121, startY + 50 + 50 * teamPoints[i].place, 5, 5);
            }
        }
    }

    subpub.on('server/addPoints', addPoints);

    function addPoints(data) {
        teamPoints[data.team].points += data.points;
        if (teamPoints[data.team].points > 121) {
            teamPoints[data.team].points = 121;
        }
    }
}

subpub.on('server/finalTeams', cribBoard);