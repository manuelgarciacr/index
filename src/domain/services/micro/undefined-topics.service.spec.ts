import { TestBed } from '@angular/core/testing';

import { UndefinedTopicsService } from './undefined-topics.service';

describe('UndefinedTopicsService', () => {
  let service: UndefinedTopicsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UndefinedTopicsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
