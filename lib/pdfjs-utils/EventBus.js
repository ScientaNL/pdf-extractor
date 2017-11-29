'use strict';

class EventBus {
	constructor() {
		this._listeners = Object.create(null);
	}

	on(eventName, listener) {
		let eventListeners = this._listeners[eventName];
		if (!eventListeners) {
			eventListeners = [];
			this._listeners[eventName] = eventListeners;
		}
		eventListeners.push(listener);
	}

	off(eventName, listener) {
		let eventListeners = this._listeners[eventName];
		let i = void 0;
		if (!eventListeners || (i = eventListeners.indexOf(listener)) < 0) {
			return;
		}
		eventListeners.splice(i, 1);
	}

	dispatch(eventName) {
		let eventListeners = this._listeners[eventName];
		if (!eventListeners || eventListeners.length === 0) {
			return;
		}
		let args = Array.prototype.slice.call(arguments, 1);
		eventListeners.slice(0).forEach(function (listener) {
			listener.apply(null, args);
		});
	}
}

module.exports = EventBus;
