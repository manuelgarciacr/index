import { TestBed } from '@angular/core/testing';

import { PipeifService } from './pipeif.service';

describe('PipeifService', () => {
  let service: PipeifService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PipeifService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
