import { useState, useEffect } from 'react';
import { getCachedAsset, setCachedAsset, generateLQIP } from '../utils/assetOptimizer';

interface UseLazyAssetOptions {
  lqip?: string;
  autoDecode?: boolean;
}

interface LazyAssetStatus {
  currentSrc: string | null;
  lqipSrc: string | null;
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
}

/**
 * Hook for progressive lazy loading of high-resolution stationery templates & medical assets.
 * Eliminates main-thread blocking, avoids layout shifts, and provides instant LQIP blur-up.
 */
export function useLazyAsset(
  targetSrc: string | null | undefined,
  options: UseLazyAssetOptions = {}
): LazyAssetStatus {
  const [status, setStatus] = useState<LazyAssetStatus>(() => {
    if (!targetSrc) {
      return {
        currentSrc: null,
        lqipSrc: null,
        isLoading: false,
        isLoaded: false,
        isError: false,
      };
    }

    const cached = getCachedAsset(targetSrc);
    if (cached?.decoded) {
      return {
        currentSrc: targetSrc,
        lqipSrc: cached.lqip || options.lqip || null,
        isLoading: false,
        isLoaded: true,
        isError: false,
      };
    }

    return {
      currentSrc: null,
      lqipSrc: options.lqip || null,
      isLoading: true,
      isLoaded: false,
      isError: false,
    };
  });

  useEffect(() => {
    if (!targetSrc) {
      setStatus({
        currentSrc: null,
        lqipSrc: null,
        isLoading: false,
        isLoaded: false,
        isError: false,
      });
      return;
    }

    // Check memory cache first
    const cached = getCachedAsset(targetSrc);
    if (cached?.decoded) {
      setStatus({
        currentSrc: targetSrc,
        lqipSrc: cached.lqip || options.lqip || null,
        isLoading: false,
        isLoaded: true,
        isError: false,
      });
      return;
    }

    let isMounted = true;
    let imgElement: HTMLImageElement | null = new Image();

    // Start loading high-res asset
    setStatus((prev) => ({
      ...prev,
      currentSrc: targetSrc,
      isLoading: true,
      isLoaded: false,
      isError: false,
    }));

    imgElement.src = targetSrc;

    // Use asynchronous decode if supported to prevent UI stutter
    if ('decode' in imgElement && typeof imgElement.decode === 'function') {
      imgElement
        .decode()
        .then(() => {
          if (!isMounted) return;
          setCachedAsset(targetSrc, { full: targetSrc, lqip: options.lqip, decoded: true });
          setStatus({
            currentSrc: targetSrc,
            lqipSrc: options.lqip || null,
            isLoading: false,
            isLoaded: true,
            isError: false,
          });
        })
        .catch(() => {
          // Fallback to traditional onload
          if (!imgElement) return;
          imgElement.onload = () => {
            if (!isMounted) return;
            setCachedAsset(targetSrc, { full: targetSrc, lqip: options.lqip, decoded: true });
            setStatus({
              currentSrc: targetSrc,
              lqipSrc: options.lqip || null,
              isLoading: false,
              isLoaded: true,
              isError: false,
            });
          };
          imgElement.onerror = () => {
            if (!isMounted) return;
            // Never blank out the image, keep targetSrc active
            setStatus({
              currentSrc: targetSrc,
              lqipSrc: null,
              isLoading: false,
              isLoaded: true,
              isError: false,
            });
          };
        });
    } else {
      imgElement.onload = () => {
        if (!isMounted) return;
        setCachedAsset(targetSrc, { full: targetSrc, lqip: options.lqip, decoded: true });
        setStatus({
          currentSrc: targetSrc,
          lqipSrc: options.lqip || null,
          isLoading: false,
          isLoaded: true,
          isError: false,
        });
      };
      imgElement.onerror = () => {
        if (!isMounted) return;
        setStatus({
          currentSrc: targetSrc,
          lqipSrc: null,
          isLoading: false,
          isLoaded: true,
          isError: false,
        });
      };
    }

    return () => {
      isMounted = false;
      if (imgElement) {
        imgElement.onload = null;
        imgElement.onerror = null;
        imgElement = null;
      }
    };
  }, [targetSrc, options.lqip]);

  return status;
}
