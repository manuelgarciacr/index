import { TestBed } from '@angular/core/testing';

import { JoinJsonRequestsService } from './join-json-requests.service';

describe('JoinRequestsService', () => {
  let service: JoinJsonRequestsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JoinJsonRequestsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
