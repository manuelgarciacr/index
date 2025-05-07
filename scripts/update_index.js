#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

//require("dotenv").config();

const https = require("https");
const fs = require("fs");

const $GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const $USER = process.env.GITHUB_REPOSITORY_OWNER;
//const $REPOSITORY = process.env.GITHUB_REPOSITORY;
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
    // res.on("end", async () => await getRepo.bind(this, strData)())
    res.on("end", () => {
        if (res.statusCode !== 200) {
            throw "ERROR: " + strData
        }
        async () => await getRepos($USER, strData);
    })
}).end();

const getRepos = async (user, strData) => {
    const body = JSON.parse(strData);

    for (const ele  of body) {
        const repo = {
            name: ele.name,
            description: (ele.description || "").trim(),
            topics: ele.topics || []
        };
        const languagesPromise = getLanguages(ele.languages_url);
        getSubtopics(ele.name);

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
            // repo.page = "https://$USER.github.io/" + ele.name;
            repo.page = `https://${ user }.github.io/${ ele.name }`;
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

const getSubtopics = (repo) => {
    const url = `https://api.github.com/repos/$USE/${ repo }/contents/README.md`;
    console.log("URL", url)
    return new Promise((response, reject) => https
        .request(url, { headers }, res => {
            let strData = "";

            res.on("error", err => {
                reject(err);
            });

            res.on("data", chunk => {
                strData += chunk.toString();
            });

            res.on("end", () => response(JSON.parse(strData)));
        })
        .end()
    );
};

const createFile = (data) => {
    //process.stdout.write(JSON.stringify(data, null, 4));

    fs.writeFile(
        "./src/assets/data.json",
        JSON.stringify(data, null, 4),
        err => {
            if (err) {
                console.error(err);
                return;
            }
            console.log("Data written to file successfully.");
        }
    );
}
