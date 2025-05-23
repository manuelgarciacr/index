import { Observable } from "rxjs";

// export type resp<V> = {
//     status: number,
//     message: string | boolean,
//     data: V[]
// }

// export type Resp<V> = {
//     status: number,
//     message: string | boolean,
//     data?: V
// }

/**
 * V: Response type
 */
export interface IHttpAdapter<T> {
    get: (
        url: string,
        params: {[key: string]: unknown}
    ) => Observable<T>;
    // post: (data: {
    //     url: string;
    //     body?: T;
    //     arg?: string | Params;
    //     action?: string;
    // }) => Observable<Resp<V>>;
    // put: (url: string, data: T) => Observable<Resp<V>>;
    // delete: (url: string, id: string) => Observable<Resp<V>>;
}

