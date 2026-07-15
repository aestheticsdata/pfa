import { CategoryComponent } from "pfa-next";

/** The 12 palette hues — oklch(0.80 0.09 <hue>) as the hex the backend stores. */
const ALIMENTATION = "#9fcc95";
const TRANSPORT = "#72cede";
const LOYER = "#bcb4f4";
const COURSES = "#c1c37e";
const PHARMACIE = "#f0a6b6";
const LOISIRS = "#d8abe2";

export const Default = () => (
  <CategoryComponent
    item={{ category: "Alimentation", categoryColor: ALIMENTATION }}
    customCss="w-24 py-0.5 pl-2"
  />
);

export const Dynamic = () => (
  <CategoryComponent
    item={{ category: "Alimentation", categoryColor: ALIMENTATION }}
    isDynamic
    customCss="w-24 py-0.5"
  />
);

export const Palette = () => (
  <div className="flex flex-col gap-1.5">
    <CategoryComponent
      item={{ category: "Alimentation", categoryColor: ALIMENTATION }}
      customCss="w-24 py-0.5 pl-2"
    />
    <CategoryComponent
      item={{ category: "Transport", categoryColor: TRANSPORT }}
      customCss="w-24 py-0.5 pl-2"
    />
    <CategoryComponent
      item={{ category: "Loyer", categoryColor: LOYER }}
      customCss="w-24 py-0.5 pl-2"
    />
    <CategoryComponent
      item={{ category: "Courses", categoryColor: COURSES }}
      customCss="w-24 py-0.5 pl-2"
    />
    <CategoryComponent
      item={{ category: "Pharmacie", categoryColor: PHARMACIE }}
      customCss="w-24 py-0.5 pl-2"
    />
  </div>
);

export const DynamicPalette = () => (
  <div className="flex flex-wrap gap-1.5">
    <CategoryComponent
      item={{ category: "Alimentation", categoryColor: ALIMENTATION }}
      isDynamic
      customCss="px-2 py-0.5"
    />
    <CategoryComponent
      item={{ category: "Transport", categoryColor: TRANSPORT }}
      isDynamic
      customCss="px-2 py-0.5"
    />
    <CategoryComponent
      item={{ category: "Loyer", categoryColor: LOYER }}
      isDynamic
      customCss="px-2 py-0.5"
    />
    <CategoryComponent
      item={{ category: "Loisirs", categoryColor: LOISIRS }}
      isDynamic
      customCss="px-2 py-0.5"
    />
    {/* Legacy dark colour from the backend — the label flips to white. */}
    <CategoryComponent
      item={{ category: "Abonnements", categoryColor: "#2f4858" }}
      isDynamic
      customCss="px-2 py-0.5"
    />
  </div>
);

export const NoCategory = () => (
  <div className="flex flex-col items-start gap-1.5">
    <CategoryComponent
      item={{ category: null, categoryColor: null }}
      customCss="w-fit py-0.5 pl-2 pr-2"
    />
    <CategoryComponent
      item={{ category: null, categoryColor: null }}
      isDynamic
      customCss="w-fit py-0.5 px-2"
    />
  </div>
);
