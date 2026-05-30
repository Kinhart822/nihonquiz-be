export function getVariableName<TResult>(getVar: () => TResult): string {
  const m = /\(\)=>(.*)/.exec(
    getVar.toString().replace(/(\r\n|\n|\r|\s)/gm, ''),
  );

  if (!m) {
    throw new Error(
      "The function does not contain a statement matching 'return variableName;'",
    );
  }

  const fullMemberName = m[1];

  const memberParts = fullMemberName.split('.');

  return memberParts[memberParts.length - 1];
}

export function isNullOrUndefined(value: any) {
  return value === null || value === undefined;
}

export function parseDuration(str: string | number): number {
  // if input is a number → assume it's already milliseconds
  if (typeof str === 'number') return str;

  // if input is a numeric string → treat it as milliseconds
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }

  // match value + unit
  const match = str.match(/^(\d+)([smhdwy])$/); // supports s, m, h, d, w, y
  if (!match) throw new Error(`Invalid duration format: ${str}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000;
    case 'y':
      return value * 365 * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
}
