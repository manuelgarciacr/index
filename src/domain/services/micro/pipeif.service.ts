import { Injectable } from "@angular/core";
import { mergeMap, Observable, of, OperatorFunction } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class PipeifService {
    readonly call = <T extends (unknown[] | Error)[], R = T>(
            predicate: (value: T) => boolean,
            ...pipes: OperatorFunction<T, R>[]
        ): OperatorFunction<T, T | R> => {
            return (source: Observable<T>) =>
                source.pipe(
                    mergeMap(value =>
                        predicate(value as T)
                            ? of(value).pipe(...(pipes as [OperatorFunction<T, R>]))
                            : of(value)
                    )
                );
        }
}
