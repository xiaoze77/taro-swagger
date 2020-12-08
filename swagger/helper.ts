export function get(obj: any, path: string, defaultValue = '') {
  const paths = path.split('.');
  let i = 0;

  while (i < paths.length && obj) {
    obj = obj[ paths[ i ] ];
    i++;
  }

  return obj || defaultValue;
}