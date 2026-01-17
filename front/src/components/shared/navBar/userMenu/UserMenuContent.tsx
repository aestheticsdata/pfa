import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Content from '@components/shared/navBar/common/Content';

import type { IconProp } from "@fortawesome/fontawesome-svg-core";

interface ListItemMenu {
  id: string;
  label: string;
  icon: IconProp;
  callback: Function
}

  interface UserMenuContentProps {
  handleclosefromchild?: Function;
  listItems: ListItemMenu[];
}

const UserMenuContent = ({ handleclosefromchild, listItems }: UserMenuContentProps) => {
  const content = listItems && listItems.map(item => (
    <li
      key={item.id}
      onClick={() => item.callback && item.callback()}
      className="hover:bg-grey0 hover:rounded-sm p-1 text-menuItem hover:text-blueNavy"
    >
      <div className="flex items-center space-x-2">
        <div>
        <FontAwesomeIcon
          className="icon"
          icon={item.icon}
        />
        </div>
        <div>
          {item.label}
        </div>
      </div>
    </li>
  ));

  return (
    <Content
      handleclosefromchild={handleclosefromchild}
      content={content}
    />
  )
};

export default UserMenuContent;
