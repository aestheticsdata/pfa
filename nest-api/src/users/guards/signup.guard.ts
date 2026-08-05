import { CanActivate, ForbiddenException, Injectable } from "@nestjs/common";

@Injectable()
export class SignupGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.SIGNUPS_ENABLED === "false") {
      throw new ForbiddenException("Sign-ups are currently disabled");
    }

    return true;
  }
}
