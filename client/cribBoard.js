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
    var oldTeamPoints = JSON.parse(JSON.stringify(teamPoints));
    var oldTeamPoints2 = JSON.parse(JSON.stringify(teamPoints));

    subpub.on('canvasUpdate', update);

    function update() {}

    subpub.on('canvasDraw', draw);

    function draw() {
        context.fillStyle = 'SandyBrown';

        var startX = (canvas.width - 800) / 2;
        var startY = (canvas.height - 200) / 2;

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

        for (i in oldTeamPoints) {
            if (oldTeamPoints.hasOwnProperty(i)) {
                context.fillStyle = i;
                context.fillRect(startX + 10 + oldTeamPoints[i].points * 780 / 121, startY + 50 + 50 * oldTeamPoints[i].place, 5, 5);
            }
        }
        for (i in oldTeamPoints2) {
            if (oldTeamPoints2.hasOwnProperty(i)) {
                context.fillStyle = i;
                context.fillRect(startX + 10 + oldTeamPoints2[i].points * 780 / 121, startY + 50 + 50 * oldTeamPoints2[i].place, 5, 5);
            }
        }
    }

    subpub.on('server/addPoints', addPoints);

    function addPoints(data) {
        if (data.points > 0) {
            oldTeamPoints2[data.team].points =  oldTeamPoints[data.team].points;
            oldTeamPoints[data.team].points = teamPoints[data.team].points;
            teamPoints[data.team].points += data.points;
            if (teamPoints[data.team].points > 121) {
                teamPoints[data.team].points = 121;
            }
            if (teamPoints[data.team].points === 121) {
                var winText = new Text(context);
                winText.x = canvas.width / 3;
                winText.y = canvas.height / 3;
                winText.text = data.team + " team wins!!!!";
                winText.font = "60px Georgia";
            }
        }
    }
}

subpub.on('server/finalTeams', cribBoard);