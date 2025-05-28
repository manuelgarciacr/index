import {
    Component,
    computed,
    inject,
    OnInit,
    signal,
    ChangeDetectionStrategy,
    ViewChild,
    ElementRef,
} from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { MatChipInputEvent, MatChipsModule } from "@angular/material/chips";
import { MatDialog } from "@angular/material/dialog";
import { MatOptionModule } from "@angular/material/core";
import {
    MatAutocompleteModule,
    MatAutocompleteSelectedEvent,
    MatAutocompleteTrigger,
} from "@angular/material/autocomplete";
import { LiveAnnouncer } from "@angular/cdk/a11y";
import { ENTER, COMMA } from "@angular/cdk/keycodes";
import { MatLabel } from "@angular/material/form-field";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { DomSanitizer } from "@angular/platform-browser";
import {
    DlgComponent,
    ToggleThemeComponent,
    TopicDlgComponent,
} from "@infrastructure";
import {
    StorageConfigurationService,
    DataService,
    IOrder,
} from "@domain";
import { CokiesConfigurationService } from "domain/services/cokies-configuration.service";
import { GetTopicBasesService } from "domain/services/get-topic-bases.service";
import { tap } from "rxjs";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [
        MatButtonModule,
        MatToolbarModule,
        MatCardModule,
        MatIconModule,
        MatChipsModule,
        MatAutocompleteModule,
        MatOptionModule,
        MatLabel,
        FormsModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatButtonToggleModule,
        ToggleThemeComponent,
    ],
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
    @ViewChild(MatAutocompleteTrigger) autocomplete!: MatAutocompleteTrigger;
    @ViewChild("topicInput") input!: ElementRef;
    private readonly dataService = inject(DataService);
    private readonly getTopicText = inject(GetTopicBasesService);
    protected readonly storageCfg = inject(StorageConfigurationService);
    protected readonly cookiesCfg = inject(CokiesConfigurationService);
    //protected readonly data = signal<IRepo[]>([]);
    protected readonly data = this.dataService.data;
    protected readonly datachanged = toObservable(this.dataService.data)
    .pipe(
        tap(v => v.length > 0 && this.getSortConfiguration()),
        tap(v => v.length > 0 && this.logUndefinedTopics()))
    .subscribe({
            next: v => v.length > 0 && this.datachanged.unsubscribe()
        });
    //protected readonly topics = signal<ITopic[]>([]);
    protected readonly topics = this.dataService.topics;
    //protected readonly subtopics = signal<ITopic[]>([]);
    protected readonly subtopics = this.dataService.subtopics;
    protected readonly udefTopics = this.dataService.udefTopics;
    protected readonly udefSubtopics = this.dataService.udefSubtopics;
    protected readonly selectedTopics = signal<string[]>([]);
    protected readonly hasSelections = computed(
        () => !!this.selectedTopics().length
    );
    protected readonly filteredData = computed(() =>
        this.data().filter(r => {
            if (!r.show) {
                // return false;
            }

            let filter = !this.hasSelections();

            filter ||= r.topics.some(t => this.selectedTopics().includes(t));
            filter ||= r.topics.some(t =>
                this.selectedTopics().some(st => t.includes(`-${st}-`))
            );
            filter ||= r.topics.some(t =>
                this.selectedTopics().some(st => t.endsWith(`-${st}`))
            );
            filter ||= r.topics.some(t =>
                this.selectedTopics().some(st => t.startsWith(`${st}-`))
            );

            return filter;
        })
    );
    protected readonly currentTopic = signal("");
    protected readonly filteredTopics = computed(() => {
        const currentTopic = this.currentTopic().toLowerCase();
        const remainingTopics = this.topics()
            .map(topic => topic.name)
            .filter(topic => !this.selectedTopics().includes(topic))
            .sort((a, b) => a.localeCompare(b));
        return currentTopic
            ? remainingTopics.filter(topic =>
                  topic.toLowerCase().includes(currentTopic)
              )
            : remainingTopics.slice();
    });
    protected readonly announcer = inject(LiveAnnouncer);
    protected readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    protected readonly dialog = inject(MatDialog);
    protected readonly goTopBtn = signal(false);
    protected readonly orderControl = new FormControl<keyof IOrder>("created");
    protected readonly sort01 = signal<keyof IOrder>("created");
    protected readonly sort02 = signal<keyof IOrder>("name");
    protected readonly order = signal<IOrder>({
        created: "up",
        pushed: "up",
        name: "down",
    });

    constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
        this.registerIcons(iconRegistry, sanitizer);
    }

    ngOnInit(): void {
        this.dataService.error$.subscribe({
            error: err => console.error(err),
            next: err =>
                this.openDialog("DATA SERVICE ERROR", err.message, "alert"),
        });

    }

    add(event: MatChipInputEvent): void {
        const value = (event.value || "").toLowerCase().trim();
        const topic = this.filteredTopics().find(
            topic => topic.toLowerCase() === value
        );
        if (topic) {
            this.selectedTopics.update(topics => [...topics, topic]);
        }
        this.currentTopic.set("");

        // Update input control
        this.input.nativeElement.value = "";
    }

    remove(topic: string): void {
        this.selectedTopics.update(topics => {
            const index = this.selectedTopics().indexOf(topic);

            if (index < 0) {
                return topics;
            }

            topics.splice(index, 1);
            this.announcer.announce(`Removed ${topic}`);
            return [...topics];
        });
    }

    selected(event: MatAutocompleteSelectedEvent): void {
        this.selectedTopics.update(topics => [
            ...topics,
            event.option.viewValue,
        ]);
        this.currentTopic.set("");
        event.option.deselect();
    }

    openTopicDialog(topic: string): void {
        const itopic = this.topics().find(v => v.name === topic);
        // const text = [...(itopic?.text ?? [])];
        // const bases: string[] = [];
        // const type = itopic?.type ?? "";
        const inFilter = this.selectedTopics().includes(topic);

        // if (type !== "base") {
        //     const basesArray = topic.split("-") ?? [];
        //     const topics = basesArray
        //         .map(base => this.topics().find(t => t.name === base))
        //         .filter(t => t !== undefined);
        //     const topicsText = topics.flatMap(t => t.text);

        //     bases.push(...topics.map(t => t.name));
        //     text.unshift(...topicsText)
        // }

        const { topics, text } = this.getTopicText.call(itopic!);
        const dialogRef = this.dialog.open(TopicDlgComponent, {
            data: { topic, text, inFilter },
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) return;

            this.selectedTopics.update(v => [...v, ...topics]);
            this.currentTopic.set("");
            // Update input control
            this.input.nativeElement.value = "";
        });
    }

    openDialog(title: string, text: string, type: "info" | "alert"): void {
        const dialogRef = this.dialog.open(DlgComponent, {
            data: { title, text, type },
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log("The dialog was closed", result);
        });
    }

    clearFilter(): void {
        this.selectedTopics.set([]);
        this.currentTopic.set("");
        // Update input control
        this.input.nativeElement.value = "";
    }

    onScroll() {
        const show = window.scrollY > window.innerHeight;
        if (show !== this.goTopBtn()) this.goTopBtn.set(show);
    }

    goTop() {
        window.scrollTo(0, 0);
    }

    protected notInFilter = (topic: string) =>
        this.selectedTopics().indexOf(topic) < 0;

    protected withDescription = (topic: string) =>
        this.topics().findIndex(v => v.name === topic && v.text.length) >= 0;

    protected sortOrder = (sort: "created" | "pushed" | "name") => {
        if (this.orderControl.value === sort) {
            this.order.update(v => ({
                ...v,
                [sort]: v[sort] === "up" ? "down" : "up",
            }));
            document.cookie = `${sort}=${this.order()[sort]}`;
            this.dataService.sortData(
                this.sort01(),
                this.sort02(),
                this.order()
            );
        }
    };

    private registerIcons = (
        iconRegistry: MatIconRegistry,
        sanitizer: DomSanitizer
    ) => {
        iconRegistry.addSvgIcon(
            "github",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/github.svg")
        );
        iconRegistry.addSvgIcon(
            "web",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/web.svg")
        );
        iconRegistry.addSvgIcon(
            "github-white",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/github-white.svg")
        );
        iconRegistry.addSvgIcon(
            "web-white",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/web-white.svg")
        );
        iconRegistry.addSvgIcon(
            "favicon",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/favicon.svg")
        );
        iconRegistry.addSvgIcon(
            "favicon-dark",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/favicon-dark.svg")
        );
    };

    private getSortConfiguration = () => {
        const cfg = this.cookiesCfg.getConfig();

        this.sort01.set(cfg.sort01);
        this.sort02.set(cfg.sort02);
        this.order.set(cfg.order);
        this.orderControl.setValue(cfg.sort01);
        this.dataService.sortData(this.sort01(), this.sort02(), this.order());
        console.log(this.sort01(), this.sort02(), this.order());
        this.orderControl.valueChanges.subscribe(value => {
            this.sort02.set(this.sort01());
            this.sort01.set(value!);
            document.cookie = `sort01=${this.sort01()}`;
            document.cookie = `sort02=${this.sort02()}`;
            this.dataService.sortData(
                this.sort01(),
                this.sort02(),
                this.order()
            );
        });
    };

    private logUndefinedTopics = () => {
        this.udefTopics().forEach((v, i) => {
            if (i === 0) console.error("Undefined topics:");
            console.log(v);
        });
        this.udefSubtopics().forEach((v, i) => {
            if (i === 0) console.error("Undefined subtopics:");
            console.log(v);
        });
    };
}
