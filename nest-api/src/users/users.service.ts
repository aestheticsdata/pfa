import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "@config/app.config";
import { PrismaService } from "../prisma/prisma.service";
import type { Users } from "../../generated/prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

export interface SignInResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    baseCurrency: string;
    language: string | null;
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async signIn(email: string, password: string): Promise<SignInResponse> {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("User does not exist");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.buildSignInResponse(user);
  }

  /**
   * Builds the sign-in response (token + user).
   * Reusable for sign-in and add-user (auto sign-in after registration).
   */
  buildSignInResponse(user: Users): SignInResponse {
    const { jwtSecret } = this.config.getOrThrow<AppConfig>("app");
    const token = jwt.sign({ id: user.ID }, jwtSecret, { expiresIn: "10h" });
    return {
      token,
      user: {
        id: user.ID,
        name: user.name,
        email: user.email,
        baseCurrency: user.baseCurrency,
        language: user.language,
      },
    };
  }
}
