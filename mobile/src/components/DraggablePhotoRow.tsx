import type { PhotoEntry } from '@/utils/photoHelpers';
import { cupidTheme } from '@/constants/theme';
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  NestableDraggableFlatList,
  type RenderItemParams,
  OpacityDecorator,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';

interface DraggablePhotoRowProps {
  photos: PhotoEntry[];
  onReorder: (photos: PhotoEntry[]) => void;
  onRemove: (path: string) => void;
  onAdd?: () => void;
  disabled?: boolean;
  canAdd?: boolean;
}

export function DraggablePhotoRow({
  photos,
  onReorder,
  onRemove,
  onAdd,
  disabled = false,
  canAdd = true,
}: DraggablePhotoRowProps) {
  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<PhotoEntry>) => {
    const photoUri = item.url || (item.path.startsWith('http') ? item.path : null);
    const index = getIndex() ?? 0;

    return (
      <ScaleDecorator activeScale={1.05}>
        <OpacityDecorator activeOpacity={0.75}>
        <Pressable
          onLongPress={drag}
          disabled={isActive || disabled}
          style={[styles.photoItem, isActive && styles.photoItemActive]}
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.photo}
              resizeMode="cover"
              fadeDuration={150}
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.photoPlaceholderText}>Loading...</Text>
            </View>
          )}
          <Pressable
            style={styles.photoRemove}
            onPress={() => onRemove(item.path)}
            disabled={disabled}
            accessibilityLabel="Remove photo"
          >
            <Text style={styles.photoRemoveLabel}>×</Text>
          </Pressable>
          <View style={styles.photoBadge} pointerEvents="none">
            <Text style={styles.photoBadgeText}>
              {index === 0 ? 'Profile' : `${index + 1}`}
            </Text>
          </View>
          {photos.length > 1 && (
            <View style={styles.dragHint} pointerEvents="none">
              <Text style={styles.dragHintText}>⋮⋮</Text>
            </View>
          )}
        </Pressable>
        </OpacityDecorator>
      </ScaleDecorator>
    );
  };

  const renderPlaceholder = ({ item }: { item: PhotoEntry }) => {
    const photoUri = item.url || (item.path.startsWith('http') ? item.path : null);
    return (
      <View style={[styles.photoItem, styles.photoItemPlaceholder]}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={[styles.photo, styles.photoPlaceholderFaded]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]} />
        )}
      </View>
    );
  };

  const ListFooter =
    onAdd && canAdd ? (
      <View style={styles.footerWrapper}>
        <Pressable
          style={[styles.photoAdd, disabled && styles.photoAddDisabled]}
          onPress={onAdd}
          disabled={disabled}
          accessibilityLabel="Add photo"
        >
          <Text style={styles.photoAddLabel}>+ Add</Text>
        </Pressable>
      </View>
    ) : null;

  if (photos.length === 0 && !ListFooter) {
    return null;
  }

  // When no photos, just show Add button
  if (photos.length === 0) {
    return (
      <View style={styles.photoRow}>
        {ListFooter}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {photos.length > 1 && (
        <Text style={styles.dragLabel}>Long press and drag to reorder (scroll when 4+ photos)</Text>
      )}
      <NestableDraggableFlatList
        data={photos}
        keyExtractor={(item) => item.path}
        renderItem={renderItem}
        renderPlaceholder={renderPlaceholder}
        onDragEnd={({ data }) => onReorder(data)}
        horizontal
        scrollEnabled={photos.length > 3}
        contentContainerStyle={[styles.listContent, photos.length > 3 && styles.listContentScrollable]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={ListFooter}
        activationDistance={8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 4,
  },
  dragLabel: {
    fontSize: 11,
    color: cupidTheme.colors.textMuted,
    marginBottom: 6,
  },
  listContent: {
    paddingVertical: 4,
  },
  listContentScrollable: {
    paddingRight: 20,
  },
  separator: {
    width: 12,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  photoItem: {
    width: 96,
    height: 120,
    borderRadius: cupidTheme.radii.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: cupidTheme.colors.border,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    position: 'relative',
  },
  photoItemActive: {
    borderColor: cupidTheme.colors.accent,
  },
  photoItemPlaceholder: {
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  photoPlaceholderFaded: {
    opacity: 0.35,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: cupidTheme.colors.textMuted,
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: cupidTheme.radii.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  photoBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dragHint: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: cupidTheme.radii.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dragHintText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  photoAdd: {
    width: 96,
    height: 120,
    borderRadius: cupidTheme.radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: cupidTheme.colors.border,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddDisabled: {
    opacity: 0.5,
  },
  photoAddLabel: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  footerWrapper: {
    marginLeft: 12,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
});
