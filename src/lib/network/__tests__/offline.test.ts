import { isOfflineError } from '../offline';
import { ApiError, TimeoutError } from '../../api-error';

describe('isOfflineError', () => {
  it('treats our TimeoutError as offline', () => {
    expect(isOfflineError(new TimeoutError())).toBe(true);
  });

  it('treats a reached-server ApiError as online (any HTTP status)', () => {
    expect(isOfflineError(new ApiError(500, { error: 'boom' }))).toBe(false);
    expect(isOfflineError(new ApiError(404))).toBe(false);
    expect(isOfflineError(new ApiError(401))).toBe(false);
  });

  it('detects the React Native fetch connectivity TypeError', () => {
    expect(isOfflineError(new TypeError('Network request failed'))).toBe(true);
    expect(isOfflineError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('ignores unrelated TypeErrors', () => {
    expect(isOfflineError(new TypeError('x is not a function'))).toBe(false);
  });

  it('detects connectivity by message or code on generic errors', () => {
    expect(isOfflineError({ message: 'The network connection was lost.' })).toBe(true); // iOS
    expect(isOfflineError({ message: 'The Internet connection appears to be offline.' })).toBe(true);
    expect(isOfflineError({ message: 'network error' })).toBe(true);
    expect(isOfflineError({ message: 'card_declined' })).toBe(false);
    expect(isOfflineError({ code: 'ETIMEDOUT' })).toBe(true);
    expect(isOfflineError({ code: 'network_error' })).toBe(true);
  });

  it('is false for null/undefined/strings', () => {
    expect(isOfflineError(null)).toBe(false);
    expect(isOfflineError(undefined)).toBe(false);
    expect(isOfflineError('nope')).toBe(false);
  });
});
