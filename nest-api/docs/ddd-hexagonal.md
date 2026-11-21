# nest-api — Domain-Driven Design and hexagonal architecture

Reference for epic **PFA-270**. It explains both approaches from scratch, applies them to PFA's real
code, and fixes the target design the implementation tickets (PFA-272 → PFA-299) follow. Written
before the work as its map, then brought up to date once the epic was built (§7 is the real tree, §11
the status), and §11.1 lists where the code ended up differing from the map.

An illustrated version, every diagram drawn, is [ddd-hexagonal.pdf](ddd-hexagonal.pdf) (source:
`docs/pdf/ddd-hexagonal.html`, rendered by headless Chrome — PFA-300), and in French
[ddd-hexagonal.fr.pdf](ddd-hexagonal.fr.pdf) (PFA-301).

---

## 1. TL;DR

- **Decision: DDD _and_ hexagonal.** They answer different questions and fit together without friction:
  - **DDD** decides **what** the model is: which concepts exist, what rules they guard, where one part of
    the business ends and another starts.
  - **Hexagonal (ports & adapters)** decides **where code lives and which way dependencies point**: the
    domain at the centre knows nothing about NestJS, Prisma, Redis, Tesseract or the filesystem; those
    plug in from the outside.
- **Pragmatic, not dogmatic.** Writes go through aggregates. Read-heavy screens (statistics, dashboard
  charts) stay as plain queries — building an aggregate only to serialise it is ceremony, not design.
- **Strangler migration.** One bounded context at a time, the HTTP contract never changes, the existing
  e2e suite is the safety net. The pilot is the Spending context, because it holds the most real rules.

---

## 2. Why: what the code looks like today

nest-api is organised the standard NestJS way: one folder per feature, a controller, a service, DTOs.
It is clean and tested end-to-end. But the **business rules are not a thing you can point at**. They are
spread through services that also do persistence, file I/O and HTTP.

Concrete symptoms, all from the current code:

| Symptom | Where | Why it hurts |
| --- | --- | --- |
| Services throw HTTP exceptions (`NotFoundException`, `BadRequestException`) | `spending-groups.service.ts`, `spendings.service.ts` | Business code knows it is behind HTTP. A cron job or a CLI calling it gets an HTTP 404 object. |
| A rule lives in a Prisma `$transaction` array | `SpendingGroupsService.update` | "A line added while editing joins the group's receipt and currency" is only true because of how one query is assembled. Nothing stops another code path from breaking it. |
| A rule is checked in one path, not another | `merge()` checks "a group spans a single day"; `create()` gets it for free by construction; nothing states it once | The invariant has no owner. |
| The same rule written twice | Implicit category creation: `resolveCategoryID` in `categories/category-resolver.ts` **and** `createNewCategoryAndUpdate` inside `SpendingsService.updateSpending` | They can drift. One already differs (the update path writes the spending inside the helper). |
| Money is a `number` | `Number(row.amount)` then `+=` in `dashboard.service.ts`, stats services | Decimal(10,2) from MySQL becomes a float; sums are rounded after the fact (`round2`, `roundCurrency`). |
| Side effects are direct calls across features | Every delete/merge path calls `receiptFiles.release(...)` by hand | Forget it once and a file leaks on disk. |
| Untestable without a database | Every rule above | Unit tests need Prisma; only e2e covers them. |

None of this is a bug today. It is the cost that grows with each feature — and PFA has grown a lot
(groups, OCR, proposals, stores, unit prices). DDD + hexagonal is how a backend engineer answers
"how do you keep a growing codebase honest?".

---

## 3. DDD in ten minutes

DDD (Eric Evans, 2003) has two halves. Most people only know the second; the first matters more.

### 3.1 Strategic design — cutting the problem

**Domain.** The business the software serves. Here: personal finance — tracking what you spend,
planning a monthly budget, reading receipts, comparing prices.

**Subdomains.** The domain split by *business* capability, ranked by how much they matter:

- **Core** — why the product exists, where effort pays off. Deserves the richest model.
- **Supporting** — needed, specific to us, but not the differentiator.
- **Generic** — solved problems (auth, file storage). Keep thin, or buy.

**Bounded context.** A boundary inside which one model and one vocabulary are consistent. The same word
can mean different things in two contexts — and that is fine, *as long as the boundary is explicit*.
Example in PFA: a **"category"** is an editable thing with a colour in the budget context, but in an
**exceptional expense** it is a frozen copy (`categoryName`, `categoryColor` columns, no FK) — two
models, on purpose.

**Ubiquitous language.** The words the business uses *are* the class, method and event names. If the UI
says "regrouper", the code says `merge`, not `bulkUpdateGroupIDs`.

**Context map.** How contexts relate: who depends on whom, who publishes events, who translates
whose model (an *anti-corruption layer*).

### 3.2 Tactical design — building blocks inside a context

