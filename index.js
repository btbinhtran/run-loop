/**
 * Module Dependencies
 */

var Emitter = require('emitter');

/**
 * Expose `run`.
 */

exports = module.exports = run;

/**
 * Create a new runloop and run a callback within it.
 *
 * @param  {Function} fn
 * @return {RunLoop}
 */

function run(fn){
  return run.run(fn);
}

/**
 * Provide Emitter for run
 */

Emitter(run);

/**
 * List of queues. This can be extended
 * by a public method `addQueue`
 *
 * @type {Array}
 */

run.queues = ['sync'];

/**
 * Current RunLoop
 *
 * @type {RunLoop}
 */

run.current = undefined;

/**
 * Object of Batches
 *
 * @type {Object}
 */

run.batches = {};

/**
 * Begin the run
 */

run.create = function(){
  exports.current = new RunLoop(exports.current);
  run.emit('created', exports.current);
  return exports.current;
};

/**
 * This will trigger the run to begin
 * which will initiate all the queues and
 * flushing of those queues.
 */

run.flush = function(){
  exports.current.run();
  exports.current = exports.current.prev();
};

/**
 * Public API to running a exports. This
 * automatically handles the starting
 * and stopping of the loop.
 *
 * @param  {Function} callback
 */

run.run = function(target, method){
  exports.create();

  if (!method) {
    method = target;
    target = undefined;
  }

  if ('function' !== typeof method) {
    throw new Error("Parameter passed to run must be a function.");
  }

  try {
    if (method || target) {
      return method.apply(target || {});
    }
  } finally {
    exports.flush();
  }
};


/**
 * Add a new batch to the runloop.
 *
 * @param  {String} queue
 * @param  {Any} target
 * @param  {Integer} id
 * @param  {Function/String} method
 */

run.batch = function(queue, target, id, method){
  if ('string' === typeof method) method = target[method];

  if (exports.batches[target] && exports.batches[target].id === id) {
    return;
  }

  var currentBatch = run.batches[target] = {
      queue: queue
    , target: target
    , method: method
    , id: id
  };

  exports.autorun();

  exports.current.batch(currentBatch);
};

/**
 * Add a permanent queue to the 'queue' queue. (need to rephrase it)
 *
 * @param {Name}   queue
 * @param {Function} callback
 */

run.add = function(queue, callback) {
  run.on('created', function(instance) {
    if (!instance._queues[queue]) instance._queues[queue] = [];
    instance._queues[queue].push({
      queue: queue
      , method: callback
    });
  });
};

/**
 * If we are scheduling an autorun
 * method.
 *
 * @type {Boolean}
 */

var scheduleAutorun = false;

/**
 * Autorun Function
 */

function autorun() {
  scheduleAutorun = null;
  if (exports.current) { exports.flush(); }
}

/**
 * Autorun the RunLoop.
 *
 * This will create a new RunLoop if non exists.
 */

run.autorun = function(){
  if (exports.current) return;

  exports.create();

  if (!scheduleAutorun) {
    // XXX: http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // nextTick(autorun, 1)
    scheduleAutorun = setTimeout(autorun, 1);
  }
};

/**
 * Runloop Constructor.
 *
 * @param {Runloop} prev
 */

function RunLoop(prev) {
  this._prev = prev || null;
  this._queues = {};
  this.queues = exports.queues;



}

/**
 * Expose Emitter
 */

Emitter(RunLoop.prototype);

/**
 * Schedule a queue only once.
 *
 * @param  {String} queue
 * @param  {Object} target
 * @param  {Function} method
 */

RunLoop.prototype.batch = function(batch){
  var self = this;

  if (!this._queues[batch.queue]) this._queues[batch.queue] = [];

  if (0 === this._queues[batch.queue].length) {
    this._queues[batch.queue].push({
        target: batch.target
      , method: batch.method
      , id: batch.id
    });
  }

  var found = false;

  this._queues[batch.queue].forEach(function(q){
    if (q.target !== batch.target) return;
    if (q.target === batch.target && q.id === batch.id) {
      q.target = batch.target;
      q.method = batch.method;
      q.id     = batch.id;
      found = true;
    }
  });

  if (found === false) {
    self._queues[batch.queue].push({
        target: batch.target
      , method: batch.method
      , id: batch.id
    });
  }
};

/**
 * Return the previous RunLoop
 *
 * @return {RunLoop}
 */

RunLoop.prototype.prev = function(){
  return this._prev;
};

/**
 * Begin the RunLoop
 */

RunLoop.prototype.run = function(){
  this.flush();
};

/**
 * Flush all the queues.
 */

RunLoop.prototype.flush = function(){
  var self = this;

  exports.queues.forEach(function(queueName){
    self._queues[queueName] && self._queues[queueName].forEach(function(ctx, i){
      ctx.method.apply(ctx.target || {}, ctx.target && [ctx.target] || []);
      delete self._queues[queueName][i];
    });
  });

  run.batches = {};

  return this;
};

// XXX: maybe a `part/next-tick` module?
var nextTick;

if ('undefined' === typeof window) {
  nextTick = process.nextTick;
} else {
 nextTick = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || function(fn) { window.setTimeout(callback, 1000 / 60); };
}