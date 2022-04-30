"use strict";

(() => {
    require("dotenv").config({ path: `./.${process.env.NODE_ENV || "local"}.env` });
})();

const express = require("express");
const cors = require("cors");
const app = express();
const { redisClient } = require("./helpers/redis");
const { findRandom } = require("./helpers/util");
const { sequelize } = require("./helpers/pg-connection");
const DailyReportPublisherLevel = require("./models/pg/daily-report-publisher-level");
app.use(cors());
app.use(express.json());

app.get("/bids", async (req, res) => {
    try {
        await DailyReportPublisherLevel.increment(
            'total_bid_request',
            {
                by: 1, where: { publisher_id: req.body.publisher_id }
            } 
        );
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
    } finally {
        try {
            await DailyReportPublisherLevel.increment(
                'total_bid_response',
                {
                    by: 1, where: { publisher_id: req.body.publisher_id }
                } 
            );
        } catch (e) {
            console.log(e);
            res.status(e.statusCode || 500).json({
                succces: false,
                message: e.statusCode ? e.message : "Something went wrong"
            });
        }
    }
});
const PORT = 4000;

sequelize.sync({ force: false }).then(() => {
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
}).catch(e => {
    console.log(e);
});
