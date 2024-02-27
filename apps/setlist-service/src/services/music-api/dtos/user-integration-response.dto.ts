import { UserResponseDto } from './user-response.dto';

export type IntegrationType = 'spotify' | 'youtube';
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
    type: IntegrationType;
    returnUrl: string;
  };
}
