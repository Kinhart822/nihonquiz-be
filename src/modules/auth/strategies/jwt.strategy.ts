import { EnvKey } from '@constants/env.constant';
import { UserRepository } from '@database/repository/user.repository';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { httpErrors } from '@shared/exceptions/http-exception';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>(EnvKey.JWT_SECRET_KEY),
    });
  }

  async validate(payload: JwtPayloadDto) {
    const user = await this.userRepository.findOneBy({ id: payload.id });
    if (!user) {
      throw new HttpException(httpErrors.FORBIDDEN, HttpStatus.UNAUTHORIZED);
    }

    return payload;
  }
}
