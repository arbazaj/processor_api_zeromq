"use strict";

(() => {
    require("dotenv").config({ path: `./.${process.env.NODE_ENV || "local"}.env` });
})();

const express = require("express");
const cors = require("cors");
const app = express();
const { redisClient } = require("./helpers/redis");
const { findRandom } = require("./helpers/util");
app.use(cors());
app.use(express.json());

app.get("/bids", async (req, res) => {
    try {
        const key = findRandom(4);
        const resp = await redisClient.get(`${key}`);
        if (resp) {
            return res.status(200).json(JSON.parse(resp));
        }
        return res.status(200).json({
            "status": "no-fill"
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            succces: false,
            message: e.statusCode ? e.message : "Something went wrong"
        });
    }
});

const PORT = 4000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
