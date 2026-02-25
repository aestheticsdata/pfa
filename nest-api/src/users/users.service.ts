import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { Users } from "../../generated/prisma/client";
import type { AddUserDto } from "./dto/add-user.dto";
import * as bcrypt from "bcryptjs";

export interface SignInResponse {
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
  constructor(private readonly prisma: PrismaService) {}

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

  async addUser(dto: AddUserDto): Promise<SignInResponse> {
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const id = randomUUID();
    const baseCurrency = dto.baseCurrency ?? "EUR";
    const language = dto.language ?? "fr";
    const registerDate = dto.registerDate ? new Date(dto.registerDate) : new Date();

    await this.prisma.users.create({
      data: {
        ID: id,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        baseCurrency,
        language,
        registerDate,
      },
    });

    const user = await this.prisma.users.findUniqueOrThrow({
      where: { ID: id },
    });
    return this.buildSignInResponse(user);
  }

  async findById(userId: string): Promise<SignInResponse> {
    const user = await this.prisma.users.findUnique({
      where: { ID: userId },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.buildSignInResponse(user);
  }

  /**
   * Builds the sign-in response (user only; session is set via cookie).
   * Reusable for sign-in and add-user (auto sign-in after registration).
   */
  buildSignInResponse(user: Users): SignInResponse {
    return {
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
