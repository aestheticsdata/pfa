import { cloneElement, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleUp, faAngleDown} from '@fortawesome/free-solid-svg-icons';
import useOnClickOutside from "use-onclickoutside";

import type { Dropdown } from "./types";


const DropDown = ({ children, displayCaret = true }: Dropdown) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => { setIsOpen(!isOpen) };

  const handleClickOutside = () => { setIsOpen(false) };
  useOnClickOutside(ref as any, handleClickOutside);

  const close = () => { setIsOpen(false) };

  return (
    <div ref={ref}>
      <div
        onClick={toggleDropdown}
        className="flex flex-col items-end"
      >
        <div className="flex flex-row items-center justify-center space-x-2">
          {displayCaret &&
            (isOpen ?
              <FontAwesomeIcon
                className="icon"
                icon={faAngleUp}
              />
              :
              <FontAwesomeIcon
                className="icon"
                icon={faAngleDown}
              />
            )
          }
          { children[0] }
        </div>
        {isOpen ?
          cloneElement(children[1], { handleclosefromchild: () => close()})
          :
          null
        }
      </div>
      <div></div>
    </div>
  )
}

export default DropDown;
