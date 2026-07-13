const adjustFontColor = (categoryColor: string) => {
  if (!categoryColor) return "#111111";
  const c = categoryColor.substring(1);
  const rgb = parseInt(c, 16);
  const [r, g, b] = [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, (rgb >> 0) & 0xff];
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  return luma < 140 ? "#ffffff" : "#111111";
};

export default adjustFontColor;
