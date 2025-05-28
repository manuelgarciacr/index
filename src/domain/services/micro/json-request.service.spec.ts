import { TestBed } from "@angular/core/testing";

import { JsonRequestService } from "./json-request.service";
import {
    provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("RequestService", () => {
    //let httpTesting = TestBed.inject(HttpTestingController);
    let service: JsonRequestService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });
        service = TestBed.inject(JsonRequestService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
