const EventEmitter = require("events");

module.exports = function(session) {
	const Store = session.Store;

	class SessionStore extends Store {
		constructor(expiration_time = 1000 * 60 * 60) {
			super();
			this.store = new Map();
			this.expiration_time = expiration_time;
		}

		all(cb) {
			cb(null, [...this.store.values()].map(s => s.session));
		}

		destroy(sid, cb) {
			this.store.delete(sid);
			cb(null);
		}

		destroy_if(predicate) {
			for (const [sid, { session }] of this.store) {
				if (predicate(session)) {
					this.store.delete(sid);
				}
			}
		}

		clear(cb) {
			this.store.clear();
			cb(null);
		}

		length(cb) {
			cb(null, this.store.size);
		}

		get(sid, cb) {
			if (this.store.has(sid))
				cb(null, this.store.get(sid).session || null);
			else
				cb(null, null);
		}

		set(sid, session, cb) {
			const cancel_delete = setTimeout(() => {
				this.store.delete(sid);
			}, this.expiration_time);

			this.store.set(sid, { session, cancel_delete });

			cb(null);
		}

		touch(sid, session, cb) {
			const stored_session = this.store.get(sid);
			if (stored_session) {
				clearTimeout(stored_session.cancel_delete);

				stored_session.cancel_delete = setTimeout(() => {
					this.store.delete(sid);
				}, this.expiration_time);

				cb(null);
			} else {
				this.set(sid, session, cb);
			}
		}
	}

	return SessionStore;
}
