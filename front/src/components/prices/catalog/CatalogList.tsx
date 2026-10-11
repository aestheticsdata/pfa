import Spinner from "@components/common/Spinner";
import CatalogRow from "@components/prices/catalog/CatalogRow";
import useCatalog from "@components/prices/services/useCatalog";
import { EmptyState } from "@components/shared/EmptyState";
import useTranslations from "@i18n/useTranslations";

import type { CatalogKind } from "@components/prices/interfaces/catalogTypes";

interface CatalogListProps {
  kind: CatalogKind;
}

/** One tab of the dialog: the stores, or the product types (PFA-224). */
const CatalogList = ({ kind }: CatalogListProps) => {
  const { catalog: t } = useTranslations("prices");
  const { entries } = useCatalog(kind);

  if (entries.isPending) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (!entries.data?.length) return <EmptyState className="py-10">{t.empty[kind]}</EmptyState>;

  return (
    <ul className="flex flex-col divide-y divide-line-soft">
      {entries.data.map((entry) => (
        <CatalogRow
          key={entry.ID}
          kind={kind}
          entry={entry}
          entries={entries.data}
        />
      ))}
    </ul>
  );
};

export default CatalogList;
