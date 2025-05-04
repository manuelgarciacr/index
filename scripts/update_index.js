#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

//require("dotenv").config();

const https = require("https");
const fs = require("fs");

const $GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const $USER = process.env.GITHUB_REPOSITORY.split("/")[0];
const connectApiHost = "api.github.com"
const connectApiPath = `/users/${$USER}/repos`
const headers = {
    "User-Agent": "request",
    "Authorization": `token ${$GITHUB_TOKEN}`
}
const data = []

let options = {
    hostname: connectApiHost,
    path: connectApiPath,
    port: 443,
    method: "GET",
    headers
};

https.request(options, res => {
    let strData = "";

    res.on("error", err => {
        console.error("Request error:", err.message);
    });
    res.on("data", chunk => {
        strData += chunk.toString();
    });
    res.on("end", async () => await getRepo.bind(this, strData)())
}).end();

const getRepo = async (strData) => {
    const body = JSON.parse(strData);

    for (const ele  of body) {
        const repo = {
            name: ele.name,
            description: (ele.description || "").trim(),
            topics: ele.topics || []
        };
        const languagesPromise = getLanguages(ele.languages_url);

        await languagesPromise
            .then(res => {
                const entries = Object.entries(res).sort((a, b) => b[1] - a[1]);
                const total = entries.reduce((prev, curr) => prev += curr[1], 0);

                repo.languages = {}

                entries.forEach(entry =>
                    repo.languages[entry[0]] = Math.round(entry[1] * 1000 / total) / 10
                )
            })
            .catch(err => console.error(err));

        if (ele.has_pages) {
            repo.page = "https://$USER.github.io/" + ele.name;
        }

        data.push(repo);
    }
    createFile(data);
}

const getLanguages = url => {

    return new Promise((response, reject) => https
        .request(url, {headers}, res => {
            let strData = "";

            res.on("error", err => {
              reject(err)
            });

            res.on("data", chunk => {
                strData += chunk.toString();
            });

            res.on("end", () => response(JSON.parse(strData)));
        })
        .end()
      )
};

const createFile = (data) => {

    fs.writeFile("./src/assets/data.json", JSON.stringify(data), err => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Data written to file successfully.");
    });
}
