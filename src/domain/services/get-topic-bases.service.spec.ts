import { TestBed } from '@angular/core/testing';

import { GetTopicBasesService } from './get-topic-bases.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('GetTopicBasesService', () => {
  let service: GetTopicBasesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GetTopicBasesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
