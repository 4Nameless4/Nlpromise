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
function isObject(val) {
  return isType(val, "object");
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
let count = 1;
function Nlpromise(executor) {
  var that = this;
  if (!(that instanceof Nlpromise)) {
    throw new TypeError(
      "Class constructor d cannot be invoked without 'new' at eval"
    );
  }

  that.id = count++;

  that.state = states.PENDING;
  that.result = undefined;
  that.queue = [];

  function resolve(value) {
    if (!isPending(that.state)) return;
    that.state = states.FULFILLED;
    that.result = value;
    next();
  }
  function reject(value) {
    if (!isPending(that.state)) return;
    that.state = states.REJECTED;
    that.result = value;
    next();
  }

  function _next_fun(
    value,
    nextResolve,
    nextReject,
    nextPromise,
    type = false
  ) {
    function _() {
      try {
        var called = false;
        var then = null;
        if (value && nextPromise === value) {
          throw new TypeError("Chaining cycle");
        } else if (
          (isObject(value) || isFunction(value)) &&
          (then = value.then) &&
          isFunction(then)
        ) {
          then.call(
            value,
            (v) => {
              if (called) return;
              called = true;
              _next_fun(v, nextResolve, nextReject, nextPromise, true);
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
    if (type) {
      setTimeout(_);
    } else {
      _();
    }
  }

  function next() {
    if (isPending(that.state) || that.queue.length <= 0) return;
    setTimeout(() => {
      while (that.queue.length) {
        var _next = that.queue.shift();

        var call =
          that.state === states.FULFILLED
            ? _next.onFulfilled
            : _next.onRejected;
        var nextResolve = _next.nextResolve;
        var nextReject = _next.nextReject;
        var nextPromise = _next.nextPromise;

        try {
          //   if (call === null) {
          //     that.state === states.FULFILLED
          //       ? nextResolve(that.result)
          //       : nextReject(that.result);
          //   }
          var value = call(that.result);
          _next_fun(value, nextResolve, nextReject, nextPromise);
          //   var then = null;

          //   if (value && nextPromise === value) {
          //     throw new TypeError("Chaining cycle");
          //   } else if (
          //     (isObject(value) || isFunction(value)) &&
          //     (then = value.then) &&
          //     isFunction(then)
          //   ) {
          //     then.call(value, nextResolve, nextReject);
          //   } else {
          //     nextResolve(value);
          //   }
        } catch (e) {
          nextReject(e);
        }
      }
    });
  }

  function then(onFulfilled, onRejected, nextResolve, nextReject, nextPromise) {
    that.queue.push({
      onFulfilled,
      onRejected,
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

const sentinel = { sentinel: "sentinel" };

var p1 = new Promise((res) => res("1"));
var p2 = p1.then(function () {
  console.log("1");
  return {
    then: function (onFulfilled) {
      console.log("2");
      onFulfilled({
        then: function (onFulfilled) {
          console.log("3");
          onFulfilled(sentinel);
          console.log("3-1");
          throw "hhhh";
        },
      });
      console.log("2-1");
    },
  };
});
var p3 = p2.then(function (d) {
  console.log("done", d === sentinel);
});

p3.then(() => {
  var p1 = new Nlpromise((res) => res("1"));
  var p2 = p1.then(function () {
    console.log("1");
    return {
      then: function (onFulfilled) {
        console.log("2");
        onFulfilled({
          then: function (onFulfilled) {
            console.log("3");
            onFulfilled(sentinel);
            console.log("3-1");
            throw "hhhh";
          },
        });
        console.log("2-1");
      },
    };
  });
  var p3 = p2.then(function (d) {
    console.log("done", d === sentinel);
  });
});
