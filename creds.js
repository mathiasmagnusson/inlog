const fs = require("fs");

const creds = JSON.parse(fs.readFileSync("creds.json"));

module.exports = creds;
