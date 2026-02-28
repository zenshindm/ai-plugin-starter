import { getImage } from "astro:assets";
import { type ImageMetadata } from "astro";
import { parse } from "node-html-parser";

async function getAllImageImportInAsset() {
  const images = import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/*.{jpeg,jpg,png,gif,svg,webp,avif,tiff}",
    {
      eager: true,
    },
  );
  return images;
}

export async function getLocalAssetsImg(inputWithSrcNAlt: {
  src: string;
  alt?: string;
}): Promise<any> {
  let input = inputWithSrcNAlt.src;
  let isInputUrl = false;
  try {
    new URL(input);
    const image = input;
    isInputUrl = true;
    return image;
  } catch {
    isInputUrl = false;
  }
  if (isInputUrl === false) {
    const imageImports = await getAllImageImportInAsset();

    const imagePath = `/src/assets/${input}`;
    const specificImage = imageImports[imagePath];

    if (!specificImage) {
      throw new Error(`${input} Image ${imagePath} not found`);
    }
    const image = specificImage.default;
    return image;
  }
}

export async function optimizeImagesInString(htmlString: string) {
  const root = parse(htmlString);

  const images = root.querySelectorAll("img");

  for (const img of images) {
    const src = img.getAttribute("title");
    if (src) {
      try {
        const deSource = String(`/src/assets/${src}`);
        const imageImports = await getAllImageImportInAsset();
        const optimizedImage = await getImage({
          src: imageImports[deSource].default,
          width: 900,
          height: 400,
          format: "avif",
          quality: 80,
        });

        img.setAttribute("src", optimizedImage.src);
        img.setAttribute("alt", "post Image");
        img.setAttribute("width", optimizedImage.attributes.width.toString());
        img.setAttribute("height", optimizedImage.attributes.height.toString());

        img.setAttribute("loading", "lazy");
      } catch (error) {
        throw new Error(`Failed to optimize image: ${src} ${error}`);
      }
    }
  }
  return root.toString();
}
