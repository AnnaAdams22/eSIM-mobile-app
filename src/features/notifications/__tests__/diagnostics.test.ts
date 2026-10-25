import {
  isValidExpoPushToken,
  pickProjectId,
  registrationErrorKey,
} from '../diagnostics';

describe('pickProjectId', () => {
  it('reads the projectId from expoConfig.extra.eas', () => {
    expect(
      pickProjectId({ expoConfig: { extra: { eas: { projectId: 'abc-123' } } } })
    ).toBe('abc-123');
  });

  it('falls back to easConfig.projectId when expoConfig has none (the real-build case)', () => {
    expect(
      pickProjectId({ expoConfig: { extra: {} }, easConfig: { projectId: 'from-eas' } })
    ).toBe('from-eas');
  });

  it('prefers expoConfig over easConfig when both are present', () => {
    expect(
      pickProjectId({
        expoConfig: { extra: { eas: { projectId: 'primary' } } },
        easConfig: { projectId: 'secondary' },
      })
    ).toBe('primary');
  });

  it('returns null when neither source has a usable id', () => {
    expect(pickProjectId({})).toBeNull();
    expect(pickProjectId({ expoConfig: null, easConfig: null })).toBeNull();
    expect(pickProjectId({ expoConfig: { extra: { eas: { projectId: '' } } } })).toBeNull();
    expect(pickProjectId({ easConfig: { projectId: 42 } })).toBeNull();
  });
});

describe('isValidExpoPushToken', () => {
  it('accepts an ExponentPushToken', () => {
    expect(isValidExpoPushToken('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]')).toBe(true);
  });

  it('accepts the newer ExpoPushToken form', () => {
    expect(isValidExpoPushToken('ExpoPushToken[yyyy]')).toBe(true);
  });

  it('rejects a native FCM device token or other shapes', () => {
    expect(isValidExpoPushToken('fGzT...:APA91bHun')).toBe(false);
    expect(isValidExpoPushToken('ExponentPushToken[]')).toBe(false);
    expect(isValidExpoPushToken('')).toBe(false);
    expect(isValidExpoPushToken(null)).toBe(false);
    expect(isValidExpoPushToken(undefined)).toBe(false);
  });
});

describe('registrationErrorKey', () => {
  it('maps each failing step to a friendly i18n key', () => {
    expect(registrationErrorKey('permission')).toBe('notifications.errors.permission');
    expect(registrationErrorKey('device')).toBe('notifications.errors.device');
    expect(registrationErrorKey('config')).toBe('notifications.errors.config');
    expect(registrationErrorKey('token')).toBe('notifications.errors.token');
    expect(registrationErrorKey('token-format')).toBe('notifications.errors.token');
    expect(registrationErrorKey('server')).toBe('notifications.errors.server');
    expect(registrationErrorKey('auth')).toBe('notifications.errors.generic');
  });
});
