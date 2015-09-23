function gameCanvas() {
    var cardImages = {};
    var backImage;
    var canvas = document.getElementById('gameCanvas');
    var context = document.getElementById('gameCanvas').getContext('2d');
    var gamePanel = $('#gamePanel');
    canvas.width = gamePanel.width();
    canvas.height = gamePanel.height();
    var spriteHand = [];
    var spriteCrib = [];

    canvas.addEventListener('click', function(event) {
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        console.log('click: ' + x + ' ' + y);
        subpub.emit('canvasClick', {
            x: x,
            y: y
        });
    });

    subpub.on('server/loadAssets', function(cards) {
        var count = cards.length;
        count++; //back image
        cards.forEach(function(card) {
            var img = new Image();
            img.src = 'playingCards/' + card.number + '_of_' + card.suit + '.png';
            cardImages[card.id] = img;
            img.onload = function() {
                if (--count === 0) {
                    console.log('assetsLoaded');
                    subpub.emit('toServer', {
                        event: 'assetsLoaded',
                    });
                }
            };
        });
        backImage = new Image();
        backImage.src = 'playingCards/back.png';
        backImage.onload = function() {
            if (--count === 0) {
                console.log('assetsLoaded');
                subpub.emit('toServer', {
                    event: 'assetsLoaded',
                });
            }
        };
    });

    subpub.on('server/passToCrib', function(hand) {
        var passCount = (hand.length === 5) ? 1 : 2;
        var passCards = [];
        console.log('passToCrib');
        var x = 0;
        var y = canvas.height - 150;
        hand.forEach(function(card) {
            var sprite = new Sprite(cardImages[card.id], context);
            x += 110;
            sprite.x = x;
            sprite.y = y;
            sprite.scale = 0.2;
            sprite.onClick = function() {
                if (passCards.length < passCount) {
                    passCards.push(card);
                    sprite.y -= 20;
                    if (passCards.length === passCount) {
                        subpub.emit('toServer', {
                            event: 'donePassToCrib',
                            data: passCards
                        });
                        removeSpriteFromHand(sprite);
                    }
                }
            };
            spriteHand.push(sprite);
        });
    });

    function removeSpriteFromHand(sprite) {
        spriteHand = spriteHand.filter(function(obj) {
            return obj !== sprite;
        });

        var x = 0;
        spriteHand.forEach(function(obj) {
            x += 110;
            obj.x = x;
        });
        sprite.unsubscribe();
    }

    subpub.on('server/cribCards', function(numCards) {
        console.log('addToCrib');
        var x = 110*7;
        var y = canvas.height - 150;
        for (var i = 0; i < numCards; i++) {
            var sprite = new Sprite(backImage, context);
            x += 20;
            y += 8;
            sprite.x = x;
            sprite.y = y;
            sprite.scale = 0.2;
            spriteCrib.push(sprite);
        }
    });

    subpub.on('server/cutCard', function(card) {
        var sprite = new Sprite(cardImages[card.id], context);
        sprite.y = 50;
        sprite.x = canvas.width - 110;
        sprite.scale = 0.2;
    });

    subpub.on('server/cutDeck', function(numCards) {
        //TODO make actual cut deck picker
        console.log('choosing cutCard');
        subpub.emit('toServer', {
            event: 'doneCutDeck',
            data: Math.floor(Math.random() * numCards)
        });
    });

    function loop(time) {
        subpub.emit('canvasUpdate', time);
        context.clearRect(0, 0, canvas.width, canvas.height);
        subpub.emit('canvasDraw');
        window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);
}
subpub.on('onload', gameCanvas);