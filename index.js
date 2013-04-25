
/**
 * Expose `run`.
 */

exports = module.exports = run;

function run(fn){
  return exports.run(fn);
}

/**
 * List of queues. This can be extended
 * by a public method `addQueue`
 *
 * @type {Array}
 */

exports.queues = ['sync'];

/**
 * Current RunLoop
 *
 * @type {RunLoop}
 */

exports.current = undefined;

/**
 * Object of Batches
 *
 * @type {Object}
 */

exports.batches = {};

/**
 * Begin the run
 */

exports.create = function(){
  return exports.current = new RunLoop(exports.current);
};

/**
 * This will trigger the run to begin
 * which will initiate all the queues and
 * flushing of those queues.
 */

exports.flush = function(){
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

exports.run = function(target, method){
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

exports.batch = function(queue, target, id, method){
  if ('string' === typeof method) method = target[method];

  if (exports.batches[target] && exports.batches[target].id === id) {
    return;
  }

  var currentBatch = exports.batches[target] = {
      queue: queue
    , target: target
    , method: method
    , id: id
  };

  exports.autorun();

  exports.current.batch(currentBatch);
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

exports.addQueue = function(name){
  exports.queues.push(name);
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

exports.autorun = function(){
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
    self._queues[queueName] && self._queues[queueName].forEach(function(ctx){
      ctx.method.apply(ctx.target, [ctx.target]);
    });
  });

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