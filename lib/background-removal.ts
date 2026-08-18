export function removeBackgroundFromImageData(
  imageData: ImageData,
  tolerance = 28,
): ImageData {
  const { data, width, height } = imageData;
  const samples = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]
    .map(([x, y]) => {
      const index = (y * width + x) * 4;
      return [data[index], data[index + 1], data[index + 2]] as const;
    })
    .filter(([r, g, b]) => !(r === 0 && g === 0 && b === 0 && data[3] === 0));

  const cornerAverage = samples.reduce(
    ([totalR, totalG, totalB], [r, g, b]) => [
      totalR + r,
      totalG + g,
      totalB + b,
    ],
    [0, 0, 0],
  );

  const background = samples.length
    ? [
        Math.round(cornerAverage[0] / samples.length),
        Math.round(cornerAverage[1] / samples.length),
        Math.round(cornerAverage[2] / samples.length),
      ]
    : [255, 255, 255];

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const distance = Math.sqrt(
      (r - background[0]) ** 2 +
        (g - background[1]) ** 2 +
        (b - background[2]) ** 2,
    );

    if (distance <= tolerance) {
      data[i + 3] = 0;
    }
  }

  return new ImageData(new Uint8ClampedArray(data), width, height);
}

export async function processImageForTransparentBackground(
  src: string,
  tolerance = 28,
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Could not load image for background removal"));
    image.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable in this browser");
  }

  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const cleaned = removeBackgroundFromImageData(imageData, tolerance);
  context.putImageData(cleaned, 0, 0);
  return canvas.toDataURL("image/png");
}
