import { Module } from "@nestjs/common";
import { AuthController } from "#app/auth/auth.controller.js";
import { AuthService } from "#app/auth/auth.service.js";

@Module({ controllers: [AuthController], providers: [AuthService] })
export class AuthModule {}
