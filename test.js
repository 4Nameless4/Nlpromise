var promisesAplusTests = require("promises-aplus-tests");
var nlpromise = require("./index.js");
const Nlpromise = require("./index.js");

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
  const count = (err && err.failures) || 0;
  console.log("error count:", count);
  // All done; output is in the console. Or check `err` for number of failures.
  if (count !== 0) return;

  function fun1(s) {
    return s;
  }

  Nlpromise.resolve()
    .then(() =>
      test
        .all([
          1,
          fun1,
          {
            then(res) {
              res(3);
            },
          },
          new test((res) => res(4)).then((d) => d + 1),
        ])
        .then((d) => {
          console.log("start all function");
          console.log(d[0] === 1 && d[1] === fun1 && d[2] === 3 && d[3] === 5);
        })
    )
    .then(() =>
      test
        .all([
          1,
          (s) => s,
          new test((res, rej) => rej("error")),
          {
            then(res) {
              res(3);
            },
          },
          new test((res) => res(4)).then((d) => d + 1),
        ])
        .then(null, (d) => {
          console.log("start all function 2");
          console.log(d === "error");
        })
    )
    .then(() =>
      test
        .race([
          new test((res) => setTimeout(() => res(1), 20)),
          new test((res) => res(2)),
        ])
        .then(
          (d) => {
            console.log("start race function");
            console.log(d === 2);
          },
          (d) => {
            console.log("start race function");
            console.log("error");
          }
        )
    )
    .then(() =>
      test
        .race([
          new test((res) => setTimeout(() => res(1), 20)),
          new test((res, rej) => rej(2)),
        ])
        .then(
          (d) => {
            console.log("start race function 2");
            console.log("error");
          },
          (d) => {
            console.log("start race function 2");
            console.log(d === 2);
          }
        )
    )
    .then(() =>
      test
        .allSettld([
          new test((res) => setTimeout(() => res(1), 20)),
          new test((res, rej) => rej(2)),
        ])
        .then(
          (d) => {
            console.log("start race function");
            console.log(d[0] === 1 && d[1] === 2);
          },
          (d) => {
            console.log("start race function");
            console.log("error");
          }
        )
    );
});
