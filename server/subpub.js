// Global subpub for events

var EventEmitter = require('events').EventEmitter;
var subpub = new EventEmitter();

module.exports = subpub;