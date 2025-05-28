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

        if (type !== "base") {
            const bases = name.split("-") ?? [];
            const topics = bases
                .map(b => this.topics().find(t => t.name === b))
                .filter(t => t !== undefined);
            return topics
        }
        return []
    };
}
