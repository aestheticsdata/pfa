"use client";

import CatalogList from "@components/prices/catalog/CatalogList";
import { CATALOG_KIND } from "@components/prices/config/constants";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import useTranslations from "@i18n/useTranslations";

interface CatalogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The user's stores and product types, to rename, merge and delete (PFA-224). */
const CatalogDialog = ({ open, onOpenChange }: CatalogDialogProps) => {
  const { catalog: t } = useTranslations("prices");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        data-testid="catalog-dialog"
        className="max-h-[92vh] gap-4 overflow-y-auto border-line bg-surface-elev sm:max-w-2xl"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight text-ink">{t.title}</DialogTitle>
          <DialogDescription className="text-sm text-ink-3">{t.description}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={CATALOG_KIND.stores}>
          <TabsList>
            <TabsTrigger value={CATALOG_KIND.stores}>{t.tabs.stores}</TabsTrigger>
            <TabsTrigger value={CATALOG_KIND.productTypes}>{t.tabs.productTypes}</TabsTrigger>
          </TabsList>
          <TabsContent value={CATALOG_KIND.stores}>
            <CatalogList kind={CATALOG_KIND.stores} />
          </TabsContent>
          <TabsContent value={CATALOG_KIND.productTypes}>
            <CatalogList kind={CATALOG_KIND.productTypes} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CatalogDialog;
