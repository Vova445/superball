export const ARENAS = [
  {
    id: 'village-field',
    name: '\u0421\u0456\u043b\u044c\u0441\u043a\u0435 \u043f\u043e\u043b\u0435',
    cups: 0,
    image:
      '/assets/stadium/\u0421\u0456\u043b\u044c\u0441\u043a\u0435%20\u043f\u043e\u043b\u0435.png',
    accent: 'border-emerald-300/60 bg-emerald-400/10 text-emerald-200',
    playBounds: { left: 160, right: 1037, top: 68, bottom: 634 },
  },
  {
    id: 'field-court',
    name: '\u041f\u043e\u043b\u044c\u043e\u0432\u0438\u0439 \u043c\u0430\u0439\u0434\u0430\u043d\u0447\u0438\u043a',
    cups: 100,
    image:
      '/assets/stadium/\u041f\u043e\u043b\u044c\u043e\u0432\u0438\u0439%20\u043c\u0430\u0439\u0434\u0430\u043d\u0447\u0438\u043a.png',
    accent: 'border-amber-300/60 bg-amber-400/10 text-amber-100',
    playBounds: { left: 152, right: 1047, top: 67, bottom: 635 },
  },
] as const;

export type Arena = (typeof ARENAS)[number];

export function getArenaForCups(cups: number): Arena {
  return [...ARENAS].reverse().find((arena) => cups >= arena.cups) ?? ARENAS[0];
}

export function getArenaById(id: string | null | undefined): Arena | undefined {
  if (!id) return undefined;
  return ARENAS.find((arena) => arena.id === id);
}
