import { Injectable } from "@angular/core";
import { ITopic } from "@domain";

@Injectable({
    providedIn: "root",
})
export class UndefinedTopicsService {
    private readonly topicsFn = (t: string, definitions: ITopic[], udefTopics: string[]) => {
        if (udefTopics.indexOf(t) >= 0) {
            return;
        }
        if (udefTopics.indexOf(`${t} (*)`) >= 0) {
            return;
        }

        const def = definitions.find(topic => topic.topic === t);
        const hasText = !!def && !!def?.text.length && typeof def.text[0] === "string" && def.text[0].length > 2;

        if (def && hasText) {
            return
        }

        const sufix = !def || hasText ? "" : " (*)";

        udefTopics.push(t + sufix);
    };

    readonly call = (
        topics: string[],
        definitions: ITopic[],
        undefinedTopics: string[]
    ) => {
        // undefinedTopics: Passed by reference and could be updated
        topics.forEach(t => this.topicsFn(t, definitions, undefinedTopics));
        return undefinedTopics.sort()
    };
}
