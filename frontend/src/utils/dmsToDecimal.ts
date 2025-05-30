export function dmsToDecimal(dms: string): number {
  const regex = /(\d+)[°](\d+)'(\d+\.\d+)"([NSEW])/;
  const match = dms.match(regex);
  if (!match) throw new Error("Invalid DMS format");

  const degrees = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseFloat(match[3]);
  const direction = match[4];

  let decimal = degrees + minutes / 60 + seconds / 3600;
  return direction === "S" || direction === "W" ? -decimal : decimal;
}
