import { inject, Injectable } from "@angular/core";
import { DataService, ITopic } from "@domain";

@Injectable({
    providedIn: "root",
})
export class GetBasesService {
    private readonly topics = inject(DataService).topics;

    readonly call = (name: string): ITopic[] => {
        const topic = this.topics().find(t => t.name === name);
        const type = topic?.type ?? "";

        if (type !== "subject" && type != "centre") {
            const bases = name.split("-") ?? [];
            const topics = bases
                .map(b => this.topics().find(t => t.name === b))
                .filter((t): t is ITopic => t !== undefined);
            return topics
        }
        return []
    };
}
