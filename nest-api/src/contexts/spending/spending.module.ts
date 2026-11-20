import { ReceiptReadingModule } from "@contexts/receipt-reading/receipt-reading.module";
import { CreateSpendingGroup } from "@contexts/spending/application/create-spending-group.use-case";
import { DeleteSpending } from "@contexts/spending/application/delete-spending.use-case";
import { DeleteSpendingGroup } from "@contexts/spending/application/delete-spending-group.use-case";
import { EditSpendingGroup } from "@contexts/spending/application/edit-spending-group.use-case";
import { MergeSpendingsIntoGroup } from "@contexts/spending/application/merge-spendings-into-group.use-case";
import { RecordSpending } from "@contexts/spending/application/record-spending.use-case";
import { ReviseSpending } from "@contexts/spending/application/revise-spending.use-case";
import { UngroupSpendingGroup } from "@contexts/spending/application/ungroup-spending-group.use-case";
import { CategoryLookup } from "@contexts/spending/domain/ports/category-lookup";
import { ReceiptReleaser } from "@contexts/spending/domain/ports/receipt-releaser";
import { SpendingRepository } from "@contexts/spending/domain/ports/spending.repository";
import { SpendingGroupRepository } from "@contexts/spending/domain/ports/spending-group.repository";
import { PrismaCategoryLookup } from "@contexts/spending/infrastructure/prisma-category-lookup";
import { PrismaSpendingRepository } from "@contexts/spending/infrastructure/prisma-spending.repository";
import { PrismaSpendingGroupRepository } from "@contexts/spending/infrastructure/prisma-spending-group.repository";
import { SpendingQueries } from "@contexts/spending/infrastructure/queries/spending.queries";
import { ReceiptFilesReleaser } from "@contexts/spending/infrastructure/receipt-files-releaser";
import { SpendingGroupsController } from "@contexts/spending/interface/spending-groups.controller";
import { SpendingsController } from "@contexts/spending/interface/spendings.controller";
import { MonitoringModule } from "@monitoring/monitoring.module";
import { Module } from "@nestjs/common";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";

/**
 * The Spending context (PFA-273), and its composition root: the one place that knows which adapter
 * plugs into which port. A test swaps a binding, nothing else.
 */
@Module({
  imports: [MonitoringModule, ReceiptReadingModule],
  controllers: [SpendingsController, SpendingGroupsController],
  providers: [
    RecordSpending,
    ReviseSpending,
    DeleteSpending,
    CreateSpendingGroup,
    EditSpendingGroup,
    MergeSpendingsIntoGroup,
    UngroupSpendingGroup,
    DeleteSpendingGroup,
    SpendingQueries,
    SessionAuthGuard,
    { provide: SpendingRepository, useClass: PrismaSpendingRepository },
    { provide: SpendingGroupRepository, useClass: PrismaSpendingGroupRepository },
    { provide: CategoryLookup, useClass: PrismaCategoryLookup },
    { provide: ReceiptReleaser, useClass: ReceiptFilesReleaser },
  ],
})
export class SpendingModule {}
