#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

//require("dotenv").config();

const https = require("https");
const fs = require("fs");
const core = require("@actions/core");

const $GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const $USER = process.env.GITHUB_REPOSITORY_OWNER;
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

core.notice(headers)

https.request(options, res => {
    let strData = "";

    res.on("error", err => {
        core.setFailed(`Request for repos failed: ${JSON.stringify(err, null, 4)}`);
    });

    res.on("data", chunk => {
        strData += chunk.toString();
    });

    res.on("end", async () => {
        if (res.statusCode !== 200) {
            core.setFailed(
                `Request for repos failed: ${JSON.stringify(err, null, 4)}`
            );
            return
        }
        const data = await getRepos($USER, strData);

        if (process.exitCode ?? 0) return;

        core.notice(data);
        //core.notice(JSON.stringify(JSON.parse(strData), null, 4));
        createFile(data);
        core.notice(fs.readdirSync("./src/assets").join("\n"));
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
        const subtopicsPromise = getSubtopics(ele.name);

        await languagesPromise
            .then(res => {
                const entries = Object.entries(res).sort((a, b) => b[1] - a[1]);
                const total = entries.reduce(
                    (prev, curr) => (prev += curr[1]),
                    0
                );

                repo.languages = {};

                entries.forEach(
                    entry =>
                        (repo.languages[entry[0]] =
                            Math.round((entry[1] * 1000) / total) / 10)
                );
            })
            .catch(err =>
                core.setFailed(
                    `Request for languages failed: ${JSON.stringify(
                        err,
                        null,
                        4
                    )}`
                )
            );

        if (process.exitCode ?? 0) return;

        await subtopicsPromise
            .then(res => {
                const variables = JSON.parse(res).variables
                const subtopicsVar =  variables.find(v => v.name === "SUBTOPICS");
                const subtopics =  JSON.parse(subtopicsVar?.value ?? "[]");

                repo.subtopics = subtopics.sort((a, b) => a - b);

                core.info(typeof res);
                core.info(JSON.stringify(JSON.parse(res), null, 4));
            })
            .catch(err =>
                core.setFailed(
                    `Request for subtopics failed: ${JSON.stringify(
                        err,
                        null,
                        4
                    )}`
                )
            );

        if (process.exitCode ?? 0) return;

        if (ele.has_pages) {
            // repo.page = "https://$USER.github.io/" + ele.name;
            repo.page = `https://${ user }.github.io/${ ele.name }`
        }

        data.push(repo);
    }
    return data
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
    const url = `https://api.github.com/repos/${ $USER }/${ repo }/actions/variables`;
    core.notice(`URL: ${url}`)
    return new Promise((response, reject) => https
        .request(url, { headers }, res => {
            let strData = "";

            res.on("error", err => {
                reject(err);
            });

            res.on("data", chunk => {
                strData += chunk.toString();
            });

            res.on("end", () => response(strData));
        })
        .end()
    );
};

const createFile = (data) => {
    //process.stdout.write(JSON.stringify(data, null, 4));
    try {
        fs.writeFileSync(
            "./src/assets/data.json",
            JSON.stringify(data, null, 4),
        );
        core.notice("Data written to file successfully.")
    } catch(err) {
        core.setFailed(
            `Write data.json file failed: ${JSON.stringify(err, null, 4)}`
        );
     }
}
