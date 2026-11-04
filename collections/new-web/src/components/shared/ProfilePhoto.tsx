'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/** Cloudinary on-the-fly crop (face-aware) with a graceful monogram fallback. */
const transform = (url: string, w: number) =>
  url.includes('/image/upload/') ? url.replace('/image/upload/', `/image/upload/c_fill,g_face,w_${w},h_${w},f_auto,q_auto/`) : url;

export function ProfilePhoto({
  src,
  alt,
  size = 640,
  className,
  imgClassName,
  monogramClassName,
  priority = false,
}: {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
  imgClassName?: string;
  monogramClassName?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(!src);
  const img = useRef<HTMLImageElement>(null);
  // an eager image can fail before hydration, when React's onError is not attached yet
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!failed && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={img}
          src={transform(src, size)}
          alt={alt}
          width={size}
          height={size}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className={cn(
            'grid h-full w-full place-items-center bg-gradient-to-br from-teal-400/30 via-sky-500/20 to-fuchsia-500/30 text-[2.5em] font-semibold tracking-tight',
            monogramClassName,
          )}
        >
          RY
        </div>
      )}
    </div>
  );
}
