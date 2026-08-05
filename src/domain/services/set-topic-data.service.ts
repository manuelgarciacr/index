import { Injectable, inject } from '@angular/core';
import { SetCentreTextService, IRepo, ITopic, TextToArrayService } from '@domain';

@Injectable({
  providedIn: 'root',
})
export class SetTopicDataService {
    private readonly setCentreText = inject(SetCentreTextService).call
    private readonly textToArray = inject(TextToArrayService).call;
    //private readonly repos = inject(DataService).repos;

    // topic is updated
    readonly call = (topic: ITopic, topics: ITopic[], repos: IRepo[]) => {
        //const breakdown = [topic.name];
        const words = topic.name.split("-") ?? [];
        const length = words.length - (topic.sufix ?? 1);
        const subjects = [
            ...words.slice(0, length),
            ...this.textToArray(topic.topics ?? [])
        ].filter(sb => (topics.find(t => t.name == sb)?.type ?? "subject") == "subject");
        const topics2 = subjects
            .map(s => topics.find(t => t.name === s))
            .filter((t): t is ITopic => t !== undefined);

//console.log(`DEBUG ${++this.cnt}`, topic, subjects);

        topic.breakdown = [...subjects, ...(topic.type == "course" ? ["course"] : []), topic.name]

        if (topic.type === "centre") {
            this.setCentreText(topic, topics, repos)
        } else {
            topic.text = [
                ...this.textToArray(topic.text),
                ...topics2.flatMap(t => t.text),
            ];
        }
    }
}
