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
    IRepo,
    ITopic,
} from "@domain";
import { CokiesConfigurationService } from "domain/services/cokies-configuration.service";

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
    protected readonly storageCfg = inject(StorageConfigurationService);
    protected readonly cookiesCfg = inject(CokiesConfigurationService);
    protected readonly data = signal<IRepo[]>([]);
    protected readonly topics = signal<ITopic[]>([]);
    protected readonly subtopics = signal<ITopic[]>([]);
    protected readonly udefTopics = signal<string[]>([]);
    protected readonly udefSubTopics = signal<string[]>([]);
    protected readonly selectedTopics = signal<string[]>([]);
    protected readonly hasSelections = computed(
        () => !!this.selectedTopics().length
    );
    protected readonly filteredData = computed(() =>
        this.data().filter(
            r => {
                let filter = !this.hasSelections();

                filter ||= r.topics.some(t =>
                    this.selectedTopics().includes(t)
                );
                filter ||= r.topics.some(t =>
                    this.selectedTopics().some(st => t.includes(`-${st}-`))
                );
                filter ||= r.topics.some(t =>
                    this.selectedTopics().some(st => t.endsWith(`-${st}`))
                );
                filter ||= r.topics.some(t =>
                    this.selectedTopics().some(st => t.startsWith(`${st}-`))
                );
                return filter
            }
        )
    );
    protected readonly currentTopic = signal("");
    protected readonly filteredTopics = computed(() => {
        const currentTopic = this.currentTopic().toLowerCase();
        const remainingTopics = this.topics()
            .map(topic => topic.topic)
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
    protected readonly orderControl = new FormControl("created");
    protected readonly sort01 = signal("created");
    protected readonly sort02 = signal("name");
    protected readonly order = signal({
        created: "up",
        pushed: "up",
        name: "down",
    });

    constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
        this.registerIcons(iconRegistry, sanitizer);
    }

    ngOnInit(): void {
        this.dataService.call().subscribe({
            next: resp => {
                this.loadData(resp);
                this.getSortConfiguration();
                this.logUndefinedTopics();
            },
            error: err => {
                console.error(err);
                this.openDialog("DATA SERVICE ERROR", err, "alert");
            },
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
        const itopic = this.topics().find(v => v.topic === topic);
        const text = [...(itopic?.text ?? [])];
        const bases = itopic?.topic?.split("-") ?? [];
        const type = itopic?.type ?? "";
        const inFilter = this.selectedTopics().includes(topic);

        if (type !== "base") {
            bases.forEach(base => {
                const baseTopic = this.topics().find(t => t.topic === base);
                baseTopic && text.push(...baseTopic.text);
            });
        }

        const dialogRef = this.dialog.open(TopicDlgComponent, {
            data: { topic, text, inFilter },
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) return;
            this.selectedTopics.update(topics => [...topics, topic]);
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
            // if (result !== undefined) {
            //     this.animal.set(result);
            // }
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
        this.topics().findIndex(v => v.topic === topic && v.text.length) >= 0;

    protected sortOrder = (sort: "created" | "pushed" | "name") => {
        if (this.orderControl.value === sort) {
            this.order.update(v => ({
                ...v,
                [sort]: v[sort] === "up" ? "down" : "up",
            }));
            document.cookie = `${sort}=${this.order()[sort]}`;
            this.sortData();
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
    };

    private getSortConfiguration = () => {
        const cfg = this.cookiesCfg.getConfig();

        this.sort01.set(cfg.sort01);
        this.sort02.set(cfg.sort02);
        this.order.set(cfg.order);
        this.orderControl.setValue(cfg.sort01);
        this.sortData();

        this.orderControl.valueChanges.subscribe(value => {
            this.sort02.set(this.sort01());
            this.sort01.set(value!);
            document.cookie = `sort01=${this.sort01()}`;
            document.cookie = `sort02=${this.sort02()}`;
            this.sortData();
        });
    };

    private sortData = () => {
        const sort01 = this.sort01() as keyof IOrder;
        const sort02 = this.sort02() as keyof IOrder;
        const order01 = this.order()[sort01];
        const order02 = this.order()[sort02];

        this.data.update(v =>
            v
                .sort((a, b) => {
                    if (order02 === "down") [a, b] = [b, a];
                    return a[sort02].localeCompare(b[sort02]);
                })
                .sort((a, b) => {
                    if (order01 === "down") [a, b] = [b, a];
                    return a[sort01].localeCompare(b[sort01]);
                })
        );
    };

    private loadData = (resp: unknown[]) => {
        resp.forEach(
            v =>
                v instanceof Error &&
                this.openDialog("DATA SERVICE ERROR", v.message, "alert")
        );
        resp.forEach((v, idx) => {
            if (Array.isArray(v)) {
                if (idx === 0) this.data.set(v);
                if (idx === 1) this.topics.set(v);
                if (idx === 2) this.subtopics.set(v);
                if (idx === 3) this.udefTopics.set(v);
                if (idx === 4) this.udefSubTopics.set(v);
            }
        });
    };

    private logUndefinedTopics = () => {
        this.udefTopics().forEach((v, i) => {
            if (i === 0) console.error("Undefined topics:");
            console.log(v);
        });
        this.udefSubTopics().forEach((v, i) => {
            if (i === 0) console.error("Undefined subtopics:");
            console.log(v);
        });
    };
}
