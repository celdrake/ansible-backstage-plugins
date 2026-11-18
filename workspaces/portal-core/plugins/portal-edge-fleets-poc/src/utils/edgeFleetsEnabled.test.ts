import { ConfigReader } from '@backstage/config';
import { isEdgeFleetsEnabled } from './edgeFleetsEnabled';

describe('isEdgeFleetsEnabled', () => {
  it('defaults to enabled', () => {
    expect(isEdgeFleetsEnabled(new ConfigReader({}))).toBe(true);
  });

  it('honours an explicit false', () => {
    const config = new ConfigReader({
      ansible: { 'edge-fleets-poc': { enabled: false } },
    });
    expect(isEdgeFleetsEnabled(config)).toBe(false);
  });
});
