function gameCanvas() {
    var cardImages = {};
    var backImage;
    var deckImage;
    var arrowImage;
    var canvas = document.getElementById('gameCanvas');
    var context = document.getElementById('gameCanvas').getContext('2d');
    var gamePanel = $('#gamePanel');
    canvas.width = gamePanel.width();
    canvas.height = gamePanel.height();
    var spriteHand = [];
    var spriteCrib = [];
    var spritePeg = [];
    var spriteCutCard;
    var turnText;
    var pegText;
    var pointsAccumulated;

    //temp!
    var check = null;
    var plus = null;
    var clear = null;
    var checkSprite = null;
    var plusSprite = null;
    var clearSprite = null;

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
        turnText = new Text(context);
        turnText.x = canvas.width / 2;
        turnText.y = 50;
        turnText.text = '...starting game...';
        var count = cards.length;
        count++; //back image
        count++; //deck image
        count++; //arrow
        count++; //check
        count++; //plus
        count++; //clear
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
        deckImage = new Image();
        deckImage.src = 'playingCards/deck.png';
        deckImage.onload = function() {
            if (--count === 0) {
                console.log('assetsLoaded');
                subpub.emit('toServer', {
                    event: 'assetsLoaded',
                });
            }
        };
        arrowImage = new Image();
        arrowImage.src = 'playingCards/arrow.png';
        arrowImage.onload = function() {
            if (--count === 0) {
                console.log('assetsLoaded');
                subpub.emit('toServer', {
                    event: 'assetsLoaded',
                });
            }
        };
        plus = new Image();
        plus.src = 'playingCards/plus.png';
        plus.onload = function() {
            if (--count === 0) {
                console.log('assetsLoaded');
                subpub.emit('toServer', {
                    event: 'assetsLoaded',
                });
            }
        };
        clear = new Image();
        clear.src = 'playingCards/clear.png';
        clear.onload = function() {
            if (--count === 0) {
                console.log('assetsLoaded');
                subpub.emit('toServer', {
                    event: 'assetsLoaded',
                });
            }
        };
        check = new Image();
        check.src = 'playingCards/check.png';
        check.onload = function() {
            if (--count === 0) {
                console.log('assetsLoaded');
                subpub.emit('toServer', {
                    event: 'assetsLoaded',
                });
            }
        };
    });

    subpub.on('server/passToCrib', function(data) {
        var passCount = (data.hand.length === 5) ? 1 : 2;
        var passCards = [];
        console.log('passToCrib');
        console.log('crib player: ' + data.cribPlayer);
        var x = 0;
        var y = canvas.height - 150;

        turnText.text = "Pass card(s) to crib. " + data.cribPlayer + "'s crib!";

        spriteHand.forEach(function(card) {
            card.sprite.unsubscribe();
        });
        spriteHand = [];
        if (spriteCutCard) {
            spriteCutCard.unsubscribe();
            spriteCutCard = null;
        }
        if (plusSprite) {
            plusSprite.unsubscribe();
            plusSprite = null;
        }
        if (clearSprite) {
            clearSprite.unsubscribe();
            clearSprite = null;
        }
        if (checkSprite) {
            checkSprite.unsubscribe();
            checkSprite = null;
        }
        if (pointsAccumulated) {
            pointsAccumulated.unsubscribe();
            pointsAccumulated = null;
        }

        data.hand.forEach(function(card) {
            var sprite = new Sprite(cardImages[card.id], context);
            x += 110;
            sprite.x = x;
            sprite.y = y;
            sprite.scale = 0.2;
            sprite.onClick = function() {
                if (passCards.length < passCount) {
                    passCards.push(card);
                    sprite.y -= 20;
                    removeSpriteFromHand(sprite);
                    if (passCards.length === passCount) {
                        subpub.emit('toServer', {
                            event: 'donePassToCrib',
                            data: passCards
                        });
                    }
                }
            };
            spriteHand.push({
                sprite: sprite,
                card: card
            });
        });
    });

    subpub.on('server/cardPegged', function(data) {
        var sprite = new Sprite(cardImages[data.card.id], context);
        spritePeg.push(sprite);
        sprite.x = 60 + spritePeg.length * 50;
        sprite.y = 50;
        sprite.scale = 0.2;
        pegText.text = '' + data.cardCount;
        pegText.x = 200 + spritePeg.length * 50;
        pegText.y = 80;
    });

    subpub.on('server/newPeggingRound', function() {
        spritePeg.forEach(function(sprite) {
            sprite.unsubscribe();
        });
        spritePeg = [];
        if (!pegText) {
            pegText = new Text(context);
        }
        pegText.text = '0';
        pegText.x = 200;
        pegText.y = 80;
    });

    subpub.on('server/peg', function(data) {
        if (data.clientId === globals.clientId) {
            console.log('peg');
            var chosen = false;
            spriteHand.forEach(function(obj) {
                obj.sprite.onClick = function() {
                    if (data.allowedCards.some(function(card) {
                            return card.id === obj.card.id;
                        })) {
                        if (!chosen) {
                            chosen = true;
                            subpub.emit('toServer', {
                                event: 'pegDone',
                                data: obj.card
                            });
                            removeSpriteFromHand(obj.sprite);
                        }
                    }
                };
            });
        }
        turnText.text = data.name + ' is pegging!';
    });

    function removeSpriteFromHand(sprite) {
        spriteHand = spriteHand.filter(function(obj) {
            return obj.sprite !== sprite;
        });

        var x = 0;
        spriteHand.forEach(function(obj) {
            x += 110;
            obj.sprite.x = x;
        });
        sprite.unsubscribe();
    }

    subpub.on('server/cribCards', function(numCards) {
        console.log('addToCrib');
        var x = canvas.width - 300;
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
        spriteCutCard = new Sprite(cardImages[card.id], context);
        spriteCutCard.y = 50;
        spriteCutCard.x = canvas.width - 110;
        spriteCutCard.scale = 0.2;
    });

    subpub.on('server/cutDeck', function(data) {
        turnText.text = data.name + ' is cutting the deck!';
        if (data.clientId === globals.clientId) {
            console.log('choosing cutCard');
            var cardSprite = new Sprite(arrowImage, context);
            var deckSprite = new Sprite(deckImage, context);
            deckSprite.scale = 0.2;
            deckSprite.x = canvas.width - deckSprite.w * deckSprite.scale *1.5;
            deckSprite.y = 50;
            cardSprite.scale = 0.2;
            cardSprite.x = deckSprite.x + deckSprite.w * deckSprite.scale;
            cardSprite.y = deckSprite.y - (cardSprite.h * cardSprite.scale / 2);

            function mouseMoveCutDeck(event) {
                var y = event.pageY - canvas.offsetTop;
                cardSprite.y = 3 + deckSprite.y - (cardSprite.h * cardSprite.scale / 2) + (deckSprite.h * deckSprite.scale * 0.25 * y / canvas.height);
            }

            function mouseClickCutDeck(event) {
                canvas.removeEventListener('mouseClick', mouseMoveCutDeck);
                canvas.removeEventListener('click', mouseClickCutDeck);

                deckSprite.unsubscribe();
                cardSprite.unsubscribe();

                var y = event.pageY - canvas.offsetTop;
                subpub.emit('toServer', {
                    event: 'doneCutDeck',
                    data: Math.floor(y / canvas.height * data.numCards)
                });
            }

            canvas.addEventListener('mousemove', mouseMoveCutDeck);
            canvas.addEventListener('click', mouseClickCutDeck);
        }
    });

    subpub.on('server/countHand', function(data) {
        turnText.text = data.name + ' is counting their hand!';
        spriteHand.forEach(function(card) {
            card.sprite.unsubscribe();
        });
        spriteHand = [];
        spritePeg.forEach(function(sprite) {
            sprite.unsubscribe();
        });
        spritePeg = [];
        if (plusSprite) {
            plusSprite.unsubscribe();
            plusSprite = null;
        }
        if (clearSprite) {
            clearSprite.unsubscribe();
            clearSprite = null;
        }
        if (checkSprite) {
            checkSprite.unsubscribe();
            checkSprite = null;
        }
        if (pegText) {
            pegText.unsubscribe();
            pegText = null;
        }

        if (data.clientId === globals.clientId) {
            var selectedCards = [];
            var x = 0;
            var y = canvas.height - 150;
            data.hand.forEach(function(card) {
                var sprite = new Sprite(cardImages[card.id], context);
                var selected = false;
                x += 110;
                sprite.x = x;
                sprite.y = y;
                sprite.scale = 0.2;
                sprite.onClick = function() {
                    if (!selected) {
                        selectedCards.push(card);
                        sprite.y -= 20;
                        selected = true;
                    } else {
                        selectedCards = selectedCards.filter(function(card2) {
                            return card.id !== card2.id;
                        });
                        sprite.y += 20;
                        selected = false;
                    }
                };
                spriteHand.push({
                    sprite: sprite,
                    card: card
                });
            });
            var cutCardSelected = false;
            spriteCutCard.onClick = function() {
                if (!cutCardSelected) {
                    selectedCards.push(data.cutCard);
                    spriteCutCard.y -= 20;
                    cutCardSelected = true;
                } else {
                    selectedCards = selectedCards.filter(function(card2) {
                        return data.cutCard.id !== card2.id;
                    });
                    spriteCutCard.y += 20;
                    cutCardSelected = false;
                }
            };

            //temp!!!!!
            plusSprite = new Sprite(plus, context);
            plusSprite.x = 110 * 5;
            plusSprite.y = canvas.height * 3 / 4;
            plusSprite.scale = 0.1;
            plusSprite.onClick = function() {
                subpub.emit('toServer', {
                    event: 'countCards',
                    data: selectedCards
                });
            };
            clearSprite = new Sprite(clear, context);
            clearSprite.x = 110 * 6;
            clearSprite.y = canvas.height * 3 / 4;
            clearSprite.scale = 0.1;
            clearSprite.onClick = function() {
                subpub.emit('toServer', {
                    event: 'clearCardCount'
                });
            };
            checkSprite = new Sprite(check, context);
            checkSprite.x = 110 * 7;
            checkSprite.y = canvas.height * 3 / 4;
            checkSprite.scale = 0.1;
            checkSprite.onClick = function() {
                subpub.emit('toServer', {
                    event: 'doneCountingCards'
                });
            };
        } else {
            var a = 0;
            data.hand.forEach(function(card) {
                var sprite = new Sprite(cardImages[card.id], context);
                a += 110;
                sprite.x = a;
                sprite.y = canvas.height - 150;
                sprite.scale = 0.2;
                spriteHand.push({
                    sprite: sprite,
                    card: card
                });
            });
        }

    });

    subpub.on('server/pointsAccumulated', function(data) {
        if (!pointsAccumulated) {
            pointsAccumulated = new Text(context);
            pointsAccumulated.x = 30;
            pointsAccumulated.y = canvas.height - 100;
        }
        pointsAccumulated.text = '' + data;
    });

    subpub.on('server/countCrib', function(data) {
        turnText.text = data.name + ' is counting their crib!';
        spriteHand.forEach(function(card) {
            card.sprite.unsubscribe();
        });
        spriteHand = [];
        spritePeg.forEach(function(sprite) {
            sprite.unsubscribe();
        });
        spritePeg = [];
        spriteCrib.forEach(function(sprite) {
            sprite.unsubscribe();
        });
        spriteCrib = [];
        if (plusSprite) {
            plusSprite.unsubscribe();
            plusSprite = null;
        }
        if (clearSprite) {
            clearSprite.unsubscribe();
            clearSprite = null;
        }
        if (checkSprite) {
            checkSprite.unsubscribe();
            checkSprite = null;
        }


        if (data.clientId === globals.clientId) {
            var selectedCards = [];
            var x = 0;
            var y = canvas.height - 150;
            data.hand.forEach(function(card) {
                var sprite = new Sprite(cardImages[card.id], context);
                var selected = false;
                x += 110;
                sprite.x = x;
                sprite.y = y;
                sprite.scale = 0.2;
                sprite.onClick = function() {
                    if (!selected) {
                        selectedCards.push(card);
                        sprite.y -= 20;
                        selected = true;
                    } else {
                        selectedCards = selectedCards.filter(function(card2) {
                            return card.id !== card2.id;
                        });
                        sprite.y += 20;
                        selected = false;
                    }
                };
                spriteHand.push({
                    sprite: sprite,
                    card: card
                });
            });
            var cutCardSelected = false;
            spriteCutCard.onClick = function() {
                if (!cutCardSelected) {
                    selectedCards.push(data.cutCard);
                    spriteCutCard.y -= 20;
                    cutCardSelected = true;
                } else {
                    selectedCards = selectedCards.filter(function(card2) {
                        return data.cutCard.id !== card2.id;
                    });
                    spriteCutCard.y += 20;
                    cutCardSelected = false;
                }
            };

            //temp!!!!!
            plusSprite = new Sprite(plus, context);
            plusSprite.x = 110 * 5;
            plusSprite.y = canvas.height * 3 / 4;
            plusSprite.scale = 0.1;
            plusSprite.onClick = function() {
                subpub.emit('toServer', {
                    event: 'countCards',
                    data: selectedCards
                });
            };
            clearSprite = new Sprite(clear, context);
            clearSprite.x = 110 * 6;
            clearSprite.y = canvas.height * 3 / 4;
            clearSprite.scale = 0.1;
            clearSprite.onClick = function() {
                subpub.emit('toServer', {
                    event: 'clearCardCount'
                });
            };
            checkSprite = new Sprite(check, context);
            checkSprite.x = 110 * 7;
            checkSprite.y = canvas.height * 3 / 4;
            checkSprite.scale = 0.1;
            checkSprite.onClick = function() {
                subpub.emit('toServer', {
                    event: 'doneCountingCards'
                });
            };
        } else {
            var a = 0;
            data.hand.forEach(function(card) {
                var sprite = new Sprite(cardImages[card.id], context);
                a += 110;
                sprite.x = a;
                sprite.y = canvas.height - 150;
                sprite.scale = 0.2;
                spriteHand.push({
                    sprite: sprite,
                    card: card
                });
            });
        }

    });

    subpub.on('server/gameOver', function() {
        var winText = new Text(context);
        winText.x = canvas.width / 2;
        winText.y = canvas.height / 2;
        winText.text = name + "Game Over!!!";
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