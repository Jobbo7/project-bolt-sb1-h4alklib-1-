export function environmentValue(name) {
  return String(process.env[`PREVIEW_${name}`] || process.env[name] || '').trim();
}
