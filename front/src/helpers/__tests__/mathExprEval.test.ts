import toFixedEval, {
  accurateFixed,
  validateMathExpr,
  sanitizeMathExpr,
  applyMinus,
} from '@helpers/mathExprEval';

describe('accurateFixed', () => {
  it('should return the correct rounding', () => {
    expect(accurateFixed(12.39525, 2)).toEqual(12.4);
  });
});

describe('toFixedEval', () => {
  it('3 should be evaluated to 3', () => {
    expect(toFixedEval('3')).toEqual(3);
  });

  it('4.82 should be evaluated to 4.82', () => {
    expect(toFixedEval('4.82')).toEqual(4.82);
  });

  it('12+5 should be evaluated to 17', () => {
    expect(toFixedEval('12+5')).toEqual(17);
  });

  it('12-5 should be evaluated to 7', () => {
    expect(toFixedEval('12-5')).toEqual(7);
  });

  it('12+5-4.23-1.98+6 should be evaluated to 28.79', () => {
    expect(toFixedEval('24+5-4.23-1.98+6')).toEqual(28.79);
  });

  it('5.6-1.2+38-2.13 should be evaluated to 40.27', () => {
    expect(toFixedEval('5.6-1.2+38-2.13')).toEqual(40.27);
  });

  it('abcd should return 0', () => {
    expect(toFixedEval('abcd')).toEqual(0);
  });

  it('1abc+2 should return 3', () => {
    expect(toFixedEval('1abc+2')).toEqual(3);
  });

  it('10-2- should return 0', () => {
    expect(toFixedEval('10-2-')).toEqual(0);
  });

  it('-10 should heturn 0', () => {
    expect(toFixedEval('-10')).toEqual(0);
  });

  it('10+ should heturn 0', () => {
    expect(toFixedEval('10+')).toEqual(0);
  });
});

describe('validateMathExpr', () => {
  it('5.6-1.2+38-2.13 should be a valid math expression', () => {
    expect(validateMathExpr('5.6-1.2+38-2.13')).toEqual('5.6-1.2+38-2.13');
  });
  it('1abc+3 should not be a valid math expression', () => {
    expect(validateMathExpr('1abc+3')).toEqual('');
  });
  it('10-2- should return an empty string', () => {
    expect(validateMathExpr('10-2-')).toEqual('');
  });
  it('-10 should return an empty string', () => {
    expect(validateMathExpr('-10')).toEqual('');
  });
  it('10+ should return an empty string', () => {
    expect(validateMathExpr('10+')).toEqual('');
  });
});

describe('sanitizeMathExpr', () => {
  it('1abc+3 should be sanitized to 1+3', () => {
    expect(sanitizeMathExpr('1abc+3')).toEqual('1+3');
  });
  it('1@+_/*3%-2.05 should be sanitized to 1+3-2.05', () => {
    expect(sanitizeMathExpr('1@+_/*3%-2.05')).toEqual('1+3-2.05');
  });
});

describe('applyMinus', () => {
  it("'12' equals 12", () => {
    expect(applyMinus('12')).toEqual(12);
  });
  it("'12-2' equals 10", () => {
    expect(applyMinus('12-2')).toEqual(10);
  });
  it('should return a number type', () => {
    expect(typeof applyMinus('12')).toBe("number");
  });
});

