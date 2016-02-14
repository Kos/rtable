export default class MockPromise {
  // TODO this hack needs to be replaced with a hack that passes the Promises/A+ suite
  constructor() {
    this.callbacks = {onFulfilled: [], onRejected: []};
    this.state = 'pending';
    this.value = null;
    this.reason = null;
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled === 'function') {
      this.callbacks.onFulfilled.push(onFulfilled);
      if (this.state === 'fulfilled') {
        onFulfilled(this.value);
      }
    }
    if (typeof onRejected === 'function') {
      this.callbacks.onRejected.push(onRejected);
      if (this.state === 'rejected') {
        onRejected(this.reason);
      }
    }
    let pro = new MockPromise();
    this.callbacks.onFulfilled.push(pro.resolveNow.bind(pro));
    this.callbacks.onRejected.push(pro.rejectNow.bind(pro));
    return pro;
  }
  // This would normally happen when the stack is exhausted.
  // MockPromise requires the caller to trigger that manually
  resolveNow(value) {
    this.state = 'fulfilled';
    this.value = value;
    this.callbacks.onFulfilled.forEach(cb => cb(value));
  }
  rejectNow(reason) {
    this.state = 'rejected';
    this.reason = reason;
    this.callbacks.onRejected.forEach(cb => cb(reason));
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}

MockPromise.resolve = function(data) {
  let promise = new MockPromise();
  promise.resolveNow(data);
  return promise;
};
