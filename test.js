function args() {
	return function() {
		console.log(...arguments);
	};
}

function restOfArgs(something) {
	console.log(...arguments);
}

async function throwsError() {
	throw "hello";
}


args("Printa", "inte", "mig")("Men", "printa", "mig");

restOfArgs("Printa", "gärna", "mig");

throwsError()
	.catch(console.error);

