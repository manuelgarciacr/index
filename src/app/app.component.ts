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
    GetTopicDataService,
    CokiesConfigurationService,
} from "@domain";
import { filter, take } from "rxjs";

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
    // Data Services
    private readonly dataService = inject(DataService);
    private readonly getTopicData = inject(GetTopicDataService);
    private readonly showAll = false;
    protected readonly storageCfg = inject(StorageConfigurationService);
    protected readonly cookiesCfg = inject(CokiesConfigurationService);
    // LiveAnnouncer is used to announce messages for screen-reader
    // users using an aria-live region.
    // An ARIA live region is a mechanism for notifying screen readers when
    // content is updated on a page, ensuring that dynamic content changes
    // are announced to users of assistive technologies.
    protected readonly announcer = inject(LiveAnnouncer);
    protected readonly dialog = inject(MatDialog);
    // Data of all the repos, topics, subtopics and undefined items
    protected readonly repos = this.dataService.repos;
    //protected readonly topics = this.dataService.topics;
    protected readonly topics = computed(() =>
        this.dataService.topics().filter(r => this.hasTopic(r.name)),
    );
    //protected readonly subtopics = this.dataService.subtopics;
    protected readonly subtopics = computed(() =>
        this.dataService.subtopics().filter(r => this.hasTopic(r.name, true)),
    );
    protected readonly udefTopics = this.dataService.udefTopics;
    protected readonly udefSubtopics = this.dataService.udefSubtopics;
    // When the repos are loaded, the data are sorted and undefined topics are reported
    protected readonly reposChanged = toObservable(this.dataService.repos)
        .pipe(
            filter(v => v.length > 0),
            take(1),
        )
        .subscribe(() => {
            this.getSortConfiguration();
            if (this.showAll) this.logUndefinedTopics();
        });
    // protected readonly reposChanged: Subscription = toObservable(
    //     this.dataService.repos,
    // )
    //     .pipe(
    //         tap(v => v.length > 0 && this.getSortConfiguration()),
    //         tap(v => v.length > 0 && this.logUndefinedTopics()),
    //     )
    //     .subscribe({
    //         next: v => v.length > 0 && this.reposChanged.unsubscribe(),
    //     });
    // Topics selected for filter the repos on the screen
    protected readonly selectedTopics = signal<string[]>([]);
    protected readonly hasSelections = computed(
        () => !!this.selectedTopics().length,
    );
    // Repos on the screen (filtered)
    protected readonly filteredRepos = computed(() =>
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.repos().filter((r, i) => {
            // if (i > 4) return false;
            if (!r.show && !this.showAll) {
                return false;
            }

            let filter = !this.hasSelections();

            filter ||= r.topics.some(t => this.selectedTopics().includes(t));

            // Dashed topics can include more than one topic
            filter ||= r.topics.some(t =>
                this.selectedTopics().some(st => t.includes(`-${st}-`)),
            );
            filter ||= r.topics.some(t =>
                this.selectedTopics().some(st => t.endsWith(`-${st}`)),
            );
            filter ||= r.topics.some(t =>
                this.selectedTopics().some(st => t.startsWith(`${st}-`)),
            );

            return filter;
        }),
    );
    // Topic (input field value) to be included in the topics selected
    // for filter the repos on the screen
    protected readonly currentTopic = signal("");
    // These keys end the keyboard entry of the topic in the previous entry field
    protected readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    // Topics included in the autocomplete input
    protected readonly filteredTopics = computed(() => {
        const currentTopic = this.currentTopic().toLowerCase();
        // Topics not included in the selected ones
        const remainingTopics = this.topics()
            .map(topic => topic.name)
            .filter(topic => !this.selectedTopics().includes(topic))
            .sort((a, b) => a.localeCompare(b));
        return currentTopic
            ? remainingTopics.filter(topic =>
                  topic.toLowerCase().includes(currentTopic),
              )
            : remainingTopics.slice();
    });
    // Makes visible the "goTop" button on the screen
    protected readonly goTopBtn = signal(false);
    // Form control that changes the order of the repos on the screen
    protected readonly orderControl = new FormControl<keyof IOrder>("created");
    // Variables controlling the order of the repos on the screen
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

    /**
     * Add the topic introduced by keyboard to those selected to filter
     * the repos on the screen
     * @param event
     */
    add(event: MatChipInputEvent): void {
        const value = (event.value || "").toLowerCase().trim();
        // The topic must be included in the autocomplete list
        const topic = this.filteredTopics().find(
            topic => topic.toLowerCase() === value,
        );
        if (topic) {
            this.selectedTopics.update(topics => [...topics, topic]);
        }
        this.currentTopic.set("");

        // Update input control value. Two way binding does not works. Workaround.
        this.input.nativeElement.value = "";
    }

    /**
     * Remove a topic from those selected to filter the repos on the screen
     * @param topic
     */
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

    /**
     * Add the topic selected from the autocomplete list to those
     * selected to filter the repos on the screen
     * @param event
     */
    selected(event: MatAutocompleteSelectedEvent): void {
        this.selectedTopics.update(topics => [
            ...topics,
            event.option.viewValue,
        ]);
        this.currentTopic.set("");
        event.option.deselect();
    }

    openTopicDialog(name: string): void {
        const topic = this.topics().find(v => v.name === name);
        // If true, the dialog box only shows the text, otherwise, it
        // requests to include the topics in the selected ones
        const inFilter = this.selectedTopics().includes(name);
        // Dashed topics can include more than one topic
        // The text is the sum of all the texts
        const { topics, text } = this.getTopicData.call(topic!);
        const dialogRef = this.dialog.open(TopicDlgComponent, {
            data: { name, text, inFilter },
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) return;

            this.selectedTopics.update(v => [...new Set([...v, ...topics])]);
            this.currentTopic.set("");
            // Update input control value. Two way binding does not works. Workaround.
            this.input.nativeElement.value = "";
        });
    }

    /**
     * General dialog
     * @param title
     * @param text
     * @param type
     */
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
        // Update input control value. Two way binding does not works. Workaround.
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

    /**
     * By clicking on the option already selected from the OrderControl, the
     * sort field does not change, but the sort direction
     * @param sort
     */
    protected sortOrder = (sort: "created" | "pushed" | "name") => {
        if (this.orderControl.value === sort) {
            this.order.update(v => ({
                ...v,
                [sort]: v[sort] === "up" ? "down" : "up",
            }));
            document.cookie = `${sort}=${this.order()[sort]}`;
            this.dataService.sortRepos(
                this.sort01(),
                this.sort02(),
                this.order(),
            );
        }
    };

    private registerIcons = (
        iconRegistry: MatIconRegistry,
        sanitizer: DomSanitizer,
    ) => {
        iconRegistry.addSvgIcon(
            "github",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/github.svg"),
        );
        iconRegistry.addSvgIcon(
            "web",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/web.svg"),
        );
        iconRegistry.addSvgIcon(
            "github-white",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/github-white.svg"),
        );
        iconRegistry.addSvgIcon(
            "web-white",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/web-white.svg"),
        );
        iconRegistry.addSvgIcon(
            "favicon",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/favicon.svg"),
        );
        iconRegistry.addSvgIcon(
            "favicon-dark",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/favicon-dark.svg"),
        );
    };

    private getSortConfiguration = () => {
        const cfg = this.cookiesCfg.getConfig();

        this.sort01.set(cfg.sort01);
        this.sort02.set(cfg.sort02);
        this.order.set(cfg.order);
        this.orderControl.setValue(cfg.sort01);
        this.dataService.sortRepos(this.sort01(), this.sort02(), this.order());

        // orderControl subscription
        this.orderControl.valueChanges.subscribe(value => {
            this.sort02.set(this.sort01());
            this.sort01.set(value!);
            document.cookie = `sort01=${this.sort01()}`;
            document.cookie = `sort02=${this.sort02()}`;
            this.dataService.sortRepos(
                this.sort01(),
                this.sort02(),
                this.order(),
            );
        });
    };

    /**
     * Topics and subtopics of the repos not included in the json files
     * or included but without text
     */
    private logUndefinedTopics = () => {
        console.error("Undefined topics:");
        this.udefTopics().forEach(v => {
            if (this.hasTopic(v)) console.log(v);
        });
        console.error("Undefined subtopics:");
        this.udefSubtopics().forEach(v => {
            if (this.hasTopic(v, true)) console.log(v);
        });
        console.log(this.filteredRepos());
    };

    private hasTopic(name: string, subtopic: boolean = false): boolean {
        if (subtopic)
            return this.filteredRepos().some(repo =>
                repo.subtopics.includes(name),
            );
        return this.filteredRepos().some(repo => repo.topics.includes(name));
    }
}
