// https://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
// https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color

const adjustFontColor = (categoryColor) => {
  categoryColor === "#fff" && (categoryColor = "#ffffff");
  const c = categoryColor.substring(1);
  const rgb = parseInt(c, 16);
  const [r, g, b] = [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, (rgb >> 0) & 0xff];
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  return luma < 140 ? "#ffffff" : "#111111";
};

export default adjustFontColor;
