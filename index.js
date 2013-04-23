
var run = exports._exp = {}
  , once = {};

/**
 * Begin the run
 */

exports.begin = function(){
  return run.currentRunLoop = new RunLoop(run.currentRunLoop);
};

/**
 * This will trigger the run to begin
 * which will initiate all the queues and
 * flushing of those queues.
 */

exports.end = function(){
  run.currentRunLoop.end();
  run.currentRunLoop = run.currentRunLoop.prev();
};

/**
 * Public API to running a run. This
 * automatically handles the starting
 * and stopping of the loop.
 *
 * @param  {Function} callback
 */

exports.run = function(target, method){
  exports.begin();

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
    exports.end();
  }
};

exports.scheduleOnce = function(queue, target, method){
  if ('string' === typeof method) method = target[method];

  var o = once[target] = {
      queue: queue
    , target: target
    , method: method
  };

  run.autorun();

  run.currentRunLoop.schedule(queue, target, method);
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
  run.queues.push(name);
};

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

run.currentRunLoop = null;

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
  if (run.currentRunLoop) { run.end(); }
}

/**
 * Autorun the RunLoop.
 * 
 * This will create a new RunLoop if non exists.
 */

run.autorun = function(){
  if (!run.currentRunLoop) {
    exports.begin();
    if (!scheduleAutorun) {
      // XXX: http://paulirish.com/2011/requestanimationframe-for-smart-animating/
      // nextTick(autorun, 1)
      var scheduleAutorun = setTimeout(autorun, 1);
    }
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
  this.queues = run.queues;
}

/**
 * Schedule a queue only once.
 *
 * @param  {String} queue
 * @param  {Object} target
 * @param  {Function} method
 */

RunLoop.prototype.schedule = function(queue, target, method){
  var self = this;

  if (!this._queues[queue]) this._queues[queue] = [];

  if (0 === this._queues[queue].length) {
    this._queues[queue].push({
        target: target
      , method: method
    });
  }
  var found = false;

  this._queues[queue].forEach(function(q){
    if (q.target[0] === target[0] && q.target[1] === target[1]) {
      q.target = target;
      q.method = method;
      found = true;
    }
  });

  if (found === false) {
    self._queues[queue].push({
        target: target
      , method: method
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

RunLoop.prototype.end = function(){
  this.flush();
};

/**
 * Flush all the queues.
 */

RunLoop.prototype.flush = function(){
  var self = this;

  run.queues.forEach(function(queueName){
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