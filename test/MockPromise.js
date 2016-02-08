export default class MockPromise {
  constructor() {
    this.callbacks = {onFulfilled: [], onRejected: []};
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled === 'function') {
      this.callbacks.onFulfilled.push(onFulfilled);
    }
    if (typeof onRejected === 'function') {
      this.callbacks.onRejected.push(onRejected);
    }

  }
  // This would normally happen when the stack is exhausted.
  // MockPromise requires the caller to trigger that manually
  resolveNow(value) {
    this.callbacks.onFulfilled.forEach(cb => cb(value));
  }
  rejectNow(reason) {
    this.callbacks.onRejected.forEach(cb => cb(reason));
  }
}
