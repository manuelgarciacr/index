/* eslint-disable @typescript-eslint/no-unused-vars */
import { inject, Injectable } from '@angular/core';
import { GetBasesService } from './micro/get-bases.service';
import { DataService, ITopic } from '@domain';

@Injectable({
    providedIn: "root",
})
export class GetTopicDataService {
    private readonly topics = inject(DataService).topics;
    private readonly getBases = inject(GetBasesService);

    readonly call = (topic: ITopic) => {
        const bases = this.getBases.call(topic.name);
        const text = bases.flatMap(t => t.text);
        const topics = bases.flatMap(t => t.name);

        text.unshift(...topic.text);
        topics.push(topic.name);

        const text2 = Array.isArray(topic.text)
            ? [...topic.text]
            : [topic.text];
        const topics2 = [topic.name];
        const words = topic.name.split("-") ?? [];
        const length = words.length - (topic.sufix ?? 1);
        const content = words.slice(0, length).join("-");
        const bases2 = content.split("-") ?? [];
        const topics3 = bases2
                .map(b => this.topics().find(t => t.name === b))
                .filter((t): t is ITopic => t !== undefined);
        text2.push(...topics3.flatMap(t => t.text));
        topics2.unshift(...topics3.flatMap(t => t.name));
const sonIguales =
    JSON.stringify(topics) === JSON.stringify(topics2) &&
    JSON.stringify(text) === JSON.stringify(text2);
if (sonIguales) {
    console.log(topic.name, ": IGUALES")
} else {
    console.log(topic.name, ": DISTINTOS");
    console.log(topics, text);
    console.log(topics2, text2, content);
}
        return { topics, text };
    };
}
