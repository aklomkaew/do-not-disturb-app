import { useRef, useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { cupidTheme } from '@/constants/theme';

type PhotoCarouselProps = {
  photos: string[];
  width?: number;
  height?: number;
  borderRadius?: number;
};

const DEFAULT_WIDTH = Dimensions.get('window').width - 32;

export function PhotoCarousel({
  photos,
  width: widthProp,
  height = 360,
  borderRadius = cupidTheme.radii.lg,
}: PhotoCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const dragRef = useRef<{ startX: number; startScrollX: number } | null>(null);
  const lastScrollXRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [containerWidth, setContainerWidth] = useState<number>(widthProp ?? DEFAULT_WIDTH);
  
  const width = widthProp ?? containerWidth;

  const scrollToIndex = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(i, photos.length - 1));
    setIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  }, [photos.length, width]);

  // Web: mouse click-and-drag to scroll (like swipe)
  const getClientX = useCallback((e: { nativeEvent?: { clientX?: number }; clientX?: number }) => {
    const ev = e as { nativeEvent?: { clientX?: number }; clientX?: number };
    return ev.nativeEvent?.clientX ?? ev.clientX ?? 0;
  }, []);

  const handlePointerDown = useCallback(
    (e: { nativeEvent?: { clientX?: number }; clientX?: number }) => {
      if (Platform.OS !== 'web' || photos.length <= 1) return;
      const clientX = getClientX(e);
      dragRef.current = { startX: clientX, startScrollX: index * width };
      setIsDragging(true);
    },
    [photos.length, width, index, getClientX]
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || !isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const delta = e.clientX - dragRef.current.startX;
        const newScrollX = Math.max(0, Math.min((photos.length - 1) * width, dragRef.current.startScrollX - delta));
        lastScrollXRef.current = newScrollX;
        scrollRef.current?.scrollTo({ x: newScrollX, animated: false });
        setIndex(Math.round(newScrollX / width));
      }
    };
    const onUp = () => {
      if (dragRef.current && photos.length > 1) {
        const currentScrollX = lastScrollXRef.current;
        const nearestIndex = Math.round(currentScrollX / width);
        const clampedIndex = Math.max(0, Math.min(photos.length - 1, nearestIndex));
        const targetScrollX = clampedIndex * width;
        scrollRef.current?.scrollTo({ x: targetScrollX, animated: true });
        setIndex(Math.round(targetScrollX / width));
      }
      dragRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, photos.length, width]);

  // Preload adjacent images for faster scrolling
  useEffect(() => {
    if (photos.length > 0) {
      const preloadUris = [];
      // Preload next image if available
      if (index + 1 < photos.length) {
        preloadUris.push(photos[index + 1]);
      }
      // Preload previous image if available
      if (index > 0) {
        preloadUris.push(photos[index - 1]);
      }
      
      preloadUris.forEach((uri) => {
        Image.prefetch(uri).catch(() => {
          // Silently fail preload
        });
      });
    }
  }, [photos, index]);

  // Preload first few images on mount
  useEffect(() => {
    if (photos.length > 0) {
      // Preload first 2-3 images immediately to prevent flashing
      const imagesToPreload = photos.slice(0, Math.min(3, photos.length));
      imagesToPreload.forEach((uri) => {
        Image.prefetch(uri).catch(() => {
          // Silently fail preload
        });
      });
    }
  }, [photos]);

  if (!photos || photos.length === 0) {
    return null;
  }

  const handleImageLoadStart = useCallback((uri: string) => {
    setLoadingImages((prev) => {
      // Only add if not already loading to prevent unnecessary updates
      if (prev.has(uri)) return prev;
      return new Set(prev).add(uri);
    });
    // Clear error state when starting to load
    setErrorImages((prev) => {
      if (!prev.has(uri)) return prev;
      const next = new Set(prev);
      next.delete(uri);
      return next;
    });
  }, []);

  const handleImageLoadEnd = useCallback((uri: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(uri);
      return next;
    });
    // Mark image as loaded to prevent flashing
    setLoadedImages((prev) => new Set(prev).add(uri));
    // Clear error state when successfully loaded
    setErrorImages((prev) => {
      const next = new Set(prev);
      next.delete(uri);
      return next;
    });
  }, []);

  const handleImageError = useCallback((uri: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(uri);
      return next;
    });
    setErrorImages((prev) => new Set(prev).add(uri));
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: measuredWidth } = event.nativeEvent.layout;
    if (measuredWidth > 0 && !widthProp) {
      setContainerWidth(measuredWidth);
    }
  }, [widthProp]);

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View
        style={[styles.scrollWrap, { width, height }, isWeb && photos.length > 1 && (isDragging ? styles.grabbing : styles.grab)]}
        onPointerDown={isWeb && photos.length > 1 ? handlePointerDown : undefined}
      >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          setIndex(Math.round(offsetX / width));
        }}
        style={[styles.scrollView, { width }]}
        contentContainerStyle={styles.scrollContent}
      >
        {photos.map((uri) => {
          const isLoading = loadingImages.has(uri) && !loadedImages.has(uri);
          const hasError = errorImages.has(uri);
          const isLoaded = loadedImages.has(uri);
          
          return (
            <View key={uri} style={[styles.imageContainer, { width, height, borderRadius }]}>
              {hasError ? (
                <View style={[styles.errorContainer, { width, height, borderRadius }]}>
                  <Text style={styles.errorText}>Unable to load image</Text>
                </View>
              ) : (
                <>
                  <Image
                    source={{ uri }}
                    style={styles.heroImage}
                    onLoadStart={() => handleImageLoadStart(uri)}
                    onLoadEnd={() => handleImageLoadEnd(uri)}
                    onError={() => handleImageError(uri)}
                    resizeMode="contain"
                  />
                  {isLoading && (
                    <View style={[styles.loadingOverlay, { width, height, borderRadius }]}>
                      <ActivityIndicator color={cupidTheme.colors.accent} size="large" />
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
      </View>
      {photos.length > 1 ? (
        <View style={styles.dots}>
          {photos.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => scrollToIndex(i)}
              style={({ pressed }) => [
                styles.dot,
                i === index && styles.dotActive,
                pressed && styles.dotPressed,
              ]}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Photo ${i + 1} of ${photos.length}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  scrollWrap: {
    overflow: 'hidden',
  },
  grab: {
    cursor: 'grab',
    userSelect: 'none',
  } as const,
  grabbing: {
    cursor: 'grabbing',
    userSelect: 'none',
  } as const,
  scrollView: {
    overflow: 'hidden',
  },
  scrollContent: {
    alignItems: 'flex-start',
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: cupidTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: cupidTheme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: cupidTheme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: cupidTheme.colors.border,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: cupidTheme.colors.accent,
  },
  dotPressed: {
    opacity: 0.7,
  },
});
