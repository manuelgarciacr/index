import { TestBed } from '@angular/core/testing';

import { SetCentreTextService } from './set-centre-text.service';

describe('SetCentreTextsService', () => {
  let service: SetCentreTextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SetCentreTextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
