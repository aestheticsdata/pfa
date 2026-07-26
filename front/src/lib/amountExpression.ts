import Mexp from "math-expression-evaluator";

// The amount fields of the spending and exceptional modals accept an arithmetic
// expression, not just a number ("12.50 + 3*2"), so the user can add up a
// receipt in place. Both modals used to carry their own copy of the same
// lex → toPostfix → postfixEval dance (COS-107).

/**
 * Evaluates a user-typed amount expression, returning `null` when it is not a
 * usable number — either the expression failed to parse or it evaluated to NaN.
 * Callers treat `null` as "abort the submit".
 */
const evaluateAmountExpression = (input: string): number | null => {
  let result: number;
  try {
    const mexp = new Mexp();
    const lexed = mexp.lex(input.trim());
    const postfixed = mexp.toPostfix(lexed);
    result = mexp.postfixEval(postfixed);
  } catch (error) {
    console.error("Invalid amount expression", error);
    return null;
  }

  return Number.isNaN(result) ? null : result;
};

export default evaluateAmountExpression;
