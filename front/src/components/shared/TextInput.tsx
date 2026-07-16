import { Input } from "@components/ui/input";
import { cn } from "@lib/utils";

/** The app's field-input treatment, baked onto the shadcn `Input`. */
const FIELD_INPUT =
  "border-line bg-surface-base text-ink placeholder:text-ink-5 focus-visible:border-accent-d focus-visible:ring-0";

/** Text input styled for the app's forms. Extra classes (e.g. `num`) merge on top. */
function TextInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn(FIELD_INPUT, className)}
      {...props}
    />
  );
}

export { TextInput };
