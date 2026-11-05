/**
 * Minimal JPEG header reader: EXIF orientation + stored (unrotated) pixel size.
 * Used only to double-check that the browser really applied the EXIF rotation
 * when it decoded the photo (see optimize-core.ts). Pure; safe in Node/worker.
 */

export interface JpegMeta {
  /** EXIF orientation 1–8 (1 = upright / not present). */
  orientation: number;
  /** Stored pixel size from the SOF marker, before any EXIF rotation. */
  width: number;
  height: number;
  /** Offset of the first start-of-scan (SOS) marker, i.e. where entropy-coded data begins (-1 if none). */
  scanStart: number;
}

export function readJpegMeta(bytes: Uint8Array): JpegMeta | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let orientation = 1;
  let width = 0;
  let height = 0;
  let scanStart = -1;
  let pos = 2;

  while (pos + 4 <= bytes.length) {
    if (bytes[pos] !== 0xff) {
      pos++;
      continue;
    }
    const marker = bytes[pos + 1] ?? 0;
    if (marker === 0xff) {
      pos++;
      continue;
    }
    // Standalone markers carry no length.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      pos += 2;
      continue;
    }
    if (marker === 0xd9) break;
    if (marker === 0xda) {
      scanStart = pos;
      break;
    }
    const length = view.getUint16(pos + 2);
    if (length < 2) return null;
    const dataStart = pos + 4;

    if (marker === 0xe1 && dataStart + 14 <= bytes.length) {
      // APP1 "Exif\0\0" + TIFF header
      const isExif =
        bytes[dataStart] === 0x45 &&
        bytes[dataStart + 1] === 0x78 &&
        bytes[dataStart + 2] === 0x69 &&
        bytes[dataStart + 3] === 0x66;
      if (isExif) {
        const tiff = dataStart + 6;
        const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
        const big = bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d;
        if (little || big) {
          const u16 = (o: number) => view.getUint16(o, little);
          const u32 = (o: number) => view.getUint32(o, little);
          const ifd0 = tiff + u32(tiff + 4);
          if (ifd0 + 2 <= bytes.length) {
            const entries = u16(ifd0);
            for (let i = 0; i < entries; i++) {
              const entry = ifd0 + 2 + i * 12;
              if (entry + 12 > bytes.length) break;
              if (u16(entry) === 0x0112) {
                const value = u16(entry + 8);
                if (value >= 1 && value <= 8) orientation = value;
                break;
              }
            }
          }
        }
      }
    }

    // SOF0..SOF15 except DHT(C4), JPG(C8), DAC(CC)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (dataStart + 5 <= bytes.length) {
        height = view.getUint16(dataStart + 1);
        width = view.getUint16(dataStart + 3);
      }
    }
    pos += 2 + length;
  }

  if (!width || !height) return null;
  return { orientation, width, height, scanStart };
}

/**
 * A JPEG that was cut off mid-download still has a valid header and browsers will
 * happily decode the top part (and fill the rest with grey). Real JPEGs always end
 * the scan with an EOI marker (FF D9); inside entropy-coded data an FF byte is always
 * followed by 00/RSTn, so FF D9 after the scan start can only be the real end.
 * (EOI markers inside an EXIF thumbnail come before the scan, so they don't count.)
 */
export function jpegIsComplete(bytes: Uint8Array, scanStart: number): boolean {
  if (scanStart < 0) return false;
  for (let i = bytes.length - 2; i > scanStart; i--) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) return true;
  }
  return false;
}
