import { UserResponseDto } from './user-response.dto';

export class UserIntegrationResponseDto {
  returnUrl: string;
  authModel: {
    uuid: string;
    status: string;
    error: string | null;
  };
  integrationUser: UserResponseDto & {
    uuid: string;
  };
  integration: {
    type: 'spotify' | 'youtube';
    returnUrl: string;
  };
}
