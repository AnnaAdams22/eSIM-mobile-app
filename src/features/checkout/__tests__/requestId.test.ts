import { makeRequestIdHolder } from '../requestId';

describe('makeRequestIdHolder', () => {
  it('generates an id once and reuses it on retry', () => {
    let n = 0;
    const generate = jest.fn(() => `id-${++n}`);
    const holder = makeRequestIdHolder(generate);

    const first = holder.current();
    const second = holder.current(); // a retry re-reads the same id
    const third = holder.current();

    expect(first).toBe('id-1');
    expect(second).toBe('id-1');
    expect(third).toBe('id-1');
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('generates a fresh id for a new attempt after reset()', () => {
    let n = 0;
    const generate = jest.fn(() => `id-${++n}`);
    const holder = makeRequestIdHolder(generate);

    expect(holder.current()).toBe('id-1');
    holder.reset();
    expect(holder.current()).toBe('id-2');
    expect(holder.current()).toBe('id-2');
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('does not call the generator until first read', () => {
    const generate = jest.fn(() => 'x');
    makeRequestIdHolder(generate);
    expect(generate).not.toHaveBeenCalled();
  });
});
