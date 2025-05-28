import { TestBed } from "@angular/core/testing";

import { GetBasesService } from "./get-bases.service";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe("GetBasesService", () => {
    let service: GetBasesService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(GetBasesService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
