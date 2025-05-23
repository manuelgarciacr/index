import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { JsonRepoService } from '@infrastructure';
import { catchError, of } from 'rxjs';

@Injectable({
    providedIn: "root",
})
export class JsonRequestService {
    private readonly http = inject(HttpClient);
    // bug: typescript does not asumes the generic type
    //   of the injected service,
    //   you needs especifically redeclare this
    jsonRepoService = inject(
        JsonRepoService<unknown[]>
    );

    readonly call = (file: string) =>
        this.jsonRepoService.getJson(file + ".json").pipe(
            catchError(error => {
                return of<Error>(error);
            })
        );
}
