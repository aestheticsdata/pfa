// Exact edit glyph from the Dashboard 2026.html mockup (`.editable` affordance).
// Uses currentColor so callers control colour (e.g. green on hover).

interface EditGlyphProps {
  className?: string;
}

const EditGlyph = ({ className }: EditGlyphProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
    className={className}
  >
    <path d="M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);

export default EditGlyph;
