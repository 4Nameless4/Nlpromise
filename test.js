var promisesAplusTests = require("promises-aplus-tests");
var nlpromise = require("./index.js");

const test = nlpromise;
test.defer = test.deferred = function () {
  const de = {};
  de.promise = new test((res, rej) => {
    de.resolve = res;
    de.reject = rej;
  });
  return de;
};

promisesAplusTests(test, function (err) {
  console.log(err && err.failures || 0)
  // All done; output is in the console. Or check `err` for number of failures.
});
