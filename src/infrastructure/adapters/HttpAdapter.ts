import { Observable, TimeoutError, catchError, retry, throwError, timeout, timer } from "rxjs";
import { IHttpAdapter } from "./IHttpAdapter";
import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders,
    HttpParams,
    HttpParamsOptions,
} from '@angular/common/http';
import { Injectable, inject } from "@angular/core";

const httpOptions = {
    headers: new HttpHeaders({
        "Content-Type": "application/json",
    }),
    observe: "body" as const,
    params: {}
};

/**
 * T: Response type
 */
@Injectable({
    providedIn: "root",
})
export class HttpAdapter<T> implements IHttpAdapter<T> {
    private http = inject(HttpClient); // HTTP service

    get = (url: string, params: HttpParamsOptions): Observable<T> => {
        return this._get(url, new HttpParams(params));
    };

    /**
     * Get HTTP request
     *
     * @param url String with destination endpoint
     * @param params Type HttpParams. Query string parameters to send with the
     *   application/x-www-form-urlencode MIME type.
     * @returns An Observable of type T with the response from the server
     *   or an error
     */
    private _get = (url: string, params: HttpParams) =>
        this.http.get<T>(url, { ...httpOptions, params }).pipe(
            //auditTime(11000),
            timeout(10000),
            retry({ count: 2, delay: this.shouldRetry }),
            catchError(this.handleError)
        );

    handleError(error: HttpErrorResponse) {
        let errorMessage = "Unknown error!";

        if (error instanceof TimeoutError) {
            errorMessage = error.message + " (timeout)";
        } else if (error instanceof ProgressEvent) {
            errorMessage = "Progress event";
        } else if (error.error.message) {
            errorMessage = error.error.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        console.error(error);
        //window.alert(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
    // private handleError() {
    //     return (error: unknown): Observable<T> => {
    //         // Let the app keep running by returning a safe result.
    //         return of(error);
    //     };
    // }

    // A custom method to check should retry a request or not
    // Retry when the status code is not 0, 404, 401 nor timeout
    private shouldRetry(error: HttpErrorResponse) {
        if (
            error.status != 0 &&
            error.status != 404 &&
            error.status != 401 &&
            !(error instanceof TimeoutError)
        ) {
            return timer(1000); // Adding a timer from RxJS to return observable<0> to delay param.
        }

        throw error;
    }
}
