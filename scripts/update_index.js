#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

//require("dotenv").config();

const https = require("https");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fs = require("fs");
const core = require("@actions/core");

const $GITHUB_TOKEN = process.env.PAT_GITHUB_TOKEN;
const $USER = process.env.GITHUB_REPOSITORY_OWNER;
const connectApiHost = "api.github.com"
//const connectApiPath = `/users/${$USER}/repos`
const connectApiPath = `/user/repos?per_page=100`;
const headers = {
    "User-Agent": "request",
    "Authorization": `token ${$GITHUB_TOKEN}`
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const data = []

let options = {
    hostname: connectApiHost,
    path: connectApiPath,
    port: 443,
    method: "GET",
    headers
};

console.log("USER: ", $USER);
console.log("OPTIONS: ", options);

async function main() {
    try {
console.log("***************************ENTRO MAIN")
        const reposData = await getAllRepos();
console.log("***************************SALGO MAIN", reposData.length)
        const repos = [];

        for (const ele  of reposData) {
            if (ele.owner.login !== "$USER")
                continue;
            const repo = {
                name: ele.name,
                description: (ele.description || "").trim(),
                repository: ele.html_url,
                webpage: ele.has_pages
                    ? `https://manuelgarciacr.github.io/${ele.name}`
                    : "",
                created: ele.created_at.substring(0, 21).replace("-", "/"),
                pushed: ele.pushed_at.substring(0, 21).replace("-", "/"),
                topics: ele.topics || [],
                private: ele.visibility === "private",
            };
            const languagesPromise = getLanguages(ele.languages_url);
            const subtopicsPromise = getSubtopics(ele.name);

            await languagesPromise
                .then(res => {
                    const entries = Object.entries(res).sort((a, b) => b[1] - a[1]);
                    const total = entries.reduce(
                        (prev, curr) => (prev += curr[1]),
                        0,
                    );

                    repo.languages = {};
                    entries.forEach(
                        entry =>
                            (repo.languages[entry[0]] =
                                Math.round((entry[1] * 1000) / total) / 10),
                    );
                })
                .catch(err =>
                    core.setFailed(
                        `Request for languages failed: ${JSON.stringify(
                            err,
                            null,
                            4,
                        )}`,
                    ),
                );

            if (process.exitCode ?? 0) return;

            await subtopicsPromise
                .then(res => {
                    const variables = JSON.parse(res).variables;
                    const subtopicsVar = variables?.find(
                        v => v.name === "SUBTOPICS",
                    );
                    const subtopics = JSON.parse(subtopicsVar?.value ?? "[]");
                    const showIdx = subtopics.indexOf("show-private");
                    repo.subtopics = subtopics.sort((a, b) => a - b);

                    if (!repo.private || showIdx >= 0) {
                        repo.show = true;
                    } else {
                        repo.show = false;
                    }
                    //core.info("TYPE: " + typeof res);
                    //core.info("SUBTOPICS: " + JSON.stringify(JSON.parse(res), null, 4));
                })
                .catch(err => {
                    core.error(err);
                    core.setFailed(
                        `Request for subtopics failed: ${JSON.stringify(
                            err,
                            null,
                            4,
                        )}`,
                    );
                });

            if (process.exitCode ?? 0) return;

            if (ele.has_pages) {
                repo.page = `https://${$USER}.github.io/${ele.name}`;
            }

            repos.push(repo);
        }

        createFile(repos);
        sortTopics("topics");
        sortTopics("subtopics");

        console.log(repos);
        if (reposData.length)
            console.log(reposData[reposData.length - 1]);
        console.log("NUM OF REPOS:", repos.length);
    } catch (err) {
        core.setFailed(`Request for repos failed: ${err.message}`);
    }
}

async function getAllRepos() {
    let url = "https://api.github.com/user/repos?per_page=20";
    const repos = [];

    while (url) {
        const result = await request(url);

        repos.push(...result.repos);

        url = getNext(result.link);
    }

    return repos;
}

function request(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(
            url,
            {
                headers: {
                    "User-Agent": "node",
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${process.env.PAT_GITHUB_TOKEN}`,
                },
            },
            res => {
                let body = "";

                res.on("data", chunk => (body += chunk));

                res.on("end", () => {
                    if (res.statusCode !== 200) {
console.log("*****************ERROR !== 200")
                        reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                    }
console.log("******************200", )
                    resolve({
                        repos: JSON.parse(body),
                        link: res.headers.link,
                    });
                });
            },
        );

        req.on("error", reject);
        req.end();
    });
}

function getNext(link) {
    if (!link) return null;

    for (const item of link.split(",")) {
        const parts = item.trim().split(";");

        if (parts[1].includes('rel="next"')) return parts[0].slice(1, -1);
    }

    return null;
}

const getLanguages = url => {
    return new Promise((response, reject) =>
        https
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
            .end(),
    );
};

const getSubtopics = repo => {
    const url = `https://api.github.com/repos/${$USER}/${repo}/actions/variables`;
    //core.info(`URL: ${url}`)

    return new Promise((response, reject) =>
        https
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
            .end(),
    );
};

const createFile = data => {
    //process.stdout.write(JSON.stringify(data, null, 4));
    try {
        fs.writeFileSync(
            "./src/assets/data.json",
            JSON.stringify(data, null, 4),
        );
        core.info("Data written to file successfully.");
    } catch (err) {
        core.setFailed(
            `Write data.json file failed: ${JSON.stringify(err, null, 4)}`,
        );
    }
};

const sortTopics = name => {
    try {
        const topics = JSON.parse(
            fs.readFileSync(`./src/assets/${name}.json`, { encoding: null }),
        ).sort((a, b) => a.name.localeCompare(b.name));

        fs.writeFileSync(
            `./src/assets/${name}.json`,
            JSON.stringify(topics, null, 4),
        );
        core.info(`${name}.json written to file successfully.`);
    } catch (err) {
        core.info(err);
        core.setFailed(`Sort ${name}.json file failed`);
    }
};

main();

return
/*
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
                `Request for repos failed: ${JSON.stringify(res.statusMessage, null, 4)}`
            );
            return
        }
        const data = await getRepos($USER, strData);

        if (process.exitCode ?? 0) return;

        console.log("RES:", res.headers);
        //console.log("REPOS: ", data);
        createFile(data);
        sortTopics("topics");
        sortTopics("subtopics");

        core.info(fs.readdirSync("./src/assets").join("\n"));

        const reposData = await getAllRepos();
        const repos = [];

        for (const ele of reposData) {
            const repo = {
                name: ele.name,
                description: (ele.description || "").trim(),
                repository: ele.html_url,
                webpage: ele.has_pages
                    ? `https://manuelgarciacr.github.io/${ele.name}`
                    : "",
                created: ele.created_at.substring(0, 21).replace("-", "/"),
                pushed: ele.pushed_at.substring(0, 21).replace("-", "/"),
                topics: ele.topics || [],
                private: ele.visibility === "private",
            };
            const languagesPromise = getLanguages(ele.languages_url);
            const subtopicsPromise = getSubtopics(ele.name);

            await languagesPromise
                .then(res => {
                    const entries = Object.entries(res).sort(
                        (a, b) => b[1] - a[1],
                    );
                    const total = entries.reduce(
                        (prev, curr) => (prev += curr[1]),
                        0,
                    );

                    repo.languages = {};
                    entries.forEach(
                        entry =>
                            (repo.languages[entry[0]] =
                                Math.round((entry[1] * 1000) / total) / 10),
                    );
                })
                .catch(err =>
                    core.setFailed(
                        `Request for languages failed: ${JSON.stringify(
                            err,
                            null,
                            4,
                        )}`,
                    ),
                );

            if (process.exitCode ?? 0) return;

            await subtopicsPromise
                .then(res => {
                    const variables = JSON.parse(res).variables;
                    const subtopicsVar = variables?.find(
                        v => v.name === "SUBTOPICS",
                    );
                    const subtopics = JSON.parse(subtopicsVar?.value ?? "[]");
                    const showIdx = subtopics.indexOf("show-private");
                    repo.subtopics = subtopics.sort((a, b) => a - b);

                    if (!repo.private || showIdx >= 0) {
                        repo.show = true;
                    } else {
                        repo.show = false;
                    }
                    //core.info("TYPE: " + typeof res);
                    //core.info("SUBTOPICS:
                });

            if (process.exitCode ?? 0) return;

            if (ele.has_pages) {
                repo.page = `https://${$USER}.github.io/${ele.name}`;
            }

            repos.push(repo);
        }
        console.log(repos);
        console.log("NUM OF REPOS:", repos.length);
    })" + JSON.stringify(JSON.parse(res), null, 4));
                })
                .catch(err => {
                    core.error(err);
                    core.setFailed(
                        `Request for subtopics failed: ${JSON.stringify(
                            err,
                            null,
                            4,
                        )}`,
                    );
                });

            if (process.exitCode ?? 0) return;

                });

            if (process.exitCode ?? 0) return;

            if (ele.has_pages) {
                repo.page = `https://${$USER}.github.io/${ele.name}`;
            }

            repos.push(repo);
        }
        console.log(repos);
        console.log("NUM OF REPOS:", repos.length);
    })
            if (ele.has_pages) {
                repo.page = `https://${$USER}.github.io/${ele.name}`;
            }

            repos.push(repo);
        }
        console.log(repos);
        console.log("NUM OF REPOS:", repos.length);
    })
}).end();

const getRepos = async (user, strData) => {
    const body = JSON.parse(strData);

    //console.log("REPOS DATA: ", body);
    for (const ele  of body) {
        const repo = {
            name: ele.name,
            description: (ele.description || "").trim(),
            repository: ele.html_url,
            webpage: ele.has_pages
                ? `https://manuelgarciacr.github.io/${ele.name}`
                : "",
            created: ele.created_at.substring(0, 21).replace("-", "/"),
            pushed: ele.pushed_at.substring(0, 21).replace("-", "/"),
            topics: ele.topics || [],
            private: ele.visibility === "private"
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
                const subtopicsVar =  variables?.find(v => v.name === "SUBTOPICS");
                const subtopics =  JSON.parse(subtopicsVar?.value ?? "[]");
                const showIdx = subtopics.indexOf("show-private");
                repo.subtopics = subtopics.sort((a, b) => a - b);

                if (!repo.private || showIdx >= 0) {
                    repo.show = true;
                } else {
                    repo.show = false
                }
                //core.info("TYPE: " + typeof res);
                //core.info("SUBTOPICS: " + JSON.stringify(JSON.parse(res), null, 4));
            })
            .catch(err => {
                core.error(err);
                core.setFailed(
                    `Request for subtopics failed: ${JSON.stringify(
                        err,
                        null,
                        4
                    )}`
                )
            });

        if (process.exitCode ?? 0) return;

        if (ele.has_pages) {
            // repo.page = "https://$USER.github.io/" + ele.name;
            repo.page = `https://${ user }.github.io/${ ele.name }`
        }

        data.push(repo);
    }
    return data
}



const createFile = (data) => {
    //process.stdout.write(JSON.stringify(data, null, 4));
    try {
        fs.writeFileSync(
            "./src/assets/data.json",
            JSON.stringify(data, null, 4),
        );
        core.info("Data written to file successfully.")
    } catch(err) {
        core.setFailed(
            `Write data.json file failed: ${JSON.stringify(err, null, 4)}`
        );
    }
}

*/
