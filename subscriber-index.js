"use strict";

(() => {
    require("dotenv").config({ path: `./.${process.env.NODE_ENV || "local"}.env` });
})();

const subscriber = require("./helpers/zeromq-subscriber");