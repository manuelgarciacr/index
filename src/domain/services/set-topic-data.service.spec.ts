import { TestBed } from '@angular/core/testing';

import { SetTopicDataService } from './set-topic-data.service';

describe('SetTopicDataService', () => {
  let service: SetTopicDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SetTopicDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
