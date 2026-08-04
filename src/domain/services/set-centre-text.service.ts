import { Injectable } from '@angular/core';
import { IRepo, ITopic } from '@domain';

@Injectable({
    providedIn: "root",
})
export class SetCentreTextService {
    //private readonly repos = inject(DataService).repos;

    readonly call = (centre: ITopic, topics: ITopic[], repos: IRepo[]) => {

        const text = topics
            .filter(t => t.type == "course")
            .filter(t => t.text.length)
            .filter(t =>
                repos
                    .some(r =>
                        r.topics.includes(t.name) &&
                        r.topics.includes(centre.name)
                    )
            ).map(t => t.text[0]);

        text.length ? text.unshift("Courses:") : null;
        text.length ? text.unshift(...(centre.text as string[])) : null;

        centre.text = text
    }
}