| Building block | What it is | PFA example |
| --- | --- | --- |
| **Entity** | Has an identity that survives change. Two spendings with the same amount are still two spendings. | `Spending`, `Store` |
| **Value object** | Defined only by its values, immutable, validates itself. Replaces primitives. | `Money`, `CalendarMonth`, `UnitPrice`, `NameKey` |
| **Aggregate** | A cluster of entities/VOs changed as **one unit**, behind one **root**. The root is the only entry point and guarantees the invariants. One transaction = one aggregate. | `SpendingGroup` (root) + its lines |
| **Invariant** | A rule that must *always* be true after any operation. | "All lines of a group share its date, currency and receipt." |
| **Repository** | Loads and saves a whole aggregate. Looks like a collection; hides the DB. | `SpendingGroupRepository.byId()`, `.save()` |
| **Domain service** | Domain logic that belongs to no single entity. Pure. | `compareStores()` (already pure in `unit-price.ts`) |
| **Application service / use case** | Orchestrates one user intention: load → call domain → save → publish events. No business rule itself. | `MergeSpendingsIntoGroup` |
| **Domain event** | Something that happened, named in the past tense, that other parts may react to. | `SpendingGroupDeleted`, `ReceiptReleased` |
| **Factory** | Builds a valid aggregate when construction is non-trivial. | `SpendingGroup.create(...)` |

**The one rule to remember:** *an aggregate is a consistency boundary.* Anything that must be true
immediately lives inside one aggregate; anything that can be true "a moment later" goes between
aggregates via events.

---

## 4. Hexagonal architecture in ten minutes

Alistair Cockburn, 2005. Also called **ports & adapters**. Same family as Onion and Clean Architecture;
the vocabulary differs, the idea is the same.

```
                    DRIVING side (who calls us)                DRIVEN side (what we call)
                                                                    
   HTTP controller ──▶ ┌──────────────── application ────────────────┐ ──▶ Prisma adapter     (MySQL)
   Cron job        ──▶ │   use cases                                  │ ──▶ Redis adapter      (sessions)
   CLI / script    ──▶ │      │                                       │ ──▶ Tesseract adapter  (OCR)
   Test            ──▶ │      ▼                                       │ ──▶ Filesystem/SSH     (receipts)
                       │   ┌──────────── domain ──────────────┐       │ ──▶ Event bus adapter
                       │   │ aggregates · value objects ·     │       │
                       │   │ domain services · events · ports │       │
                       │   └──────────────────────────────────┘       │
                       └──────────────────────────────────────────────┘
                        ▲ driving ports                driven ports ▲
                        (use-case API)          (repository, reader, store…)
```

- **Port** — an interface the application owns.
  - *Driving (primary) port*: what the app offers — the use cases.
  - *Driven (secondary) port*: what the app needs — "something that can save a group", "something that
    can read text from an image".
- **Adapter** — a concrete technology plugged into a port: `PrismaSpendingGroupRepository`,
  `TesseractReceiptTextReader`, an HTTP controller, an in-memory fake for tests.
- **The dependency rule** — source code dependencies point **inwards only**.
  `interface → application → domain`, and `infrastructure → application/domain`. The domain imports
  nothing but itself and the shared kernel. Prisma depends on the domain, never the reverse
  (*dependency inversion*).

What this buys, concretely:

1. **Testability** — the domain runs in a unit test in milliseconds, no DB, no Nest container.
2. **Replaceability** — Tesseract → a cloud OCR, filesystem → S3, MySQL → Postgres: one adapter changes.
   (PFA already lived this: Express → Nest, MySQL driver → Prisma + MariaDB adapter.)
3. **Readability** — open `domain/` and you read the business, not the plumbing.

### Why both, and not one

- DDD without hexagonal: you get nice aggregates that call `this.prisma` inside — the model is
  coupled to the database again.
- Hexagonal without DDD: you get ports and adapters around an *anemic* model — services full of
  `if`s and data bags. Clean plumbing around a weak centre.
- Together: DDD fills the hexagon's centre with a real model; hexagonal protects it.

---

## 5. PFA's subdomains and bounded contexts

| Bounded context | Subdomain type | What it owns | Today's code |
| --- | --- | --- | --- |
| **Spending** | Core | Spendings, groups (one receipt, several categories), labels, search | `spendings/`, `spendings/groups/`, `spendings/catalog/` |
| **Receipt reading** | Core (the differentiator) | Receipt images, OCR, parsed lines, bulk-read proposals | `spendings/receipts/`, `receipt-lines/`, `receipt-proposals/`, `upload/` |
| **Price comparison** | Core | Stores, product types, unit prices, store ranking | `spendings/stores/`, `product-types/`, `prices/` |
| **Budget planning** | Supporting | Categories, recurring charges, exceptional expenses, monthly budget (initial amount, ceiling) | `categories/`, `recurrings/`, `exceptionals/`, write side of `dashboard/` |
| **Analytics** | Supporting (read-only) | Yearly stats, trends, heatmap, daily projection, search timeline | `stats/`, read side of `dashboard/` |
| **Identity and access** | Generic | Users, sessions, CSRF, sign-in limiter, synthetic (bot) accounts | `users/` |
| *Platform* (not a domain) | — | Config, logging, metrics, health, DB/SSH backups, the event bus, Redis, Prisma | `platform/` |

