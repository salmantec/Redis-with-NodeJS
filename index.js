const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.port || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

// Set response
const setResponse = (username, repos) => `<h2>${username} has ${repos} Github repos.</h2>`;

// Make request to Github for data

const getRepos = async (req, res, next) => {
    try {
        console.log("Fetching data.....");
        const { username } = req.params;
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();

        // Set data to Redis
        client.setex(username, 3000, data.public_repos);

        res.send(setResponse(username, data.public_repos));
    } catch (err) {
        res.status(500);
    }
}

// Cache middleware
const cache = (req, res, next) => {
    const { username } = req.params;
    client.get(username, (err, data) => {
        if (err) throw err;

        if (data !== null) res.send(setResponse(username, data));
        else next();
    })
}

app.get('/repos/:username', cache,  getRepos)

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});