export function bin(int) {
  return (int >>> 0).toString(2)
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
