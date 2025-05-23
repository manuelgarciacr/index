import {
    Injectable,
} from "@angular/core";

type Config = {
    theme: "dark" | "light" | "system";
    isDark: boolean;
    syspref: string;
};

@Injectable({
    providedIn: "root",
})
export class StorageConfigurationService {
    private _config: Config = { theme: "system", isDark: false, syspref: "" };

    constructor() {
        const storage = localStorage.getItem("config");
        const config = storage ? JSON.parse(storage) : this._config;
        this._updateTheme(config);
    }

    private _updateTheme(config: Config) {
        let { theme, isDark } = config;
        let syspref = this.getSyspref() ?? "";

        // System preference is or not setted
        if (syspref !== "light" && syspref !== "dark") {
            syspref = "";
        }

        if (theme === "system" && syspref === "") {
            theme = isDark ? "dark" : "light";
        }

        isDark = theme === "dark" || (theme === "system" && syspref === "dark");

        this._config = { theme, isDark, syspref };
        localStorage.setItem("config", JSON.stringify(this._config));

        if (isDark) document.body.classList.add("dark-theme");
        else document.body.classList.remove("dark-theme");
    }

    getSyspref() {
        return getComputedStyle(document.documentElement).getPropertyValue(
            "--system-preference"
        ).trim();
    }

    setTheme = (theme: "light" | "dark" | "system") => {
        this._updateTheme({...this._config, theme});
        return this._config.theme;
    };

    // setStayLoggedIn = (stay: boolean) => {
    //     this._config.stayLoggedIn = stay;
    //     localStorage.setItem("config", JSON.stringify(this._config));
    // };

    getConfig() {
        return this._config;
    }
}
