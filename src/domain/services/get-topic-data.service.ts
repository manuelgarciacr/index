import { Injectable } from "@angular/core";
import { ITopic } from "@domain";

@Injectable({
    providedIn: "root",
})
export class GetTopicDataService {
//cnt = 0
    readonly call = (topic: string | ITopic, topics: ITopic[]) => {
        if (typeof topic == "string") {
            topic = topics.find(t => t.name == topic) ?? topic;
        }
        if (typeof topic == "string") return { breakdown: [topic], text: [] };

        const breakdown = [topic.name];
        const words = topic.name.split("-") ?? [];
        const length = words.length - (topic.sufix ?? 1);
        // const content = words.slice(0, length).join("-");
        // const subjects = content.split("-") ?? [];
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
        // breakdown.unshift(...topics2.map(t => t.name));
        breakdown.unshift(...subjects);

        const text = Array.isArray(topic.text) ? [...topic.text] : [topic.text];
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

        return { breakdown, text };
    };
}
