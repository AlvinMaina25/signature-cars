/**
 * Objective comparison between a reference image and its compressed version.
 *
 * This is a MEASUREMENT, not a guarantee of how the result looks to a person.
 * It combines:
 *  - block SSIM on luma (8x8 blocks): structural similarity, i.e. sharpness and
 *    fine detail. We keep both the mean and the 5th-percentile block, so a
 *    small area that got visibly worse (a number plate, a scratch) is not
 *    hidden by the many flat blocks (sky, paint) that compress perfectly.
 *  - mean absolute RGB error: overall pixel accuracy.
 *  - global colour shift: difference in the average R, G and B values, which
 *    catches colour casts / colour-profile mistakes.
 *
 * Pure and dependency-free so it runs in a worker, the main thread or Node.
 */

export interface QualityReport {
  ssimMean: number;
  /** SSIM of the worst-5% blocks — sensitive to localised loss of detail. */
  ssimP5: number;
  /** Mean absolute error over R, G, B (0–255 scale). */
  meanAbsError: number;
  /** Largest difference between the mean R, G or B of the two images (0–255). */
  colorShift: number;
}

export interface QualityThresholds {
  ssimMean: number;
  ssimP5: number;
  meanAbsError: number;
  colorShift: number;
}

const BLOCK = 8;
const C1 = (0.01 * 255) ** 2;
const C2 = (0.03 * 255) ** 2;

export function compareImages(
  reference: Uint8ClampedArray,
  candidate: Uint8ClampedArray,
  width: number,
  height: number,
): QualityReport {
  if (reference.length !== candidate.length || reference.length !== width * height * 4) {
    throw new Error("Image buffers must have identical RGBA dimensions.");
  }

  const bx = Math.max(1, Math.floor(width / BLOCK));
  const by = Math.max(1, Math.floor(height / BLOCK));
  const scores = new Float32Array(bx * by);
  let n = 0;

  for (let j = 0; j < by; j++) {
    for (let i = 0; i < bx; i++) {
      const x0 = i * BLOCK;
      const y0 = j * BLOCK;
      const x1 = Math.min(width, x0 + BLOCK);
      const y1 = Math.min(height, y0 + BLOCK);
      let sx = 0,
        sy = 0,
        sxx = 0,
        syy = 0,
        sxy = 0,
        count = 0;
      for (let y = y0; y < y1; y++) {
        let p = (y * width + x0) * 4;
        for (let x = x0; x < x1; x++, p += 4) {
          const a = 0.299 * reference[p]! + 0.587 * reference[p + 1]! + 0.114 * reference[p + 2]!;
          const b = 0.299 * candidate[p]! + 0.587 * candidate[p + 1]! + 0.114 * candidate[p + 2]!;
          sx += a;
          sy += b;
          sxx += a * a;
          syy += b * b;
          sxy += a * b;
          count++;
        }
      }
      const mx = sx / count;
      const my = sy / count;
      const vx = sxx / count - mx * mx;
      const vy = syy / count - my * my;
      const cov = sxy / count - mx * my;
      scores[n++] =
        ((2 * mx * my + C1) * (2 * cov + C2)) / ((mx * mx + my * my + C1) * (vx + vy + C2));
    }
  }

  let total = 0;
  for (let k = 0; k < n; k++) total += scores[k]!;
  const sorted = scores.slice(0, n).sort();
  const p5 = sorted[Math.min(n - 1, Math.floor(n * 0.05))]!;

  let abs = 0;
  let rA = 0,
    gA = 0,
    bA = 0,
    rB = 0,
    gB = 0,
    bB = 0;
  const pixels = width * height;
  for (let p = 0; p < pixels * 4; p += 4) {
    const r1 = reference[p]!,
      g1 = reference[p + 1]!,
      b1 = reference[p + 2]!;
    const r2 = candidate[p]!,
      g2 = candidate[p + 1]!,
      b2 = candidate[p + 2]!;
    abs += Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    rA += r1;
    gA += g1;
    bA += b1;
    rB += r2;
    gB += g2;
    bB += b2;
  }

  return {
    ssimMean: total / n,
    ssimP5: p5,
    meanAbsError: abs / (pixels * 3),
    colorShift: Math.max(Math.abs(rA - rB), Math.abs(gA - gB), Math.abs(bA - bB)) / pixels,
  };
}

export function meetsThresholds(report: QualityReport, t: QualityThresholds): boolean {
  return (
    report.ssimMean >= t.ssimMean &&
    report.ssimP5 >= t.ssimP5 &&
    report.meanAbsError <= t.meanAbsError &&
    report.colorShift <= t.colorShift
  );
}

/** Flattens transparency onto a solid colour (in place) so alpha images can be compared fairly. */
export function compositeOnto(data: Uint8ClampedArray, background: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  for (let p = 0; p < data.length; p += 4) {
    const a = data[p + 3]! / 255;
    out[p] = data[p]! * a + background * (1 - a);
    out[p + 1] = data[p + 1]! * a + background * (1 - a);
    out[p + 2] = data[p + 2]! * a + background * (1 - a);
    out[p + 3] = 255;
  }
  return out;
}
