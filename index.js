(() => {
    require("dotenv").config({ path: `./.${process.env.NODE_ENV || "local"}.env` });
})();

const express = require("express");
const cors = require("cors");
const app = express();
const _ = require("underscore");
const db = require('./helpers/mongoose');
const mongoose = require('mongoose');
const { publish } = require("./helpers/zeromq-pubber");

app.use(cors());
app.use(express.json())

app.post("/impressions", async (req, res) => {
    try {
        const { body } = req;
        if (_.isEmpty(body)) {
            const e = new Error("Body cannot be empty");
            e.statusCode = 400;
            throw e;
        }
        await mongoose.connection.db.collection("impressions").updateOne({
            impression_id: body.impression_id
        }, {
            $set: body
        }, {
            upsert: true
        });
        await publish("impressions", body);
        console.log("publish successfully");
        res.status(200).json({
            succces: true,
            message: "Success",
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            succces: false,
            message: e.statusCode ? e.message : "Something went wrong"
        });
    }
});

const PORT = 8000;

db.connect().then(() => {
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
}).catch(e => {
    console.log(e);
    console.log("error in connection of db");
});