### Context map

As built (PFA-278 → PFA-298):

```
                       ┌──────────────────────┐
                       │ Identity and access  │  guards + GetUserId: other contexts get a user ID, nothing more
                       └──────────┬───────────┘
                                  │ (HTTP edge only)
        ┌─────────────────────────┼──────────────────────────────────────────┐
        ▼                         ▼                                          ▼
 ┌──────────────────┐  CategoryLookup port  ┌──────────────────┐
 │ Budget planning  │ ◀──────────────────── │ Spending         │
 │ categories,      │  (adapter → its       │ spendings,       │
 │ recurrings,      │   CategoriesService)  │ groups           │
 │ exceptionals,    │                       └────────┬─────────┘
 │ month's budget   │                                │ events, after the save:
 └──────────────────┘                                │ spendingDeleted · groupDeleted ·
                                                     │ groupLinesRemoved · spendingsMerged
                                                     ▼ (InProcessEventBus)
 ┌──────────────────┐ StoreDirectory /      ┌──────────────────────────────┐
 │ Price comparison │ ProductTypeCatalog    │ Receipt reading              │
 │ stores, product  │ ◀──────────────────── │ files, OCR, lines, bulk read │
 │ types, prices    │ (adapters → its       │ releases the receipts the    │
 └──────────────────┘  services)            │ events let go                │
                                            └──────────────────────────────┘

 ┌──────────────────┐   reads the tables directly, per screen (no aggregates, no writes)
 │ Analytics        │ ─────────────────────────────────────────────────────────────▶ MySQL
 └──────────────────┘
```

Relationship types, in DDD terms:

- **Identity → everyone**: *Open Host Service* reduced to its minimum — other contexts get the
  session's user ID (`GetUserId`) and nothing else. No context ever loads an account.
- **Spending → Budget planning**: *Customer/Supplier*. Spending needs to know "is this category usable by
  this user, or create it from a typed name". It asks through a `CategoryLookup` port; Budget planning
  provides the adapter.
- **Spending → Receipt reading**: *Published events*. Deleting a spending does not call the file service;
  it records `spendingDeleted` with the receipts it held, and Receipt reading decides whether each file
  is still held by anyone.
- **Receipt reading → Price comparison**: *Customer/Supplier* again, behind `StoreDirectory` and
  `ProductTypeCatalog`: an anti-corruption layer over price comparison's services.
- **Analytics**: *Conformist read model* — it reads the shared tables directly, read-only, shaped per screen.

---

## 6. Ubiquitous language

The glossary *is* the naming rule. French UI word → code word.

| UI (FR) | Code | Meaning |
| --- | --- | --- |
| Dépense | `Spending` | A one-off purchase on a given day, with an amount, a label, maybe a category and a receipt. |
| Groupe / ticket regroupé | `SpendingGroup` | Several spendings bought on one receipt, each line in its own category. |
| Ligne de groupe | `GroupLine` | A spending that belongs to a group. Its stored label is `"<group> — <detail>"`. |
| Regrouper | `merge` | Existing same-day spendings become lines of a new group. |
| Dégrouper | `ungroup` | Lines become standalone spendings again, keeping the shared receipt. |
| Ticket de caisse | `Receipt` | The image file. A file held by N spendings is a *shared receipt*. |
| Ligne de ticket | `ReceiptLine` | One item read on a receipt: label, amount, quantity, size. |
| Lecture en masse | `BulkRead` | Reading all unread receipts; each one waits as a `QueuedReceipt` holding the OCR's `ReceiptProposal`. |
| Magasin | `Store` | A shop, one per normalised name **and** address. |
| Type de produit | `ProductType` | A generic product compared across brands and stores ("Savon liquide"). |
| Prix unitaire | `UnitPrice` | Price per kg, per L, or per piece — never compared across bases. |
| Dépense récurrente | `RecurringCharge` | A monthly commitment, stored one row per month. |
| Déjà prélevé | `drawn` | Sum of the year's recurring rows up to the current month. |
| Dépense exceptionnelle | `ExceptionalExpense` | A rare large expense, with a frozen category snapshot. |
| Budget du mois / plafond | `MonthlyBudget` / `ceiling` | Initial amount and spending ceiling for a month. |
| Projection | `DailyProjection` | Day-by-day reference month: N-1 → N-2 → M-1 → none. Never an average. |

---

## 7. Folder layout, as built

