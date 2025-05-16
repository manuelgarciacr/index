import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
// import { CommonModule } from '@angular/common';
import { ConfigurationService } from '@domain';
import { BtnComponent } from '@infrastructure';

@Component({
    selector: "toggle-theme",
    standalone: true,
    imports: [MatButtonModule, BtnComponent],
    templateUrl: "toggle-theme.component.html",
    styles: [],
})
export class ToggleThemeComponent implements OnInit {
    @Output() collapseNavbar = new EventEmitter<boolean>();
    private conf = inject(ConfigurationService);
    protected themeState = {
        svg: ["devices-fill", "moon-stars-fill", "sun-fill"],
        alt: ["Devices icon", "Moon icon", "Sun icon"],
        title: ["System theme", "Dark theme", "Light theme"],
        theme: ["system", "dark", "light"] as ReadonlyArray<"system" | "dark" | "light">, // as ("system" | "dark" | "light")[],
        state: 0, // 0: System theme (can bu light or dark).
    };

    ngOnInit(): void {
        const theme = this.conf.getConfig().theme;
        const state = this.themeState.theme.indexOf(theme);
        this.themeState.state = state;
    }

    protected toggleTheme() {
        const syspref = this.conf.getSyspref();
        let state = this.themeState.state;

        state = state >= 2 ? 0 : state + 1;

        if (state == 0 && syspref == "undefined") state = 1;

        const theme = this.conf.setTheme(this.themeState.theme[state]);
        const newState = this.themeState.theme.indexOf(theme);
        this.themeState.state = newState;
        this.collapseNavbar.emit(true);
    }
}
