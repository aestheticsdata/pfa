import { Account } from "@contexts/identity/domain/account";
import type { SyntheticAccountRef } from "@contexts/identity/domain/interfaces/identityTypes";
import { AccountRepository } from "@contexts/identity/domain/ports/account.repository";
import { SYNTHETIC_ACCOUNTS_WHERE } from "@contexts/identity/domain/synthetic-email";
import { PrismaService } from "@db/prisma.service";
import type { Users } from "@generated/prisma/client";
import { Injectable } from "@nestjs/common";

const toAccount = (row: Users) =>
  Account.restore({
    id: row.ID,
    name: row.name,
    email: row.email,
    passwordHash: row.password,
    baseCurrency: row.baseCurrency,
    language: row.language,
    registerDate: row.registerDate ?? new Date(0),
    isSynthetic: row.isSynthetic,
    disabledAt: row.disabledAt,
  });

@Injectable()
export class PrismaAccountRepository extends AccountRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async byEmail(email: string): Promise<Account | null> {
    const row = await this.prisma.users.findUnique({ where: { email } });
    return row && toAccount(row);
  }

  async byId(id: string): Promise<Account | null> {
    const row = await this.prisma.users.findUnique({ where: { ID: id } });
    return row && toAccount(row);
  }

  async add(account: Account): Promise<void> {
    const state = account.snapshot();
    await this.prisma.users.create({
      data: {
        ID: state.id,
        name: state.name,
        email: state.email,
        password: state.passwordHash,
        baseCurrency: state.baseCurrency,
        language: state.language,
        registerDate: state.registerDate,
        isSynthetic: state.isSynthetic,
      },
    });
  }

  async setLanguage(id: string, language: string | undefined): Promise<Account> {
    return toAccount(
      await this.prisma.users.update({ where: { ID: id }, data: language === undefined ? {} : { language } }),
    );
  }

  synthetic(email: string): Promise<SyntheticAccountRef | null> {
    return this.prisma.users.findFirst({
      where: { ...SYNTHETIC_ACCOUNTS_WHERE, email },
      select: { ID: true, email: true },
    });
  }

  async disable(id: string, at: Date): Promise<void> {
    await this.prisma.users.update({ where: { ID: id }, data: { disabledAt: at } });
  }
}
