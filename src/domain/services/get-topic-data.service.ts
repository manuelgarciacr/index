import { Injectable, inject } from "@angular/core";
import { SetCentreTextService, IRepo, ITopic } from "@domain";

@Injectable({
    providedIn: "root",
})
export class GetTopicDataService {
//cnt = 0
    private readonly getCentreCourses = inject(SetCentreTextService).call
    //private readonly repos = inject(DataService).repos;

    readonly call = (topic: string | ITopic, topics: ITopic[], repos: IRepo[]) => {
        if (typeof topic == "string") {
            topic = topics.find(t => t.name == topic) ?? topic;
        }

        // If the topic does not exist
        if (typeof topic == "string") return { breakdown: [topic], text: [] };

        const breakdown = [topic.name];
        const words = topic.name.split("-") ?? [];
        const length = words.length - (topic.sufix ?? 1);
        const subjects = words.slice(0, length);

        if (topic.topics)
            subjects.push(
                ...(typeof topic.topics === "string"
                    ? [topic.topics]
                    : topic.topics),
            );
//console.log(`DEBUG ${++this.cnt}`, topic, subjects);
        topic.type == "course" ? breakdown.unshift("course") : "";
        const topics2 = subjects
            .map(s => topics.find(t => t.name === s))
            .filter((t): t is ITopic => t !== undefined);
        // Solo permite filtrar por topics definidos en topics.json
        breakdown.unshift(...subjects);

        const text = Array.isArray(topic.text) ? [...topic.text] : [topic.text];
        text.push(...topics2.flatMap(t => t.text));
if (topic.type === "centre") {
    console.log("CENTRE", this.getCentreCourses(topic, topics, repos))
}
        return { breakdown, text };
    };
}
