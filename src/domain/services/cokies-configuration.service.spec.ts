import { TestBed } from '@angular/core/testing';

import { CokiesConfigurationService } from './cokies-configuration.service';

describe('CokiesConfigurationService', () => {
  let service: CokiesConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CokiesConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
