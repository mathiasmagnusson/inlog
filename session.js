const uid = require("uid-safe");

let store = new Map();

module.exports = {
	create: async function(obj) {
		let id;
		do {
			id = await uid(18);
		} while (store.has(id));
		store.set(id, obj);
		return id;
	},
	get: function(id) {
		return store.get(id);
	},
	has: function(id) {
		return store.has(id);
	},
	remove: function(id) {
		return store.delete(id);
	},
};
