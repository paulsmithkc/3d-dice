/**
 * Returns a random integer between min and max (not including max)
 * @param min
 * @param max
 * @returns random integer
 */
export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min
}

/**
 * Returns a random float between min and max (not including max)
 * @param min
 * @param max
 * @returns random float
 */
export function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min
}
