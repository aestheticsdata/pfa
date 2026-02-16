# Migration ESM (pour plus tard)

Actuellement, le projet utilise **CommonJS** (`moduleFormat: "cjs"` dans Prisma) car c’est la config la plus stable avec Nest + Prisma 7.

## Pourquoi CJS pour l’instant ?

- **Prisma 7** : avec une sortie personnalisée (`output`), le client généré en ESM contient `import.meta`, ce qui provoque des conflits quand Nest compile en CJS.
- **Nest** : par défaut, Nest compile en CommonJS. Une migration ESM demande plusieurs changements.

## Étapes pour migrer vers ESM

### 1. `package.json`
```json
"type": "module"
```

### 2. Prisma (`prisma/schema.prisma`)
```prisma
generator client {
  provider        = "prisma-client"
  output          = "../generated/prisma"
  moduleFormat    = "esm"
  importFileExtension = ""
}
```

### 3. Imports avec extensions `.js`
Avec `moduleResolution: "nodenext"`, les imports relatifs doivent inclure l’extension :
```ts
import { AppController } from "./app.controller.js";
import { PrismaClient } from "../../generated/prisma/client.js";
```

### 4. Path aliases (`@config`, `@users`, etc.)
Node ne gère pas les path aliases en ESM. Options :
- Remplacer par des imports relatifs
- Ou utiliser un loader : `node --loader tsconfig-paths/loader dist/main.js`

### 5. Nest et ESM
- Nest 11 supporte ESM avec `module: "nodenext"` dans `tsconfig`
- Vérifier que `nest build` produit bien du code ESM

### Références
- [NestJS ESM (GitHub #15331)](https://github.com/nestjs/nest/issues/15331)
- [Prisma 7 ESM](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
