/**
 * @license
 * Copyright Manuel García Criado All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { Injectable, inject } from "@angular/core";
import { IHttpAdapter, HttpAdapter } from "@infrastructure";
// import { environment } from "@environments";
// import { IUser } from "@domain";

// const url = `${environment.apiUrl}/users`;

// Response body
// type T = {
//     user?: IUser;
// };

@Injectable({
    providedIn: "root",
})
export class JsonRepoService<T> {
    private dataSource: IHttpAdapter<T> = inject(HttpAdapter<T>);

    getJson = (url: string) => this.dataSource.get(url, {});
}
