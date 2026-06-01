/**
 * Tiny dependency-free Base64 encoder for ASCII strings.
 *
 * RN's environment has `global.btoa` on web but not on native; rather
 * than pull in a polyfill package or assume Buffer, we just inline
 * the table. UTF-8 awareness: we encode the string's UTF-8 bytes
 * first so usernames/passwords with non-ASCII characters round-trip.
 */

const TABLE =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function utf8Bytes(input: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else if ((code & 0xfc00) === 0xd800 && i + 1 < input.length) {
      const next = input.charCodeAt(i + 1);
      if ((next & 0xfc00) === 0xdc00) {
        const combined =
          0x10000 + (((code & 0x3ff) << 10) | (next & 0x3ff));
        bytes.push(0xf0 | (combined >> 18));
        bytes.push(0x80 | ((combined >> 12) & 0x3f));
        bytes.push(0x80 | ((combined >> 6) & 0x3f));
        bytes.push(0x80 | (combined & 0x3f));
        i++;
        continue;
      }
    } else {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

export function base64Encode(input: string): string {
  const bytes = utf8Bytes(input);
  let out = '';
  let i = 0;
  for (; i + 3 <= bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += TABLE[(n >> 18) & 0x3f];
    out += TABLE[(n >> 12) & 0x3f];
    out += TABLE[(n >> 6) & 0x3f];
    out += TABLE[n & 0x3f];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += TABLE[(n >> 18) & 0x3f];
    out += TABLE[(n >> 12) & 0x3f];
    out += '==';
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += TABLE[(n >> 18) & 0x3f];
    out += TABLE[(n >> 12) & 0x3f];
    out += TABLE[(n >> 6) & 0x3f];
    out += '=';
  }
  return out;
}
