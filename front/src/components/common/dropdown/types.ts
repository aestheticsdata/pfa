import { ReactElement } from "react";

export interface Dropdown {
  children: [ReactElement, ReactElement<{ handleclosefromchild?: () => void }>];
  displayCaret?: boolean;
}
