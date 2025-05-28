import { TestBed } from "@angular/core/testing";

import { JoinJsonRequestsService } from "./join-json-requests.service";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe("JoinRequestsService", () => {
    let service: JoinJsonRequestsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(JoinJsonRequestsService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
