/** What a platform tab bar needs: which tab is active, how to switch, and the « + » action. */
export interface TabBarProps {
  activeRoute: string;
  onSelect: (routeName: string) => void;
  onAdd: () => void;
}
