import Ajv from 'ajv';
import { fleetUpdateOperation } from './operations';

const validate = new Ajv({ strict: true, allErrors: true }).compile(
  fleetUpdateOperation.inputSchema!,
);

describe('fleetUpdateOperation input schema', () => {
  it.each([
    { op: 'replace', path: '/spec/template/spec/os', value: {} },
    { op: 'add', path: '/spec/template/spec/applications/-', value: {} },
    { op: 'remove', path: '/spec/template/spec/applications/0' },
  ])('accepts %p', operation => {
    expect(validate([operation])).toBe(true);
  });

  it('accepts several operations in one request', () => {
    expect(
      validate([
        { op: 'remove', path: '/spec/template/spec/applications/0' },
        { op: 'add', path: '/spec/template/spec/applications/-', value: {} },
      ]),
    ).toBe(true);
  });

  it.each([
    ['an empty patch', []],
    ['a path outside the spec', [{ op: 'replace', path: '/metadata/name', value: 'x' }]],
    ['an add without a value', [{ op: 'add', path: '/spec/template/spec/applications' }]],
    ['an unsupported operation', [{ op: 'move', path: '/spec/template/spec/os', from: '/spec/template/spec/applications' }]],
  ])('rejects %s', (_label, body) => {
    expect(validate(body)).toBe(false);
  });
});
