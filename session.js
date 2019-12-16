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
		if (typeof id === "string")
			return store.get(id);

		if (!"cookies" in x || !"sid" in x.cookies)
			return false;

		return store.get(x.cookies.sid);
	},
	has: function(x) {
		if (typeof x === "string")
			return store.has(x);

		if (!"cookies" in x || !"sid" in x.cookies)
			return false;

		return store.has(x.cookies.sid);
	},
	remove: function(id) {
		return store.delete(id);
	},
};
