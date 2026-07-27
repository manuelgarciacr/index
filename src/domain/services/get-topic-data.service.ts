import { inject, Injectable } from '@angular/core';
import { ITopic } from '@domain';
import { GetTopicBreakdownService } from './get-topic-breakdown.service';

@Injectable({
    providedIn: "root",
})
export class GetTopicDataService {
    // private readonly topics = inject(DataService).topics;
    private readonly getTopics = inject(GetTopicBreakdownService).call
    readonly call = (topic: ITopic) => {
        const text = Array.isArray(topic.text)
            ? [...topic.text]
            : [topic.text];
        // const topics = [topic.name];
        // const words = topic.name.split("-") ?? [];
        // const length = words.length - (topic.sufix ?? 1);
        // const content = words.slice(0, length).join("-");
        // const bases = content.split("-") ?? [];
        // const topics2 = bases
        //         .map(b => this.topics().find(t => t.name === b))
        //         .filter((t): t is ITopic => t !== undefined);
        // topic.type == "course" ? topics.unshift("course") : "";
        // topics.unshift(...topics2.map(t => t.name));
        const {topics, topics2} = this.getTopics(topic)
        text.push(...topics2.flatMap(t => t.text));
// const sonIguales =
//     JSON.stringify(topics) === JSON.stringify(topics2) &&
//     JSON.stringify(text) === JSON.stringify(text2);
// if (sonIguales) {
//     console.log(topic.name, ": IGUALES")
// } else {
//     console.log(topic.name, ": DISTINTOS");
//     console.log(topics, text);
//     console.log(topics2, text2, content);
// }
        return { topics, text };
    };
}
