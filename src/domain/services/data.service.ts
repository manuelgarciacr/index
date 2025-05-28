import { inject, Injectable, signal } from "@angular/core";
import { JoinJsonRequestsService } from "./micro/join-json-requests.service";
import { catchError, map, of, Subject, tap } from "rxjs";
import { UndefinedTopicsService } from "./micro/undefined-topics.service";
import { IOrder, IRepo, ITopic } from "@domain";
import { PipeifService } from "./micro/pipeif.service";

@Injectable({
    providedIn: "root",
})
export class DataService {
    private readonly joinReq = inject(JoinJsonRequestsService).call;
    private readonly udefTopicsService = inject(UndefinedTopicsService).call;
    private readonly pipeif = inject(PipeifService).call;
    private _data = signal<IRepo[]>([]);
    private _topics = signal<ITopic[]>([]);
    private _subtopics = signal<ITopic[]>([]);
    private _udefTopics = signal<string[]>([]);
    private _udefSubtopics = signal<string[]>([]);

    readonly data = this._data.asReadonly();
    readonly topics = this._topics.asReadonly();
    readonly subtopics = this._subtopics.asReadonly();
    readonly udefTopics = this._udefTopics.asReadonly();
    readonly udefSubtopics = this._udefSubtopics.asReadonly();
    private readonly _error$ = new Subject<Error>(); // Total characters obtained
    get error$() {
        return this._error$;
    }

    predicate = (v: (unknown[] | Error)[]) => !(v[0] instanceof Error);

    constructor() {
        this.joinReq("data", "topics", "subtopics")
            .pipe(
                this.pipeif(
                    v => Array.isArray(v[0]),
                    tap(v => this._data.set(v[0]))
                ),
                this.pipeif(
                    v =>
                        Array.isArray(v[0]) &&
                        Array.isArray(v[1]) &&
                        Array.isArray(v[2]),
                    // converts "text": string to "text": string[]
                    map(v => {
                        (v[1] as ITopic[]).forEach(
                            t =>
                                (t.text = Array.isArray(t.text)
                                    ? t.text
                                    : [t.text])
                        );
                        (v[2] as ITopic[]).forEach(
                            t =>
                                (t.text = Array.isArray(t.text)
                                    ? t.text
                                    : [t.text])
                        );
                        return [v[0], v[1], v[2], [], []];
                    }),
                    map(v => {
                        (v[0] as IRepo[]).forEach(r => {
                            this.udefTopicsService(r.topics, v[1], v[3]);
                        });
                        return v;
                    }),
                    map(v => {
                        (v[0] as IRepo[]).forEach(r =>
                            this.udefTopicsService(r.subtopics, v[2], v[4])
                        );
                        return v;
                    }),
                    tap(v => {
                        (v[0] as IRepo[]).forEach(r => {
                            r.topics.forEach(t => {
                                const some = (v[1] as ITopic[]).some(
                                    v => v.name === t
                                );
                                if (!some) {
                                    v[1].push({ name: t, text: [], type: "" });
                                }
                            });
                        });
                        this._topics.set(v[1]);
                        this._subtopics.set(v[2]);
                        this._udefTopics.set(v[3]);
                        this._udefSubtopics.set(v[4]);
                    }),
                ),
                catchError(err => {
                    console.error(err);
                    this._error$.next(err)
                    return of();
                })
            )
            .subscribe({
                next: errors => {
                    errors.forEach(
                        err => !Array.isArray(err) && this._error$.next(err)
                    );
                },
                error: err => {
                    console.error(err);
                },
            });
    }

    readonly sortData = (
        sort01: keyof IOrder,
        sort02: keyof IOrder,
        order: IOrder
    ) => {
        const order01 = order[sort01];
        const order02 = order[sort02];

        this._data.update(v => {
            if (!Array.isArray(v)) return v;
            v.sort((a, b) => {
                if (order02 === "down") [a, b] = [b, a];
                return a[sort02].localeCompare(b[sort02]);
            }).sort((a, b) => {
                if (order01 === "down") [a, b] = [b, a];
                return a[sort01].localeCompare(b[sort01]);
            });
            //  Sort in place does not trigger changes detection on signals
            return [...v];
        });
    };
}


