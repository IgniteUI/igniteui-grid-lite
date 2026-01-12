import type { Keys } from '../../src/internal/types.js';
import type { SortComparer } from '../../src/operations/sort/types.js';

type Importance = 'low' | 'medium' | 'high';

const importanceOrdering = ['low', 'medium', 'high'] as const;
export const importanceComparer: SortComparer<TestData, 'importance'> = (a, b) =>
  importanceOrdering.indexOf(a) - importanceOrdering.indexOf(b);

/**
 * Generates field paths from an object, including nested paths for nested objects.
 * E.g., { id: 1, address: { city: 'NY' } } => ['id', 'address.city']
 */
export function generateFieldPaths<T extends object, K extends Keys<T> = Keys<T>>(
  obj: T,
  prefix = ''
): K[] {
  const paths: K[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...(generateFieldPaths(value, fieldPath) as K[]));
    } else {
      paths.push(fieldPath as K);
    }
  }
  return paths;
}

export interface TestData {
  id: number;
  name: string;
  active: boolean;
  importance: Importance;
  address: {
    city: string;
    code: number;
  };
}

export default [
  {
    id: 1,
    name: 'A',
    active: false,
    importance: 'medium',
    address: { city: 'New York', code: 10001 },
  },
  {
    id: 2,
    name: 'B',
    active: false,
    importance: 'low',
    address: { city: 'Los Angeles', code: 90001 },
  },
  {
    id: 3,
    name: 'C',
    active: true,
    importance: 'medium',
    address: { city: 'Chicago', code: 60601 },
  },
  {
    id: 4,
    name: 'D',
    active: false,
    importance: 'low',
    address: { city: 'New York', code: 10002 },
  },
  { id: 5, name: 'a', active: true, importance: 'high', address: { city: 'Chicago', code: 60602 } },
  {
    id: 6,
    name: 'b',
    active: false,
    importance: 'medium',
    address: { city: 'Los Angeles', code: 90002 },
  },
  { id: 7, name: 'c', active: true, importance: 'low', address: { city: 'New York', code: 10003 } },
  { id: 8, name: 'd', active: true, importance: 'high', address: { city: 'Chicago', code: 60603 } },
] as TestData[];
