import { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Dimensions, Image, LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const [index, setIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [containerWidth, setContainerWidth] = useState<number>(widthProp ?? DEFAULT_WIDTH);
  
  const width = widthProp ?? containerWidth;

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

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <ScrollView
        horizontal
        pagingEnabled
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
      {photos.length > 1 ? (
        <View style={styles.dots}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
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
});
