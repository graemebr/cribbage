//based on:
//  http://addyosmani.com/resources/essentialjsdesignpatterns/book/#observerpatternjavascript
//  http://stackoverflow.com/questions/5527972/how-to-implement-event-driven-javascript-without-involving-any-dom-element

var subpub = (function() {
    //counter used to give each subcription a unique id (for unsubscribing)
    var subscriptionID = -1;
    //dictionary of all the events -> list of their subscribers
    var events = {};
    return {
        publish: function(event, data) {
            if (events[event]) {
                for (var i = 0; i < events[event].length; i++) {
                    //put a try catch so if one subscriber fails the others will still execute.
                    try {
                        //using call just removes the callback's ability to access the events[event][i] object properties
                        events[event][i].callback.call(null, data);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        },
        subscribe: function(event, callback) {
            if (!events[event]) {
                //no subscriptions have been added for this even yet
                //add a list of subscribers to that event
                events[event] = [];
            }

            //add subscription to event's list
            events[event].push({
                id: ++subscriptionID,
                callback: callback
            });

            //id for unsubscribing
            return subscriptionID;
        },
        unsubscribe: function(id) {
            for (var i in events) {
                if (events.hasOwnProperty(i)) {
                    for (var j = 0; j < events[i].length; j++) {
                        if (events[i][j].id == id) {
                            //subscriptionID found in events object
                            //remove this object from the event's list
                            events[i].splice(j, 1);
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    };
})();