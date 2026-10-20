import { decideNotificationRoute } from '../routing';

const ICCID = '8991000000000000001';

describe('decideNotificationRoute', () => {
  it('opens the eSIM detail when signed in and the iccid is valid', () => {
    expect(
      decideNotificationRoute({ data: { type: 'low_data', iccid: ICCID }, signedIn: true })
    ).toEqual({ type: 'esim', iccid: ICCID });
  });

  it('sends a signed-out user to sign-in, carrying the eSIM as the return path', () => {
    expect(
      decideNotificationRoute({ data: { type: 'expiring_24h', iccid: ICCID }, signedIn: false })
    ).toEqual({ type: 'signin', redirectTo: `/esim/${ICCID}` });
  });

  it('falls back to My eSIMs when the payload has no valid iccid', () => {
    expect(decideNotificationRoute({ data: { type: 'low_data' }, signedIn: true })).toEqual({
      type: 'esims',
    });
    expect(decideNotificationRoute({ data: null, signedIn: true })).toEqual({ type: 'esims' });
  });

  it('falls back to My eSIMs when the eSIM is known to not belong to the user', () => {
    expect(
      decideNotificationRoute({
        data: { iccid: ICCID },
        signedIn: true,
        knownIccids: ['8991000000000000999'],
      })
    ).toEqual({ type: 'esims' });
  });

  it('opens the eSIM detail when it is in the known list', () => {
    expect(
      decideNotificationRoute({
        data: { iccid: ICCID },
        signedIn: true,
        knownIccids: [ICCID],
      })
    ).toEqual({ type: 'esim', iccid: ICCID });
  });
});
