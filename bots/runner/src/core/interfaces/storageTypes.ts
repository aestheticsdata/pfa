export interface JsonFile {
  path: string;
  /** Unix mode of the file; defaults to 0600 — everything the runner keeps is its own business. */
  mode?: number;
}
