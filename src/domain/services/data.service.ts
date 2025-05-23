import { inject, Injectable } from "@angular/core";
import { JoinJsonRequestsService } from "./micro/join-json-requests.service";
import { map, tap } from "rxjs";
import { UndefinedTopicsService } from "./micro/undefined-topics.service";
import { IRepo, ITopic } from "@domain";
import { PipeifService } from "./micro/pipeif.service";

@Injectable({
    providedIn: "root",
})
export class DataService {
    private readonly joinReq = inject(JoinJsonRequestsService).call;
    private readonly udefTopics = inject(UndefinedTopicsService).call;
    private readonly pipeif = inject(PipeifService).call;
    predicate = (v: (unknown[] | Error)[]) => !(v[0] instanceof Error);

    readonly call = () =>
        this.joinReq("data", "topics", "subtopics").pipe(
            map(resp => [...resp, [], []]),
            this.pipeif(
                v =>
                    Array.isArray(v[0]) &&
                    Array.isArray(v[1]) &&
                    Array.isArray(v[2]),
                map(v => {
                    (v[1] as ITopic[]).forEach(t => t.text = Array.isArray(t.text) ? t.text : [t.text]);
                    (v[2] as ITopic[]).forEach(t => t.text = Array.isArray(t.text) ? t.text : [t.text]);
                    return [v[0], v[1], v[2], v[3], v[4]]
                }),
                map(v => {
                    (v[0] as IRepo[]).forEach(r => {
                        this.udefTopics(r.topics, v[1], v[3]);
                    });
                    return v;
                }),
                map(v => {
                    (v[0] as IRepo[]).forEach(r =>
                        this.udefTopics(r.subtopics, v[2], v[4])
                    );
                    return v;
                }),
                tap(v => console.log(v))
            )
        )
}


