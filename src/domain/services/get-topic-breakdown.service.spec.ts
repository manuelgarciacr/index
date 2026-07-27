import { TestBed } from '@angular/core/testing';

import { GetTopicBreakdownService } from './get-topic-breakdown.service';

describe('GetTopicBreakdownService', () => {
  let service: GetTopicBreakdownService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetTopicBreakdownService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
