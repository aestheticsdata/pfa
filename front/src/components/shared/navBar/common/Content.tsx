import React from "react";

interface ContentProps {
  handleclosefromchild?: Function;
  content: React.ReactNode;
}

const Content = ({ handleclosefromchild, content }: ContentProps) => {
  return (
    <div className="absolute top-12">
      <div
        onClick={() => { handleclosefromchild && handleclosefromchild() }}
        role="menu"
        className="flex flex-col items-end bg-grey2 p-1.5 rounded-sm shadow-login shadow-grey2"
      >
        <ul className="flex flex-col">{ content }</ul>
      </div>
    </div>
  )
};

export default Content;
