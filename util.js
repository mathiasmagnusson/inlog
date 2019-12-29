function delay(ms) {
	return new Promise((res, rej) => {
		setTimeout(() => {
			res();
		}, ms);
	});
}

module.exports = {
	delay,
};