```
src/
├── main.ts · app.module.ts            # the composition root of the whole app
├── shared-kernel/                     # tiny, stable, used by every context
│   ├── money.ts                       # Money: integer cents + currency, DECIMAL rounding
│   ├── calendar-day.ts                # CalendarDay: a day, no time, no zone
│   ├── calendar-month.ts              # CalendarMonth (UTC-safe)
│   ├── aggregate-root.ts              # records domain events, pullEvents()
│   ├── domain-error.ts                # DomainError: notFound / invalidInput / conflict / forbidden / unauthorized
│   ├── domain-event-publisher.ts      # the event port
│   └── interfaces/sharedKernelTypes.ts
│
├── contexts/
│   ├── architecture.spec.ts           # the dependency rule, tested (§7.1)
│   ├── spending/
│   │   ├── domain/                    # pure TypeScript — no Nest, no Prisma, no node:fs
│   │   │   ├── spending.ts            # Spending aggregate
│   │   │   ├── spending-group.ts      # SpendingGroup aggregate root
│   │   │   ├── group-label.ts         # "<group> — <detail>"
│   │   │   ├── spending-errors.ts     # GroupNotFound, GroupSpansSeveralDays…
│   │   │   ├── spending-events.ts     # SPENDING_EVENT, the published language
│   │   │   ├── ports/                 # driven ports, as abstract classes (see §8.3)
│   │   │   └── interfaces/spendingTypes.ts
│   │   ├── application/               # use cases: one class per user intention
│   │   ├── infrastructure/            # driven adapters: Prisma repositories, the category lookup,
│   │   │   ├── queries/               #   the read side (lists, search, suggestions)
│   │   │   └── testing/               #   in-memory fakes for unit tests
│   │   ├── interface/                 # driving adapters: controllers, DTOs
│   │   └── spending.module.ts         # composition root: port → adapter bindings
│   ├── receipt-reading/               # + ReleaseReceiptsHandler, subscribed to Spending's events
│   ├── price-comparison/
│   ├── budget-planning/
│   ├── analytics/                     # read side only: infrastructure/queries + pure domain functions
│   └── identity/                      # accounts, sign-in flow, throttle, sessions, guards
│
└── platform/                          # config, infrastructure (logging, HTTP error mapping, event bus,
                                       # backups), monitoring, prisma, redis
```

File names stay kebab-case, like the rest of nest-api (Nest convention). Exported types still go in
`interfaces/<name>Types.ts`, as everywhere in the repo.

### 7.1 The dependency rule, enforced twice

A rule nobody checks is a suggestion.

- **Biome** (PFA-272, PFA-297) rejects, under `domain/`: Nest, Prisma (`@db`, `@generated`, `@prisma`),
  Redis, `node:fs`, `sharp`, `tesseract.js`, the platform modules (field limits aside), and any outer layer;
  under `application/`: persistence and Redis, and any adapter.
