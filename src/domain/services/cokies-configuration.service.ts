import { Injectable } from "@angular/core";

type Sort = "created" | "pushed" | "name";

type Order = "up" | "down";

type Config = {
    sort01: Sort;
    sort02: Sort;
    order: {
        "created": Order;
        "pushed": Order;
        "name": Order
    }
};

@Injectable({
    providedIn: "root",
})
export class CokiesConfigurationService {
    private _config: Config = {
        sort01: "created",
        sort02: "name",
        order: { created: "up", pushed: "up", name: "down" },
    };

    constructor() {
        const cookies = document.cookie
            .split(";")
            .map(c => c.split("=").map(str => str.trim()));
        const sort01 =
            cookies.find(c => c[0] === "sort01")?.[1] as Sort ?? this._config.sort01;
        const sort02 =
            cookies.find(c => c[0] === "sort02")?.[1] as Sort ?? this._config.sort02;
        const order = {
            created:
                cookies.find(c => c[0] === "created")?.[1] as Order ??
                this._config.order.created,
            pushed:
                cookies.find(c => c[0] === "pushed")?.[1] as Order ??
                this._config.order.pushed,
            name:
                cookies.find(c => c[0] === "name")?.[1] as Order ??
                this._config.order.name,
        };

        this._config = {sort01, sort02, order};

        document.cookie = `sort01=${sort01}`;
        document.cookie = `sort02=${sort02}`;
        document.cookie = `created=${order.created}`;
        document.cookie = `pushed=${order.pushed}`;
        document.cookie = `name=${order.name}`;
    }

    getConfig() {
        return this._config;
    }
}
