"use client";

import { useAuth } from "@auth/context/AuthContext";
import CategoryFormModal from "@components/categories/CategoryFormModal";
import CategoryItem from "@components/categories/CategoryItem";
import useCategoryStats from "@components/categories/services/useCategoryStats";
import Spinner from "@components/common/Spinner";
import useCategories from "@components/spendings/services/useCategories";
import { Button } from "@components/ui/button";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Category } from "@src/schemas/categories";

const isMock = (id: string) => id.startsWith("mock-");

const CategoriesListcontainer = () => {
  const { categories, error, updateCategory, deleteCategory } = useCategories();
  const { categoryStats, error: statsError } = useCategoryStats();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  // MOCK — standalone creation isn't persisted (no POST /categories). New
  // categories live here locally until a create endpoint exists.
  const [localCats, setLocalCats] = useState<Category[]>([]);

  const allCats = useMemo<Category[]>(() => [...(categories ?? []), ...localCats], [categories, localCats]);

  // Real all-time usage per category, keyed by category ID.
  const statsByCategory = new Map((categoryStats?.byCategory ?? []).map((s) => [s.categoryID, s]));
  // Denominator for each category's share: total spent over all history
  // (includes uncategorized spendings), as returned by the backend.
  const grandTotal = categoryStats?.totalSpent ?? 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...allCats]
      .sort((a, b) => a.name.localeCompare(b.name, "fr"))
      .filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [allCats, query]);

  if (error) {
    throw error;
  }

  if (statsError) {
    throw statsError;
  }

  const handleSave = (cat: Category, name: string, color: string) => {
    if (isMock(cat.ID)) {
      setLocalCats((prev) => prev.map((c) => (c.ID === cat.ID ? { ...c, name, color } : c)));
      return;
    }
    updateCategory.mutate({
      singleCategory: { ID: cat.ID, userID: cat.userID, name, color },
    });
  };

  const handleDelete = (cat: Category) => {
    if (isMock(cat.ID)) {
      setLocalCats((prev) => prev.filter((c) => c.ID !== cat.ID));
      return;
    }
    deleteCategory.mutate({ categoryID: cat.ID });
  };

  const handleCreate = (name: string, color: string) => {
    // MOCK — local only, not sent to the API.
    setLocalCats((prev) => [...prev, { ID: `mock-${Date.now()}`, userID: user?.id ?? null, name, color }]);
    toast.info("Catégorie créée en local (mock — non enregistrée)");
  };

  const isLoading = (!categories || !categoryStats) && localCats.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">Catégories</h1>
        <span className="num rounded-full border border-line-soft bg-surface-elev px-2.5 py-[3px] text-[12px] text-ink-3">
          {allCats.length}
        </span>

        <span className="hidden flex-1 sm:block" />

        <div className="relative order-10 w-full sm:order-none sm:w-[260px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une catégorie…"
            className="w-full rounded-[6px] border border-line bg-surface-elev py-2 pl-8 pr-2.5 text-[13px] text-ink outline-none transition placeholder:text-ink-4 focus:border-accent-d"
          />
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setCreateOpen(true)}
        >
          <Plus
            className="size-3.5"
            strokeWidth={2.5}
          />
          Nouvelle catégorie
        </Button>
      </div>

      <p className="text-[12.5px] text-ink-4">
        Gérer tes catégories · part et fréquence <b className="font-medium text-ink-3">sur tout l&apos;historique</b>
      </p>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : visible.length === 0 ? (
        <p className="py-6 text-[13px] text-ink-4">Aucune catégorie ne correspond.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(238px,1fr))] gap-3">
          {visible.map((cat) => {
            const stat = statsByCategory.get(cat.ID);
            const used = stat?.count ?? 0;
            const share = grandTotal > 0 ? ((stat?.total ?? 0) / grandTotal) * 100 : 0;
            const takenNames = allCats.filter((c) => c.ID !== cat.ID).map((c) => c.name.toLowerCase());
            return (
              <CategoryItem
                key={cat.ID}
                category={cat}
                used={used}
                share={share}
                takenNames={takenNames}
                onSave={(name, color) => handleSave(cat, name, color)}
                onDelete={() => handleDelete(cat)}
              />
            );
          })}
        </div>
      )}

      <CategoryFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        takenNames={allCats.map((c) => c.name.toLowerCase())}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default CategoriesListcontainer;
