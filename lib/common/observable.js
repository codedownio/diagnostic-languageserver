"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitMap = void 0;
var rxjs_1 = require("rxjs");
/**
 *
 * if inner observable hasn't complete, and source observable trigger new value, the
 * inner observable's value will be abandon. and after inner observable complete the
 * lastest source observable value will be trigger.
 *
 */
function waitMap(fn) {
    return function (preObs) {
        return rxjs_1.Observable.create(function (observer) {
            var closed = false;
            var latestRes;
            var resultSubp;
            var subp;
            var run = function (res) {
                var obs = fn(res);
                return obs.subscribe({
                    next: function (res) {
                        if (!latestRes) {
                            observer.next(res);
                        }
                    },
                    error: function (err) {
                        closed = true;
                        observer.error(err);
                        resultSubp.unsubscribe();
                    },
                    complete: function () {
                        if (latestRes && !closed) {
                            var res_1 = latestRes;
                            latestRes = undefined;
                            run(res_1);
                        }
                    }
                });
            };
            resultSubp = preObs.subscribe({
                next: function (res) {
                    latestRes = res;
                    if (!subp || subp.closed) {
                        latestRes = undefined;
                        subp = run(res);
                    }
                },
                error: function (err) {
                    closed = true;
                    observer.error(err);
                },
                complete: function () {
                    closed = true;
                    observer.complete();
                }
            });
            return resultSubp;
        });
    };
}
exports.waitMap = waitMap;