import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class SepayIpnGuard implements CanActivate {
  public constructor(private readonly configService: ConfigService) {}

  public canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.getOrThrow<string>(
      'SEPAY_IPN_SECRET_KEY',
    );
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const header = request.headers['x-secret-key'];
    const provided = Array.isArray(header) ? header[0] : header;

    if (!provided || !this.matches(provided, expected)) {
      throw new UnauthorizedException('Invalid IPN secret key');
    }

    return true;
  }

  private matches(provided: string, expected: string): boolean {
    const actual = Buffer.from(provided);
    const expectedBuffer = Buffer.from(expected);

    if (actual.length !== expectedBuffer.length) return false;

    return timingSafeEqual(actual, expectedBuffer);
  }
}
