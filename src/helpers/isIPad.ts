// iPadOS puede identificarse como macOS cuando solicita la versión de escritorio.
export const isIPad = (device: Pick<Navigator, 'userAgent' | 'maxTouchPoints'> = navigator) =>
  /iPad/i.test(device.userAgent) ||
  (/Macintosh/i.test(device.userAgent) && device.maxTouchPoints > 1);
