// 시드 난수(mulberry32). app/lib/rng.dart와 비트 단위로 같아야 한다.
export function makeRng(seed) {
  let a = seed >>> 0;
  const u32 = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
  return {
    u32,
    range: (lo, hi) => lo + (u32() % (hi - lo + 1)),
    pick: (list) => list[u32() % list.length],
  };
}
