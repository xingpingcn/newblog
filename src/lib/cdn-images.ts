interface CdnImageVariant {
  src: string
  width: number
}

interface ResponsiveCdnImage {
  src: string
  srcset: string
}

const sourceRoot =
  'https://cdn.jsdmirror.com/gh/xingpingcn/picx-images-hosting@master'
const optimizedRoot = `${sourceRoot}/optimized/newblog/home`

const responsiveVariants: Record<string, CdnImageVariant[]> = {
  [`${sourceRoot}/20240612/图片1.67xbdgmn0b.png`]: [480, 768, 1200].map(
    (width) => ({ src: `${optimizedRoot}/67xbdgmn0b-${width}.webp`, width }),
  ),
  [`${sourceRoot}/image.6ikkz20g7q.webp`]: [480, 768, 1200].map((width) => ({
    src: `${optimizedRoot}/6ikkz20g7q-${width}.webp`,
    width,
  })),
  [`${sourceRoot}/20231027/image.1oz9s4agroao.png`]: [
    { src: `${optimizedRoot}/1oz9s4agroao-740.webp`, width: 740 },
  ],
  [`${sourceRoot}/20230420/image.5hpz9c2gz240.png`]: [480, 936].map(
    (width) => ({ src: `${optimizedRoot}/5hpz9c2gz240-${width}.webp`, width }),
  ),
}

export function getResponsiveCdnImage(
  source: string,
): ResponsiveCdnImage | undefined {
  const variants = responsiveVariants[source]
  if (!variants?.length) return undefined

  return {
    src: variants.at(-1)!.src,
    srcset: variants.map(({ src, width }) => `${src} ${width}w`).join(', '),
  }
}
