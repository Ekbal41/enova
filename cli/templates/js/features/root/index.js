const { feature } = require("../../../../../index.js");
const handler = require("./handler.js");
module.exports = Root = feature().get("/", handler.home);
