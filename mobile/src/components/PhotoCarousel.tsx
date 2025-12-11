import { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  width = DEFAULT_WIDTH,
  height = 360,
  borderRadius = cupidTheme.radii.lg,
}: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());

  if (!photos || photos.length === 0) {
    return null;
  }

  const handleImageLoadStart = (uri: string) => {
    setLoadingImages((prev) => new Set(prev).add(uri));
    setErrorImages((prev) => {
      const next = new Set(prev);
      next.delete(uri);
      return next;
    });
  };

  const handleImageLoadEnd = (uri: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(uri);
      return next;
    });
  };

  const handleImageError = (uri: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(uri);
      return next;
    });
    setErrorImages((prev) => new Set(prev).add(uri));
  };

  return (
    <View style={styles.container}>
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
          const isLoading = loadingImages.has(uri);
          const hasError = errorImages.has(uri);
          
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
                    style={[styles.heroImage, { width, height, borderRadius }]}
                    onLoadStart={() => handleImageLoadStart(uri)}
                    onLoadEnd={() => handleImageLoadEnd(uri)}
                    onError={() => handleImageError(uri)}
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
  },
  heroImage: {
    resizeMode: 'cover',
    backgroundColor: cupidTheme.colors.surfaceMuted,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
