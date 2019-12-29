const uid = require("uid-safe");

let store = new Map();

module.exports = {
	print_all: function() {
		console.log(store);
	},
	create: async function(obj) {
		let sid;
		do {
			sid = await uid(18);
		} while (store.has(sid));
		store.set(sid, { sid, ...obj });
		return sid;
	},
	get: function(x) {
		if (typeof x === "string")
			return store.get(x);

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
	remove: function(x) {
		if (typeof x === "string")
			return store.delete(x);

		if (!"cookies" in x || !"sid" in x.cookies)
			return false;

		return store.delete(x.cookies.sid);
	},
	remove_if: function(predicate) {
		for (const [key, val] of store)
			if (predicate(key, val))
				store.delete(key);
	},
};
