import { expect } from '@open-wc/testing';
import { resolveFieldValue } from '../src/internal/utils.js';

interface NestedTestData {
  id: number;
  user: {
    name: string;
    age: number;
    address: {
      city: string;
      code: number;
    };
  };
  active: boolean;
}

const nestedData: NestedTestData[] = [
  {
    id: 1,
    user: { name: 'Alice', age: 30, address: { city: 'New York', code: 10001 } },
    active: true,
  },
  {
    id: 2,
    user: { name: 'Bob', age: 25, address: { city: 'Los Angeles', code: 90001 } },
    active: false,
  },
];

describe('resolveFieldValue utility', () => {
  const testObj = nestedData[0];

  it('should resolve simple properties', () => {
    expect(resolveFieldValue(testObj, 'id')).to.equal(1);
    expect(resolveFieldValue(testObj, 'active')).to.equal(true);
  });

  it('should resolve single-level nested properties', () => {
    expect(resolveFieldValue(testObj, 'user.name')).to.equal('Alice');
    expect(resolveFieldValue(testObj, 'user.age')).to.equal(30);
  });

  it('should resolve deeply nested properties', () => {
    expect(resolveFieldValue(testObj, 'user.address.city')).to.equal('New York');
    expect(resolveFieldValue(testObj, 'user.address.code')).to.equal(10001);
  });

  it('should return undefined for non-existent paths', () => {
    // @ts-expect-error
    expect(resolveFieldValue(testObj, 'nonexistent')).to.be.undefined;
    // @ts-expect-error
    expect(resolveFieldValue(testObj, 'user.nonexistent')).to.be.undefined;
    // @ts-expect-error
    expect(resolveFieldValue(testObj, 'user.address.nonexistent')).to.be.undefined;
  });

  it('should handle undefined intermediate values safely', () => {
    const partialObj = { id: 1, user: undefined } as unknown as NestedTestData;
    expect(resolveFieldValue(partialObj, 'user.name')).to.be.undefined;
  });

  it('should handle null intermediate values safely', () => {
    const partialObj = { id: 1, user: null } as unknown as NestedTestData;
    expect(resolveFieldValue(partialObj, 'user.name')).to.be.undefined;
  });
});
