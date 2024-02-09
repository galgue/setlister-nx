import { Test, TestingModule } from '@nestjs/testing';
import { SetlistFmApiService } from './setlist-fm-api.service';

describe('SetlistFmApiService', () => {
  let service: SetlistFmApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SetlistFmApiService],
    }).compile();

    service = module.get<SetlistFmApiService>(SetlistFmApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
