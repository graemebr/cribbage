function Text(context) {
    this.text = '';
    this.context = context;
    this.x = 0;
    this.y = 0;
    this.scale = 1;
    this.rotation = 0;
    this.font = "20px Georgia";
    this.subscriptionIDs = [];
    this.subscriptionIDs.push(subpub.on('canvasUpdate', (function(time) {
        this.update(time);
    }).bind(this)));
    this.subscriptionIDs.push(subpub.on('canvasDraw', (function() {
        this.draw();
    }).bind(this)));
}

Text.prototype.update = function() {
    //dummy
};

Text.prototype.draw = function() {
    this.context.save();
    this.context.translate(this.x, this.y);
    this.context.rotate(this.rotation * Math.PI / 180);
    this.context.scale(this.scale, this.scale);
    this.context.font =this.font;
    this.context.fillText(this.text,0,0);
    this.context.restore();
};

Text.prototype.unsubscribe = function() {
    this.subscriptionIDs.forEach(function(id) {
        subpub.off(id);
    });
};