/** A category as GET /categories returns it (PFA-257). */
export interface CategoryItem {
  ID: string;
  userID: string | null;
  name: string;
  color: string;
}
