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
import { RouterOutlet } from "@angular/router";
//import { materialize } from 'rxjs';
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import { NgFor } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatChipInputEvent, MatChipsModule } from "@angular/material/chips";
import { MatDialog } from "@angular/material/dialog";
import { TopicDlgComponent } from "./topic-dlg/topic-dlg.component";
import { MatOptionModule } from "@angular/material/core";
import {
    MatAutocompleteModule,
    MatAutocompleteSelectedEvent,
} from "@angular/material/autocomplete";
import { LiveAnnouncer } from "@angular/cdk/a11y";
import { ENTER, COMMA } from "@angular/cdk/keycodes";
import { MatLabel } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";

type Item = {
    name: string;
    description: string;
    topics: string[];
};

type Topic = {
    topic: string;
    text: string[];
    type: string;
};

@Component({
    selector: "app-root",
    standalone: true,
    imports: [
        RouterOutlet,
        MatButtonModule,
        MatToolbarModule,
        MatCardModule,
        MatIconModule,
        MatChipsModule,
        NgFor,
        MatAutocompleteModule,
        MatOptionModule,
        MatLabel,
        FormsModule,
        MatFormFieldModule,
    ],
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
    @ViewChild("topicInput") input!: ElementRef;
    private http = inject(HttpClient);
    protected data = signal<Item[]>([]);
    protected topics = signal<Topic[]>([]);
    protected selectedTopics = signal<string[]>([]);
    readonly dialog = inject(MatDialog);

    ngOnInit(): void {
        this.http.get<[]>("data.json").subscribe(data => {
            this.data.set(data);
        });
        this.http.get<[]>("topics.json").subscribe(data => {
            this.topics.set(data);
        });
    }

    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    readonly currentTopic = signal("");
    readonly filteredTopics = computed(() => {
        const currentTopic = this.currentTopic().toLowerCase();
        const remainingTopics = this.topics()
            .map(topic => topic.topic)
            .filter(topic => !this.selectedTopics().includes(topic));
        return currentTopic
            ? remainingTopics.filter(topic =>
                  topic.toLowerCase().includes(currentTopic)
              )
            : remainingTopics.slice();
    });

    readonly announcer = inject(LiveAnnouncer);

    add(event: MatChipInputEvent): void {
        const value = (event.value || "").toLowerCase().trim();
        const topic = this.filteredTopics().find(
            topic => topic.toLowerCase() === value
        );

        if (topic) {
            this.selectedTopics.update(topics => [...topics, topic]);
            // this.currentTopic.set("");
            // console.log("CURRENT BLANK")
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
}
