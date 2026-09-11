export function resolveEffectiveWorkshopType(qaPersona, accountWorkshopType) {
  if (qaPersona === 'COLLISION') return 'COLLISION';
  if (qaPersona === 'WORKSHOP') return 'MECHANICAL';

  return String(accountWorkshopType || '').toUpperCase();
}
