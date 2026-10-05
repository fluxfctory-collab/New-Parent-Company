import { logos, type LogoKey } from "../assets/logos/logos";

type LogoProps = {
  name: LogoKey;
  /** Display height in CSS px for the width/height attributes (CSS may resize responsively). */
  height: number;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
};

/** Original client artwork (trimmed derivative), WebP at 2×/3× with a PNG fallback. */
export function Logo({ name, height, alt, className, loading = "eager" }: LogoProps) {
  const logo = logos[name];
  const width = Math.round((height * logo.width) / logo.height);
  return (
    <picture className={className}>
      <source type="image/webp" srcSet={`${logo.webp2x} 2x, ${logo.webp3x} 3x`} />
      <img src={logo.png} width={width} height={height} alt={alt} decoding="async" loading={loading} />
    </picture>
  );
}
