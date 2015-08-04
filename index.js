;(function (window, undefined) {

function noop() {};

function isFunction (obj) {
    return typeof obj === 'function';
}

function isObject(obj) {
    return typeof obj === 'object' && obj !== null;
}

function isError(obj) {
    return typeof obj === 'error';
}

function nextTick(context, callback) {
    setTimeout(function () {
        callback.call(context);
    }, 0);
}

function listen(context, callback) {
    var callbacks = context._callbacks;

    if (callbacks === void 0) {
        callbacks = context._callbacks = [];
    }

    callbacks.push(callback);
}

function trigger(context) {
    var callbacks = context._callbacks,
        i,
        len;

    if (callbacks === void 0) {
        return;
    }

    i = -1;
    len = callbacks.length;

    while (++i < len) {
        callbacks[i].call(context);
    }
}

function bind(context, callback) {
    return function () {
        callback.apply(context, arguments);
    }
}

function Promise(resolver) {
    var self = this;

    if (!isObject(self)) {
        throw TypeError('Promises must be constructed via new');
    }

    if (!isFunction(resolver)) {
        throw TypeError('resolver is not a function');
    }

    self._status = Promise.PENDING;
    self._result = null;

    if (resolver === noop) {
        return;
    }

    doResolve(resolver, self);
}

Promise.PENDING = 'pending';
Promise.REJECTED = 'rejected';
Promise.FULFILLED = 'fulfilled';

Promise.prototype = {
    then: function(onFulfilled, onRejected) {
        var self = this,
            promise = new Promise(noop);

        function callback() {
            var self = this,
                x;

            if (self._status === Promise.REJECTED) {
                if (isFunction(onRejected)) {
                    x = onRejected(self._result);
                } else {
                    resolve(promise, self._result);
                    return;
                }
            } else {
                if (isFunction(onFulfilled)) {
                    x = onFulfilled(self._result);
                } else {
                    reject(promise, self._result);
                    return;
                }
            }

            if (isError(x)) {
                reject(promise, x);
            } else {
                resolveX(promise, x);
            }
        }

        if (self._status === Promise.PENDING) {
            listen(self, callback);
        } else {
            nextTick(self, callback);
        }

        return promise;
    }
};

function resolve(promise, value) {
    if (promise._status !== Promise.PENDING) {
        return;
    }

    promise._status = Promise.FULFILLED;
    promise._result = value;

    trigger(promise);
}

function reject(promise, reason) {
    if (promise._status !== Promise.PENDING) {
        return;
    }

    promise._status = Promise.REJECTED;
    promise._result = reason;

    trigger(promise);
}

function resolveX(promise, x) {
    function callback() {
        var self = this;

        if (self._status === Promise.REJECTED) {
            reject(promise, self._result);
        } else {
            resolve(promise, self._result);
        }
    }

    if (promise === x) {
        reject(promise, TypeError('A promise cannot be resolved with itself.'));
    } else if (x instanceof Promise) {
        if (x._status === Promise.PENDING) {
            listen(x, callback);
        } else {
            nextTick(x, calback);
        }
    } else if (isObject(x) || isFunction(x)) {
        if (!isFunction(x.then)) {
            resolve(promise, x);
        } else {
            doResolve(bind(x, x.then), promise);
        }
    } else {
        resolve(promise, x);
    }
}

function doResolve(resolver, promise) {
    var done = false;
    
    try {
        resolver(function (value) {
            if (!done) {
                done = true;
                resolveX(promise, value);
            }
        }, function (reason) {
            if (!done) {
                done = true;
                reject(promise, reason);
            }
        });
    } catch (error) {
        if (!done) {
            done = true;
            reject(promise, error);
        }
    }
}

window.Promise = Promise;

})(window);