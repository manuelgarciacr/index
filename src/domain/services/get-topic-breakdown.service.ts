import { Injectable, inject } from '@angular/core';
import { DataService } from './data.service';
import { ITopic } from '@domain';

@Injectable({
  providedIn: 'root',
})
export class GetTopicBreakdownService {
    private readonly topics = inject(DataService).topics;

    readonly call = (topic: string | ITopic) => {
        if (typeof topic == "string") {
            topic = this.topics().find(t => t.name == topic) ?? ""
        }
        if (typeof topic == "string") return { topics: [], topics2: []};

        const topics = [topic.name];
        const words = topic.name.split("-") ?? [];
        const length = words.length - (topic.sufix ?? 1);
        const content = words.slice(0, length).join("-");
        const subjects = content.split("-") ?? [];
        const topics2 = subjects
            .map(s => this.topics().find(t => t.name === s))
            .filter((t): t is ITopic => t !== undefined);
        topic.type == "course" ? topics.unshift("course") : "";
        topics.unshift(...topics2.map(t => t.name));

        return {topics, topics2}
    }

}
