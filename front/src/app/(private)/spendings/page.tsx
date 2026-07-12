import SpendingPageClient from "@components/spendings/view/SpendingPageClient";

// "Today" for the weekly Dépenses view is resolved in the browser
// (SpendingPageClient), never here: the server's timezone can differ from the
// user's and would otherwise bake the wrong day into ?date= (COS-73). The
// client reads/writes the ?date= param, so this page just renders it.
export default function SpendingsPage() {
  return <SpendingPageClient />;
}
