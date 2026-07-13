import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { requestContext } from '../../../common/audit/request-context';

export interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') ?? '',
    });
  }

  async validate(payload: JwtPayload) {
    const store = requestContext.getStore();
    if (store) {
      store.userId = payload.sub;
      store.role = payload.role;
    }
    return { userId: payload.sub, role: payload.role };
  }
}
