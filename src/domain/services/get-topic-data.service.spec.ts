import { TestBed } from '@angular/core/testing';

import { GetTopicDataService } from './get-topic-data.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('GetTopicDataService', () => {
  let service: GetTopicDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GetTopicDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
