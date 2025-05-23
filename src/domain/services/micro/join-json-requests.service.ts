import { inject, Injectable } from "@angular/core";
import { forkJoin } from "rxjs";
import { JsonRequestService } from "./json-request.service";

@Injectable({
    providedIn: "root",
})
export class JoinJsonRequestsService {
    private readonly request = inject(JsonRequestService);

    readonly call = (...files: string[]) => {
        const requests = files.map(f => this.request.call(f))
        return forkJoin(requests)
    };
}
