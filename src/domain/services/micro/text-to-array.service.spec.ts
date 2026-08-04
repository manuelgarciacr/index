import { TestBed } from '@angular/core/testing';

import { TextToArrayService } from './text-to-array.service';

describe('TextToArrayService', () => {
  let service: TextToArrayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextToArrayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
