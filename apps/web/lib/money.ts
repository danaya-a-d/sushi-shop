// Единственное место, где копейки (API, БД) превращаются в гривны (интерфейс) и обратно.

/** Копейки из API → гривны для интерфейса (`Product.price`). */
export function kopecksToUah(kopecks: number): number {
  return kopecks / 100;
}

/** Гривны → целые копейки: для сумм без накопления ошибки округления (0.1 + 0.2). */
export function uahToKopecks(uah: number): number {
  return Math.round(uah * 100);
}
