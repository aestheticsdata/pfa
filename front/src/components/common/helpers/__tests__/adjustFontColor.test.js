import adjustFontColor from '@components/common/helpers/adjustFontColor';

describe('adjustFontColor', () => {
  it('should return #ffffff', () => {
    expect(adjustFontColor('#12AA36')).toEqual('#ffffff');
    expect(adjustFontColor('#041936')).toEqual('#ffffff');
  });
  it('should return #111111', () => {
    expect(adjustFontColor('#c9f3d1')).toEqual('#111111');
    expect(adjustFontColor('#ffeac3')).toEqual('#111111');
  });
});
