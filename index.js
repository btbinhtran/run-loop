/**
 * Module Exports
 */

var exports = module.exports = {}
  , Runloop = {};

/**
 * Public API to running a Runloop. This
 * automatically handles the starting
 * and stopping of the loop.
 *
 * @param  {Function} callback
 */

exports.run = function(callback) {
    Runloop.start();
    callback.apply(Runloop, [Runloop]);
    Runloop.end();
};

/**
 * Add a new queue to the system. This
 * will always push the new queue to
 * the end of the pipe.
 *
 * XXX: Provide a way to specify it's
 *      placement in the pipe.
 *
 * @param {String} name
 */

exports.addQueue = function(name) {
  Runloop.queues.push(name);
};

/**
 * Begin the Runloop
 */

Runloop.start = function() {

  // Initialize the queue arrays.
  Runloop.queues.forEach(function(queue) {
    Runloop.queue[queue] = [];
  });

};

/**
 * This will trigger the Runloop to begin
 * which will initiate all the queues and
 * flushing of those queues.
 */

Runloop.end = function() {

};

/**
 * List of queues. This can be extended
 * by a public method `addQueue`
 *
 * @type {Array}
 */

Runloop.queues = ['sync'];

/**
 * Hold all of the actual queues for each
 * queue type.
 *
 * @type {Object}
 */

Runloop.queue  = {};

