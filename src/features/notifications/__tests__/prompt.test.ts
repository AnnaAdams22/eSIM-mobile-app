import { decideSoftPrompt } from '../prompt';

const base = {
  permission: 'undetermined' as const,
  timesDismissed: 0,
  dismissedAtPurchaseCount: null,
  purchaseCount: 1,
};

describe('decideSoftPrompt', () => {
  it('shows the prompt after the first purchase when permission is undetermined', () => {
    expect(decideSoftPrompt(base)).toBe(true);
  });

  it('never shows when permission is already granted', () => {
    expect(decideSoftPrompt({ ...base, permission: 'granted' })).toBe(false);
  });

  it('never shows when permission is denied (the system will not re-prompt)', () => {
    expect(decideSoftPrompt({ ...base, permission: 'denied' })).toBe(false);
  });

  it('does not re-show on the SAME purchase it was dismissed on', () => {
    expect(
      decideSoftPrompt({
        ...base,
        timesDismissed: 1,
        dismissedAtPurchaseCount: 1,
        purchaseCount: 1,
      })
    ).toBe(false);
  });

  it('re-offers once on a LATER purchase after a single dismissal', () => {
    expect(
      decideSoftPrompt({
        ...base,
        timesDismissed: 1,
        dismissedAtPurchaseCount: 1,
        purchaseCount: 2,
      })
    ).toBe(true);
  });

  it('never shows again after two dismissals', () => {
    expect(
      decideSoftPrompt({
        ...base,
        timesDismissed: 2,
        dismissedAtPurchaseCount: 2,
        purchaseCount: 5,
      })
    ).toBe(false);
  });
});
