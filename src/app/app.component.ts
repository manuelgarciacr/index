import { HttpClient } from "@angular/common/http";
import {
    Component,
    computed,
    inject,
    //model,
    OnInit,
    signal,
    ChangeDetectionStrategy,
    ViewChild,
    ElementRef,
} from "@angular/core";
//import { materialize } from 'rxjs';
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { MatChipInputEvent, MatChipsModule } from "@angular/material/chips";
import { MatDialog } from "@angular/material/dialog";
import { TopicDlgComponent } from "./topic-dlg/topic-dlg.component";
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
import { catchError, forkJoin, of, tap } from "rxjs";
import { DomSanitizer } from "@angular/platform-browser";
import { ToggleThemeComponent } from "@infrastructure";
import { ConfigurationService } from "@domain";

type Repo = {
    name: string;
    description: string;
    repository: string;
    webpage: string;
    created: string;
    pushed: string;
    languages: {[key: string]: number}
    topics: string[];
    subtopics: string[]
};

type Order = {
    created: string,
    pushed: string,
    name: string
}

type Topic = {
    topic: string;
    text: string[];
    type: string;
};

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
        ToggleThemeComponent
    ],
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
    @ViewChild(MatAutocompleteTrigger) autocomplete!: MatAutocompleteTrigger;
    @ViewChild("topicInput") input!: ElementRef;
    private readonly http = inject(HttpClient);
    protected readonly cfg = inject(ConfigurationService);
    protected readonly data = signal<Repo[]>([]);
    protected readonly topics = signal<Topic[]>([]);
    protected readonly subtopics = signal<Topic[]>([]);
    protected readonly selectedTopics = signal<string[]>([]);
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
    protected readonly order = signal({created: "up", pushed: "up", name: "down"});

    constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
        iconRegistry.addSvgIcon(
            "github",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/github.svg")
        );
        iconRegistry.addSvgIcon(
            "web",
            sanitizer.bypassSecurityTrustResourceUrl(
                "/icons/web.svg"
            )
        );
        iconRegistry.addSvgIcon(
            "github-white",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/github-white.svg")
        );
        iconRegistry.addSvgIcon(
            "web-white",
            sanitizer.bypassSecurityTrustResourceUrl("/icons/web-white.svg")
        );
    }

    ngOnInit(): void {
        const cookies = document.cookie
            .split(";")
            .map(c => c.split("=").map(str => str.trim()));
        const sort01 = cookies.find(c => c[0] === "sort01")?.[1] ?? "created";
        const sort02 = cookies.find(c => c[0] === "sort02")?.[1] ?? "name";
        const order = {
            created: cookies.find(c => c[0] === "created")?.[1] ?? "up",
            pushed: cookies.find(c => c[0] === "pushed")?.[1] ?? "up",
            name: cookies.find(c => c[0] === "name")?.[1] ?? "down",
        };

        this.sort01.set(sort01);
        this.sort02.set(sort02);
        this.order.set(order);
        this.orderControl.setValue(sort01);

        document.cookie = `sort01=${this.sort01()}`
        document.cookie = `sort02=${this.sort02()}`;
        document.cookie = `created=${this.order().created}`;
        document.cookie = `pushed=${this.order().pushed}`;
        document.cookie = `name=${this.order().name}`;

        this.orderControl.valueChanges.subscribe(value => {
            this.sort02.set(this.sort01());
            this.sort01.set(value!);
            document.cookie = `sort01=${this.sort01()}`;
            document.cookie = `sort02=${this.sort02()}`;
            this.sortData()
        });

        const req1 = this.http.get<[]>("data.json").pipe(
            catchError(error => {
                console.error(error);
                return of(error);
            }),
            tap(data => this.data.set(data))
        );
        const req2 = this.http.get<[]>("topics.json").pipe(
            catchError(error => {
                console.error(error);
                return of(error);
            }),
            tap(data => this.topics.set(data))
        );
        const req3 = this.http.get<[]>("subtopics.json").pipe(
            catchError(error => {
                console.error(error);
                return of(error);
            }),
            tap(data => this.subtopics.set(data))
        );

        forkJoin([req1, req2, req3]).subscribe(() => {
            // results is an array of responses from the HTTP requests
            // Execute your function here
            this.undefinedTopics();
            this.sortData()
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

    openDialog(topic: string, text: string): void {
        const dialogRef = this.dialog.open(TopicDlgComponent, {
            data: { topic, text, inFilter: true },
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

    protected undefinedTopics = () => {
        if (!this.data() || !this.topics() || !this.subtopics()) return;

        const udefTopics: string[] = [];
        const udefSubTopics: string[] = [];
        const topicsFn = (t: string) => {
            if (udefTopics.indexOf(t) >= 0) {
                return;
            }
            if (this.topics().find(topic => topic.topic === t)) {
                return;
            }
            udefTopics.push(t);
        };
        const subtopicsFn = (t: string) => {
            if (udefSubTopics.indexOf(t) >= 0) {
                return;
            }
            if (this.subtopics().find(topic => topic.topic === t)) {
                return;
            }
            udefSubTopics.push(t);
        };
        const fn = (r: Repo) => {
            r.topics.forEach(topicsFn);
            r.subtopics.forEach(subtopicsFn);
        };

        this.data().forEach(fn);

        udefTopics.sort().forEach((v, i) => {
            if (i === 0) console.error("Undefined topics:");
            console.log(v);
        });
        udefSubTopics.sort().forEach((v, i) => {
            if (i === 0) console.error("Undefined subtopics:");
            console.log(v);
        });
    };

    protected notInFilter = (topic: string) =>
        this.selectedTopics().indexOf(topic) < 0;

    protected withDescription = (topic: string) =>
        this.topics().findIndex(v => v.topic === topic && v.text.length) >= 0;

    protected sortOrder = (sort: 'created' | 'pushed' | 'name') => {
        if (this.orderControl.value === sort) {
            this.order.update(v => ({ ...v, [sort]: v[sort] === "up" ? "down" : "up" }));
            document.cookie = `sort=${this.order()[sort]}`
            this.sortData()
        }
    }

    private sortData = () => {
        const sort01 = this.sort01() as keyof Order;
        const sort02 = this.sort02() as keyof Order;
        const order01 = this.order()[sort01];
        const order02 = this.order()[sort02];

        this.data.update(v =>
            v.sort((a, b) => {
                if (order02 === "down") [a, b] = [b, a];
                return a[sort02].localeCompare(
                    b[sort02]
                )
            })
        );
        this.data.update(v =>
            v.sort((a, b) => {
                if (order01 === "down") [a, b] = [b, a];
                return a[sort01].localeCompare(
                    b[sort01]
                )
            })
        );
    }
}

