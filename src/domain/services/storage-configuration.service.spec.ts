import { TestBed } from '@angular/core/testing';

import { StorageConfigurationService } from './storage-configuration.service';

describe('ConfigurationService', () => {
  let service: StorageConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
