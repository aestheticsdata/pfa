const reSanitizer = /[a-zA-Z@%*/_]*/g;

// see https://stackoverflow.com/questions/69105871/regex-for-simple-arithmetic-expression
const arithmeticRegex = /^\d+(?:\.\d+)?(?:[-+]\d+(?:\.\d+)?)*$/;
export const validateMathExpr = (expr: string) => (expr.match(arithmeticRegex) || []).join("");

// filter extra characters with regex
export const sanitizeMathExpr = (expr: string): string => validateMathExpr(expr.replace(reSanitizer, ""));

// see https://www.npmjs.com/package/round-tofixed ////
export const accurateFixed = (x: number, digits: number) => {
  return +`${Math.round(+`${x}e${digits}`)}e-${digits}`;
};
// ////////////////////////////////////////////////////

export const applyMinus = (s: string): number => {
  if (s.indexOf("-") === -1) return +s;
  const result = s.split("-").reduce((acc, curr, idx) => {
    if (idx === 0) return +curr;
    return acc - +curr;
  }, 0);
  return accurateFixed(result, 2);
};

const mathExprEval = (expr: string): number =>
  expr
    .split("+")
    .map((s) => applyMinus(s))
    .reduce((acc, curr) => acc + +curr, 0);

const toFixedEval = (expr: string): number => accurateFixed(mathExprEval(sanitizeMathExpr(expr)), 2);

export default toFixedEval;
