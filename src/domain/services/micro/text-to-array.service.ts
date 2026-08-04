import { Injectable } from '@angular/core';

@Injectable({
    providedIn: "root",
})
export class TextToArrayService {
    readonly call = (text: string | string[]) =>
        Array.isArray(text) ? text
            : text == "" ? []
            : [text];
}