- **`src/contexts/architecture.spec.ts`** (PFA-297) reads every import and checks the layers *and* the
  context boundaries: the domain is pure; persistence, files and OCR live in adapters only; a use case
  depends on domains only; the HTTP edge never reaches an adapter or another context's use case; a
  context crosses into another only through its domain, its HTTP edge, or an adapter. Two deliberate
  exceptions are listed in the test with their reason (the read-side query classes; multer's storage).
  It runs in `pnpm test`, so in the deploy's fast checks.

---

## 8. Worked example — the Spending context

The pilot (PFA-273). `SpendingGroupsService` today is ~200 lines that mix five concerns. Here is the
same behaviour split by the architecture.

### 8.1 Before (abridged, real code)

```ts
// spending-groups.service.ts — merge()
const rows = await this.prisma.spendings.findMany({ where: { userID, ID: { in: ids } }, … });
if (rows.length !== ids.length) throw new NotFoundException("Spending not found");   // HTTP in business code
const date = rows[0].date;
if (rows.some((row) => !isSameDay(row.date, date)))                                  // invariant #1, stated here only
  throw new BadRequestException("A group spans a single day");
const invoicefile = ordered.find((row) => row.invoicefile)?.invoicefile ?? null;     // invariant #2: one receipt
await this.prisma.$transaction([ … create group, update each line, delete emptied groups … ]);
await this.receiptFiles.release(userID, rows.map((row) => row.invoicefile));         // cross-feature side effect
```

### 8.2 After — the aggregate owns the rules

```ts
// contexts/spending/domain/spending-group.ts
export class SpendingGroup extends AggregateRoot {
  private constructor(private props: SpendingGroupProps) {
    super();
  }

  /** Existing same-day spendings become the lines of a new group; the first receipt wins. */
  static merge(input: MergeInput) {
    const [first] = input.spendings;
    if (input.spendings.some((s) => !s.date.isSameDay(first.date))) {
      throw new GroupSpansSeveralDays();
    }
    const receipt = input.spendings.find((s) => s.receipt)?.receipt ?? null;
    const group = new SpendingGroup({
      id: input.id,
      owner: input.owner,
      date: first.date,
      label: GroupLabel.of(input.label),
      currency: first.amount.currency,
      receipt,
      lines: input.spendings.map((s, i) => GroupLine.from(s, input.details[i])),
    });
    // Receipts dropped by the merge: Receipt reading decides if a file is still held.
    for (const dropped of input.spendings.map((s) => s.receipt).filter((r) => r && r !== receipt)) {
      group.record(new ReceiptDropped(input.owner, dropped));
    }
    return group;
  }

  addLine(line: NewLine) {
    // A line added while editing joins the group's date, currency and receipt — by construction.
    this.props.lines.push(GroupLine.create({ ...line, date: this.props.date, receipt: this.props.receipt }));
  }

  removeLine(lineId: SpendingId) { … this.record(new GroupLineRemoved(…)); }
  rename(label: string) { … every line's stored label is recomposed here, once … }
  ungroup() { … }
  total() { return Money.sum(this.props.lines.map((l) => l.amount)); }
}
```

What changed:

- Each invariant is written **once**, in the only object allowed to change a group.
- Errors are **domain errors** (`GroupSpansSeveralDays extends InvalidInput`), mapped to HTTP 400 by one
  global filter. The domain has no idea HTTP exists.
- The file side effect became an **event**. The aggregate states a fact; another context reacts.
- `Money` replaces `number`: summing lines is exact, currency mismatches are impossible to write.

### 8.3 The driven port

```ts
// contexts/spending/domain/ports/spending-group.repository.ts
export abstract class SpendingGroupRepository {
  abstract byId(id: SpendingGroupId, owner: UserId): Promise<SpendingGroup | null>;
  abstract spendingsOf(ids: SpendingId[], owner: UserId): Promise<Spending[]>;
  abstract save(group: SpendingGroup): Promise<void>;
  abstract delete(group: SpendingGroup): Promise<void>;
}
```

**Why an abstract class rather than an `interface`:** TypeScript interfaces vanish at compile time, so
NestJS cannot inject them without a string/symbol token and `@Inject(TOKEN)` everywhere. An abstract
class *is* a runtime value: it is the port, the type and the DI token at once — and it holds no code.
(It also keeps the repo's "no `export interface` outside `interfaces/`" rule happy, for the right reason.)

Ownership (`owner: UserId`) is part of the port's signature: every query is scoped to the user by
construction, exactly what `where: { userID }` does today — but impossible to forget.

### 8.4 The driven adapter

```ts
// contexts/spending/infrastructure/prisma-spending-group.repository.ts
@Injectable()
export class PrismaSpendingGroupRepository extends SpendingGroupRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async byId(id: SpendingGroupId, owner: UserId) {
    const row = await this.prisma.spendingGroups.findFirst({
      where: { ID: id.value, userID: owner.value },
      include: { spendings: true },
    });
    return row ? SpendingGroupMapper.toDomain(row) : null;
  }

  async save(group: SpendingGroup) {
    const { group: groupRow, lines, removedLineIds } = SpendingGroupMapper.toPersistence(group);
    await this.prisma.$transaction([ /* upsert group, upsert lines, delete removed lines */ ]);
  }
}
```

The **mapper** is where the persistence model and the domain model meet. The DB keeps its shape
(`label` stays the composed `"<group> — <detail>"` so stats and search keep working); the domain sees
`GroupLabel` and `detail` as separate concepts. Persistence model ≠ domain model is a feature: either can
change without dragging the other.

### 8.5 The use case (application layer)

```ts
// contexts/spending/application/merge-spendings-into-group.use-case.ts
@Injectable()
export class MergeSpendingsIntoGroup {
  constructor(
    private readonly groups: SpendingGroupRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(command: MergeSpendingsCommand) {
    const spendings = await this.groups.spendingsOf(command.spendingIds, command.owner);
    if (spendings.length !== command.spendingIds.length) throw new SpendingNotFound();

    const group = SpendingGroup.merge({ ...command, id: SpendingGroupId.new(), spendings });
    await this.groups.save(group);
    await this.events.publish(group.pullEvents());   // after commit
    return { id: group.id, receipt: group.receipt };
  }
}
```

Three lines of orchestration, zero business rule. That is what a use case should look like. One class per
user intention also makes the API surface readable: `ls application/` is the feature list.

### 8.6 The driving adapter

```ts
// contexts/spending/interface/spending-groups.controller.ts
@Post("merge")
merge(@Body() dto: MergeSpendingGroupDto, @CurrentUser() owner: UserId) {
  return this.mergeSpendings.execute(MergeSpendingsCommand.from(dto, owner));
}
```

DTO + `class-validator` stay here: **input validation** (shape, types, lengths) is an HTTP concern.
**Business validation** (same day, same currency) is a domain concern. Today both are mixed; after, each
lives in its layer.

### 8.7 Wiring

```ts
// contexts/spending/spending.module.ts
@Module({
  controllers: [SpendingGroupsController, SpendingsController],
  providers: [
    MergeSpendingsIntoGroup, CreateSpendingGroup, EditSpendingGroup, /* … */
    { provide: SpendingGroupRepository, useClass: PrismaSpendingGroupRepository },
    { provide: CategoryLookup, useClass: BudgetPlanningCategoryLookup },
  ],
})
export class SpendingModule {}
```

The module is the **composition root** of the context: the only place that knows which adapter plugs into
which port. Tests swap one line.

### 8.8 The test it unlocks

```ts
it("refuses to merge spendings from two different days", () => {
  const monday = aSpending({ date: "2026-11-16" });
  const tuesday = aSpending({ date: "2026-11-17" });
  expect(() => SpendingGroup.merge({ …, spendings: [monday, tuesday] })).toThrow(GroupSpansSeveralDays);
});
```

No DB, no Nest, no Redis: milliseconds. Today the same rule is only covered by an e2e test hitting MySQL.

---

## 9. The other contexts, briefly

### 9.1 Receipt reading (PFA-274)

- **Ports**: `ReceiptTextReader` (`read(receipt) → string[][]`), `ReceiptFileStore`
  (`keep`, `open`, `release`, `check`), `ReceiptHolders` (which rows hold which file),
  `ReceiptLinesRepository`, `QueuedReceiptRepository`, and `StoreDirectory` / `ProductTypeCatalog` towards
  price comparison.
- **Adapters**: `TesseractReceiptTextReader` = today's `ReceiptOcrService` (worker, queue, idle shutdown —
  all *infrastructure* concerns, rightly outside the domain); `LocalReceiptFileStore` + SSH backup.
- **Domain**: `receipt-text-parser.ts` is already pure — it moves as-is. `QueuedReceipt` (an entry of the
  bulk read; "proposal" already names what the OCR proposes) becomes an aggregate whose **state machine** (`queued → ready | failed`, then `skipped`) is enforced by methods
  (`markReady`, `markFailed`, `skip`) instead of strings written by a service.
- Reacts to `SpendingDeleted`, `GroupLineRemoved`, `ReceiptDropped`: releases a file when nobody holds it.

This is the clearest hexagonal win: swapping Tesseract for a cloud OCR is one new adapter class.

### 9.2 Price comparison (PFA-275)

- Already the most "DDD-ready" code: `unit-price.ts` is pure functions over value-like data.
- **Value objects**: `UnitPrice` (price + basis), `Size` (value + unit, converts to its basis),
  `NameKey` (upper-cased, accents and punctuation dropped — today a helper, tomorrow a type that cannot
  be built un-normalised).
- **Entities**: `Store` (identity = user + name key + address key), `ProductType`.
- **Domain service**: `compareStores()` — ranks per basis, never compares kg with pieces.

### 9.3 Budget planning (PFA-276)

- `Category`: global (`userID` null) or user-owned; **accessibility** rule; implicit creation from a typed
  name + colour, reusing an existing name — and no standalone creation endpoint, by design.
  The duplicated logic of §2 collapses into `Category.resolveFor(owner, input)`.
- `RecurringCharge`: stored one row per month, copied forward — the domain names this explicitly.
- `ExceptionalExpense`: holds a **category snapshot** value object, not a reference — a deliberate
  model difference from Spending (see §3.1).
- `MonthlyBudget`: the `Dashboards` row (initial amount, ceiling) gets its real name.

### 9.4 Analytics — the read side (PFA-277)

**CQRS** (Command Query Responsibility Segregation) in its lightweight form: writes go through
aggregates; reads go straight to the data, shaped for the screen.

- One **query handler** per screen: `GetYearlyStats`, `GetDailyProjection`, `GetCategoryTrends`,
  `GetSearchTimeline`…
- They read Prisma (or raw SQL) through a read-model port and return DTOs. No aggregate, no repository.
- The **pure calculations** inside them — the projection chain N-1 → N-2 → M-1 → none, week ranges
  truncated to the month, rounding — move to `domain/` functions with unit tests.

Why not aggregates here: loading a year of `Spending` aggregates to sum them would be slow and pointless.
Knowing **when not to apply** a pattern is the senior part — and a good interview answer.

### 9.5 Identity and access (PFA-279)

Generic subdomain → thin model. `User` entity (the synthetic flag is set only at signup; only a synthetic
account can be disabled), ports `PasswordHasher` (bcrypt) and `SessionStore` (Redis). Every other
context receives a `UserId` from a `@CurrentUser()` decorator and never sees more.

---

## 10. Cross-cutting design

### 10.1 Shared kernel (PFA-272)

Small on purpose — everything in it is a dependency of every context.

- **`Money`** — integer cents + currency. `add`, `subtract`, `sum`, `isNegative`, `equals`. Built from
  Prisma's `Decimal` in mappers, serialised to a number only at the HTTP edge. Ends float drift.
  PFA is EUR-only today; `Money` carries the currency anyway so multi-currency is a later *feature*, not
  a rewrite.
- **`CalendarDay` / `CalendarMonth`** — a `@db.Date` day read in UTC, and UTC-safe month arithmetic
  (today repeated as `Date.UTC(year, month + 1, 0)` in several services).
- **Typed IDs** (`UserId`, `SpendingId`…) were planned and **not built**: they meant casting at every
  controller for little gain. Ownership is still in every port's signature, as `ownerId: string`.
- **`AggregateRoot`** — `record(event)`, `pullEvents()`.
- **`DomainError`** with kinds `notFound`, `invalidInput`, `conflict`, `forbidden`; one global filter maps
  them to 404 / 400 / 409 / 403. Extends the existing `AllExceptionsFilter`, so logs keep their trace id.
  An error may carry `details`, sent beside `message` — how a 409 keeps its `{ message, conflictID }` body.

### 10.2 Transactions

Rule: **one use case = one transaction = one aggregate**. The repository's `save()` is atomic on its own
(Prisma `$transaction`). When a use case truly needs two writes in one transaction, a `UnitOfWork` port
(implemented with Prisma's interactive transaction carried in `AsyncLocalStorage`) wraps the use case,
and repositories pick up the current transaction client transparently. Needing it often is a smell: the
aggregate boundary is probably wrong.

### 10.3 Domain events (PFA-278)

- Aggregates **record** events; use cases **publish** them **after** the save commits.
- Bus: the `DomainEventPublisher` port (shared kernel) and its `InProcessEventBus` adapter
  (`platform/infrastructure/events`). A context subscribes at start-up (`SpendingEventSubscriptions` in
  receipt reading). Handlers are awaited: the request answers once every reaction is done, and a failing
  handler fails it, as the direct call it replaced did. One process, one DB — no broker needed.
- Handlers are idempotent (releasing an already-released file is a no-op).
- Upgrade path, documented not built: if a second process (bots, a worker) ever needs the events,
  switch to a **transactional outbox** — events written in the same transaction as the aggregate, relayed
  afterwards. Same port, new adapter.

### 10.4 Testing strategy

| Layer | Test | Speed | What it proves |
| --- | --- | --- | --- |
| Domain | Unit, plain Jest | ms | Invariants, calculations, state machines |
| Application | Unit with in-memory repositories + fake publisher | ms | Orchestration, events emitted, not-found paths |
| Infrastructure | Integration against MySQL (existing e2e DB) | s | Mappers round-trip, queries scoped by user |
| Interface | The existing e2e suite, unchanged | s | **The HTTP contract did not move** |

The current e2e suite is the migration's safety net: it must stay green, untouched, at every step.

---

## 11. Migration plan — strangler, context by context

Status: ✅ shipped (merged and deployed), ⏳ to do.

1. ✅ **PFA-271 — this doc.**
2. ✅ **PFA-272 — Foundations.** Shared kernel, `contexts/` skeleton, lint rule, error filter. No behaviour change.
3. ✅ **PFA-273 — Spending pilot.** The richest rules, the best showcase. Old service methods are replaced one
   by one by use cases; the controller switches its calls; the service file disappears last.
4. ✅ **PFA-274 — Receipt reading.** OCR and file storage behind ports.
5. ✅ **PFA-275 — Price comparison.** Mostly moving already-pure code into value objects.
6. ✅ **PFA-276 — Budget planning.** Category logic de-duplicated.
7. ✅ **PFA-277 — Analytics read side.** Query handlers + pure calculation functions.
8. ✅ **PFA-278 — Domain events.** Direct cross-context calls replaced by events.
9. ✅ **PFA-279 — Identity and access.** Last: generic, stable, least to gain.
10. ✅ **PFA-296 — Identity edges.** Sign-in throttle and session tracking behind ports.
11. ✅ **PFA-297 — Architecture fitness tests.** The dependency rule, tested.
12. ✅ **PFA-298 — Platform folder.** `src/` = contexts, shared kernel, platform.
13. ✅ **PFA-299 — This doc and the README, as built.**

Constraints that hold at every step:

- **HTTP contract frozen** — same routes, same payloads; the front does not change.
- **Database schema frozen** — the refactor is in code only; mappers absorb the gap. (Prod migrations are
  manual on ks-b; none is needed here.)
- **Deploy path unchanged** — same build, same PM2 app.
- One ticket = one branch = one PR, each shippable on its own.

### 11.1 Where the code differs from the map

- **Examples in §8 are condensed.** Signatures in the code take `ownerId: string` (no typed IDs, §10.1)
  and one object past three parameters; the group repository has `save`, `remove` and `dissolve`.
- **Commands across contexts became events; queries stayed ports.** Releasing receipt files is an
  event (PFA-278). Checking a category, recognising a store, linking product types need an answer now:
  those stay synchronous ports with an adapter over the other context (an anti-corruption layer).
- **The invoice image routes moved to receipt reading** (`InvoiceImagesController`, same URLs), and its
  module is registered before Spending's so `DELETE /spendings/upload` is never read as `/spendings/:id`.
- **`ReceiptAttached` was dropped**: the bulk read's candidates are a query over the rows, already the
  source of truth; an event would only duplicate it.
- **Thin where the subdomain is thin.** Budget planning and price comparison keep their rules as pure
  domain functions and value objects (`CatalogName`, `storeKeys`, `carriedForward`, `budgetRevision`)
  around repository ports — no aggregate where there is no invariant to guard.
- **Analytics is query classes in `infrastructure/queries/`**, with no application layer between the
  controller and the read: the projection chain and the day buckets are its domain.
- **Two path aliases for new code**, `@db/*` and `@generated/*`, so nothing imports Prisma by a relative
  path. `synthetic:purge` runs with `tsconfig-paths` for the same reason.
- **Identity's domain errors include `unauthorized`**, so a refused sign-in keeps its 401.

---

## 12. Trade-offs — honest version

| Cost | Answer |
| --- | --- |
| More files and indirection (port + adapter + mapper + use case) | Paid where rules live (Spending, Receipt reading). Analytics and Identity stay thin on purpose. |
| Mappers duplicate shapes | That duplication is the decoupling. Keep mappers dumb and tested by round-trip. |
| Loading whole aggregates can be heavier than targeted `updateMany` | Groups are small (a receipt's lines). For bulk operations, a dedicated repository method is fine as long as it does not bypass a rule. |
| Learning curve | This document. |
| "Overkill for a personal finance app" | PFA has ~9k lines of API, OCR, a bulk-read pipeline, price comparison and bots using it daily. It is past the size where structure pays — and it is a portfolio piece meant to show exactly this. |

When **not** to do DDD: CRUD with no rules, a prototype, a read-only reporting service. Saying this
out loud is part of doing it well.

---

## 13. Interview talking points

**The pitch (30 seconds).** "My personal-finance API is NestJS + Prisma + Redis, in production with
synthetic users running daily against it. As it grew — receipt OCR, grouped receipts, price comparison —
the business rules were spread across services that also did persistence and HTTP. I restructured it with
DDD and a hexagonal architecture: six bounded contexts, aggregates that own their invariants, ports and
adapters so the domain is pure TypeScript, CQRS-style read models for the stats, and domain events
between contexts. Migration was a strangler, context by context, with the e2e suite as the contract."

**Questions you will get, and short answers:**

- *DDD vs hexagonal vs clean architecture?* — DDD is a modelling approach (what the domain is);
  hexagonal/clean/onion are structural approaches (dependencies point inward). Hexagonal names the two
  sides (driving/driven) explicitly; clean adds concentric layers. Same core idea: dependency inversion.
- *What is an aggregate, and how do you size it?* — A consistency boundary changed in one transaction
  through its root. Size it by the invariants that must hold *immediately*; everything else is eventual,
  via events. Small aggregates by default. `SpendingGroup` owns its lines because "same day, same receipt"
  must always hold; `Category` is outside because a spending only needs its ID.
- *Entity vs value object?* — Identity vs equality by value. `Money`, `UnitPrice`, `NameKey` are VOs:
  immutable, self-validating, replace primitives.
- *Where does validation go?* — Shape/format at the edge (DTO + class-validator); business rules in the
  domain; DB constraints as the last net (unique store per name + address).
- *Repository per table?* — No, per aggregate. `SpendingGroupRepository` saves the group *and* its lines.
- *How do you handle transactions across aggregates?* — You avoid them: one aggregate per transaction,
  domain events for the rest, outbox if delivery must be guaranteed across processes.
- *Why abstract classes for ports in NestJS?* — Interfaces are erased at runtime; an abstract class is the
  type and the DI token at once.
- *Isn't CQRS overkill?* — Full CQRS with separate stores, yes. Lightweight CQRS — aggregates for writes,
  direct queries for reads — is just honest: a heatmap doesn't need an aggregate.
- *How did you migrate without breaking production?* — Strangler, one context per PR, HTTP contract and
  DB schema frozen, e2e suite unchanged as the contract, lint rule enforcing the dependency direction.
- *When would you not use DDD?* — Simple CRUD, short-lived prototypes, pure reporting. Strategic DDD
  (contexts, language) is almost always useful; tactical DDD (aggregates…) only where rules live.

**Vocabulary to use naturally:** bounded context, ubiquitous language, aggregate root, invariant,
value object, repository, domain event, anti-corruption layer, ports & adapters, driving/driven,
dependency inversion, composition root, CQRS, transactional outbox, strangler fig.

---

## 14. Further reading

- Eric Evans — *Domain-Driven Design* (2003), the "blue book". Part IV (strategic design) is the most
  underrated part.
- Vaughn Vernon — *Implementing Domain-Driven Design* (2013), and *DDD Distilled* (short, start here).
- Alistair Cockburn — "Hexagonal Architecture" (2005), the original article.
- Vladik Khononov — *Learning Domain-Driven Design* (2021), the most modern and practical introduction.
- Martin Fowler — bliki entries *BoundedContext*, *CQRS*, *StranglerFigApplication*.
