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

function Promise(resolver) {
    var self = this;

    if (!isObject(self)) {
        throw Error('create promise from new');
    }

    if (!isFunction(resolver)) {
        throw Error('resolver must be function');
    }

    self._status = Promise.PENDING;
    self._result = null;
    self._callbacks = [];

    if (resolver === noop) {
        return;
    }

    try {
        resolver(function (value) {
            resolve(self, value);
        }, function (reason) {
            reject(self, reason);
        });
    } catch (error) {
        reject(self, error);
    }
}

Promise.PENDING = 'pending';
Promise.REJECTED = 'rejected';
Promise.FULFILLED = 'fulfilled';

Promise.prototype = {
    then: function(onFulfilled, onRejected) {
        var promise = new Promise(noop);

        if (this._status === Promise.PENDING) {
            listen(this, callback);
        } else {
            nextTick(this, callback);
        }

        function callback() {
            var self = this,
                x;

            if (self._status === Promise.REJECTED) {
                x = isFunction(onRejected) && onRejected(self._result);
            } else {
                x = isFunction(onFulfilled) && onFulfilled(self._result);
            }

            if (isError(x)) {
                reject(promise, x);
            } else {
                resolveX(promise, x);
            }
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

function listen(promise, callback) {
    promise._callbacks.push(callback);
}

function trigger(promise) {
    var callbacks = promise._callbacks,
        i = -1,
        len = callbacks.length;

    while (++i < len) {
        callbacks[i].call(promise);
    }
}

function resolveX(promise, x) {
    if (promise === x) {
        reject(promise, Error('a promise cannot be resolved with itself'));
    } else if (x instanceof Promise) {
        if (x._status === Promise.PENDING) {
            listen(x, callback);
        } else {
            nextTick(x, calback);
        }
    } else if (isObject(x) || isFunction(x)) {
        if (!isFunction(obj.then)) {
            reject(promise, Error('x is not thenable'));
        } else {
            try {
                x.then(function (value) {
                    resolveX(promise, value);   
                }, function (reason) {
                    reject(promise, reason);
                });
            } catch (error) {
                reject(promise, error);
            }
        }
    } else {
        resolve(promise, x);
    }

    function callback() {
        var self = this;

        if (self._status === Promise.REJECTED) {
            reject(promise, self._result);
        } else {
            resolve(promise, self._result);
        }
    }
}

window.Promise = Promise;

})(window);