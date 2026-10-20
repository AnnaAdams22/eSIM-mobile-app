import {
  _resetBeforeSignOutHooks,
  registerBeforeSignOut,
  runBeforeSignOutHooks,
} from '../signOutHooks';

beforeEach(() => {
  _resetBeforeSignOutHooks();
});

describe('before-sign-out hooks', () => {
  it('runs every registered hook (so the device token is deregistered before the session is cleared)', async () => {
    const calls: string[] = [];
    registerBeforeSignOut(async () => {
      calls.push('a');
    });
    registerBeforeSignOut(async () => {
      calls.push('b');
    });

    await runBeforeSignOutHooks();

    expect(calls.sort()).toEqual(['a', 'b']);
  });

  it('never rejects even if a hook throws, and still runs the others', async () => {
    const calls: string[] = [];
    registerBeforeSignOut(async () => {
      throw new Error('network down');
    });
    registerBeforeSignOut(async () => {
      calls.push('ran');
    });

    await expect(runBeforeSignOutHooks()).resolves.toBeUndefined();
    expect(calls).toEqual(['ran']);
  });

  it('stops calling a hook after it is unregistered', async () => {
    const calls: string[] = [];
    const unregister = registerBeforeSignOut(async () => {
      calls.push('x');
    });
    unregister();

    await runBeforeSignOutHooks();

    expect(calls).toEqual([]);
  });
});
