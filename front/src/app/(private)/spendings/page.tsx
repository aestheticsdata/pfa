import Spendings from "@components/spendings/Spendings";

// "Today" for the weekly Spendings view is resolved in the browser
// (Spendings), never here: the server's timezone can differ from the
// user's and would otherwise bake the wrong day into ?date= (COS-73). The
// client reads/writes the ?date= param, so this page just renders it.
export default function SpendingsPage() {
  return <Spendings />;
}
