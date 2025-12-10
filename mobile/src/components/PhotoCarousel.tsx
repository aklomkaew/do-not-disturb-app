import { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, View } from 'react-native';
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

  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          setIndex(Math.round(offsetX / width));
        }}
        style={{ width }}
      >
        {photos.map((uri) => (
          <Image key={uri} source={{ uri }} style={[styles.heroImage, { width, height, borderRadius }]} />
        ))}
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
  heroImage: {
    resizeMode: 'cover',
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: cupidTheme.colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: cupidTheme.colors.accent,
  },
});
