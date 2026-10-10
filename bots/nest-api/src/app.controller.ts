import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  /** For Zeus's fleet view: unauthenticated, says nothing but "up". */
  @Get("health")
  health(): { ok: true; service: string } {
    return { ok: true, service: "bots-api" };
  }
}
