/**
 * Module Exports
 */

var exports = module.exports = {}
  , run = exports._exp = {}
  , once = {};


/**
 * Public API to running a run. This
 * automatically handles the starting
 * and stopping of the loop.
 *
 * @param  {Function} callback
 */

exports.run = function(target, method) {
    run.begin();

    if (!method) {
      method = target;
      target = undefined;
    }

    if (typeof method !== 'function') {
      throw new Error("Parameter passed to run must be a function.");
    }


    try {
      if (method || target) {
        return method.apply(target || {});
      }
    } finally {
      run.end();
    }
};



exports.scheduleOnce = function(queue, target, method) {

  if (typeof method === 'string') {
    method = target[method];
  }

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

exports.addQueue = function(name) {
  run.queues.push(name);
};

/**
 * Begin the run
 */

run.begin = function() {

  return run.currentRunLoop = new RunLoop(run.currentRunLoop);
};

/**
 * This will trigger the run to begin
 * which will initiate all the queues and
 * flushing of those queues.
 */

run.end = function() {

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

var scheduleAutorun = false;

function autorun() {
  scheduleAutorun = null;
  if (run.currentRunLoop) { run.end(); }
}

run.autorun = function() {

  if (!run.currentRunLoop) {

    run.begin();
    if (!scheduleAutorun) {
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
  this.prev = prev || null;
  this._queues = {};
  this.queues = run.queues;
}


RunLoop.prototype.schedule = function(queue, target, method) {

  if (!this._queues[queue]) {
    this._queues[queue] = [];
  }

  this._queues[queue].push({ target: target, method: method });
};


RunLoop.prototype.prev = function() {
  return this.prev;
};

RunLoop.prototype.end = function() {
  this.flush();
};

RunLoop.prototype.flush = function() {

};
