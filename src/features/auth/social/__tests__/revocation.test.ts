import { queueAppleAuthorizationCode } from '../revocation';

describe('queueAppleAuthorizationCode', () => {
  it('does nothing for a missing code', async () => {
    const submit = jest.fn(async () => {});
    await queueAppleAuthorizationCode(undefined, submit);
    await queueAppleAuthorizationCode(null, submit);
    await queueAppleAuthorizationCode('', submit);
    expect(submit).not.toHaveBeenCalled();
  });

  it('forwards a present code to the backend exactly once', async () => {
    const submit = jest.fn(async () => {});
    await queueAppleAuthorizationCode('code-123', submit);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith('code-123');
  });

  it('never rejects when the backend call fails (best-effort, must not block sign-in)', async () => {
    const submit = jest.fn(async () => {
      throw new Error('network down');
    });
    await expect(queueAppleAuthorizationCode('code-123', submit)).resolves.toBeUndefined();
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
