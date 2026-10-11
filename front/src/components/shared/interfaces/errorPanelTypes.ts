export interface ErrorPanelProps {
  error: Error & { digest?: string };
  retry: () => void;
}
