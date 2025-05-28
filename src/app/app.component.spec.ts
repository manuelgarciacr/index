import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { provideAnimations } from "@angular/platform-browser/animations";

describe("AppComponent", () => {
    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideAnimations(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        const sanitizer = TestBed.inject(DomSanitizer);

        TestBed.inject(MatIconRegistry)
        .addSvgIcon(
            "github",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/github.svg")
        );
        fixture.detectChanges();
    });

    it("should create the app", () => {
        expect(component).toBeTruthy();
    });

    it(`should have the 'created' order`, () => {
        expect(component['sort01']()).toEqual("created");
    });

    it("should render title", () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector("h1")?.textContent).toContain(
            "Repositories"
        );
    });
});
