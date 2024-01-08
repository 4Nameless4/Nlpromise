"use strict";

var states = {
  PENDING: 0,
  FULFILLED: 1,
  REJECTED: 2,
};

function isType(val, type) {
  return val && typeof val === type;
}
function isFunction(val) {
  return isType(val, "function");
}
function isObjectOrFunction(val) {
  return isType(val, "object") || isFunction(val);
}
function isPending(state) {
  return state === states.PENDING;
}
function onFulfilledDefault(val) {
  return val;
}
function onRejectedDefault(e) {
  throw e;
}

function Nlpromise(executor) {
  var that = this;
  if (!(that instanceof Nlpromise)) {
    throw new TypeError(
      "Class constructor d cannot be invoked without 'new' at eval"
    );
  }

  that.state = states.PENDING;
  that.result = undefined;
  var queue = [];

  function exe(value, state) {
    if (!isPending(that.state)) return;
    that.state = state;
    that.result = value;
    next();
  }
  function resolve(value) {
    exe(value, states.FULFILLED);
  }
  function reject(value) {
    exe(value, states.REJECTED);
  }

  function _next(getValue, queue_next) {
    try {
      var nextResolve = queue_next.nextResolve;
      var nextReject = queue_next.nextReject;
      var nextPromise = queue_next.nextPromise;
      var value = getValue();
      // called -> {then:(res)=>{res("something");throw "error"}}
      var called = false;
      var then = null;
      if (value && nextPromise === value) {
        throw new TypeError("Chaining cycle");
      } else if (
        isObjectOrFunction(value) &&
        (then = value.then) &&
        isFunction(then)
      ) {
        then.call(
          value,
          (v) => {
            if (called) return;
            called = true;
            // _next -> {then:(res)=>{res({then:(rej)=>rej("hh")});}}
            setTimeout(() => _next(() => v, queue_next));
          },
          (v) => {
            if (called) return;
            called = true;
            nextReject(v);
          }
        );
      } else {
        nextResolve(value);
      }
    } catch (e) {
      if (called) return;
      nextReject(e);
    }
  }

  function next() {
    if (isPending(that.state) || queue.length <= 0) return;
    setTimeout(() => {
      while (queue.length) {
        var queue_next = queue.shift();

        var call = queue_next[that.state];
        _next(() => call(that.result), queue_next);
      }
    });
  }

  function then(onFulfilled, onRejected, nextResolve, nextReject, nextPromise) {
    queue.push({
      [states.FULFILLED]: onFulfilled,
      [states.REJECTED]: onRejected,
      nextResolve,
      nextReject,
      nextPromise,
    });
    next();
  }

  Object.defineProperty(that, "__then__", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: then,
  });
  try {
    executor.call(that, resolve, reject);
  } catch (e) {
    reject(e);
  }
}
Nlpromise.prototype.then = function (onFulfilled, onRejected) {
  var that = this;
  var fulfilled = isFunction(onFulfilled) ? onFulfilled : onFulfilledDefault;
  var rejected = isFunction(onRejected) ? onRejected : onRejectedDefault;

  return new Nlpromise(function (resolve, reject) {
    that.__then__(fulfilled, rejected, resolve, reject, this);
  });
};

module.exports = Nlpromise;
