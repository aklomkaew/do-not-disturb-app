import { useState, useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cupidTheme, cardShadow } from '@/constants/theme';
import { NYC_NEIGHBORHOODS, type Borough } from '@/constants/nycNeighborhoods';

type LocationPickerProps = {
  value: string | null;
  onChange: (location: string | null) => void;
  disabled?: boolean;
};

export function LocationPicker({ value, onChange, disabled = false }: LocationPickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBorough, setSelectedBorough] = useState<Borough | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectLocation = (location: string) => {
    onChange(location);
    setIsModalVisible(false);
    setSelectedBorough(null);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange(null);
    setIsModalVisible(false);
    setSelectedBorough(null);
    setSearchQuery('');
  };

  const handleBoroughSelect = (borough: Borough) => {
    setSelectedBorough(borough);
    setSearchQuery('');
  };

  const handleBack = () => {
    setSelectedBorough(null);
    setSearchQuery('');
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedBorough(null);
    setSearchQuery('');
  };

  // Filter neighborhoods based on search query for the selected borough
  const filteredNeighborhoods = useMemo(() => {
    if (!selectedBorough) return [];
    
    const neighborhoods = NYC_NEIGHBORHOODS[selectedBorough];
    if (!searchQuery.trim()) return neighborhoods;
    
    const query = searchQuery.toLowerCase().trim();
    return neighborhoods.filter(neighborhood => 
      neighborhood.toLowerCase().includes(query)
    );
  }, [selectedBorough, searchQuery]);

  return (
    <>
      <Pressable
        style={[styles.picker, disabled && styles.pickerDisabled]}
        onPress={() => !disabled && setIsModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.pickerText, !value && styles.pickerPlaceholder]} numberOfLines={1}>
          {value || 'Select neighborhood'}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={cupidTheme.colors.textMuted} 
        />
      </Pressable>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedBorough ? `Select ${selectedBorough} Neighborhood` : 'Select Borough'}
              </Text>
              <Pressable onPress={handleModalClose}>
                <Ionicons name="close" size={24} color={cupidTheme.colors.textPrimary} />
              </Pressable>
            </View>

            {!selectedBorough ? (
              <>
                <ScrollView style={styles.boroughList} showsVerticalScrollIndicator={false}>
                  {Object.keys(NYC_NEIGHBORHOODS).map((borough) => (
                    <Pressable
                      key={borough}
                      style={styles.boroughButton}
                      onPress={() => handleBoroughSelect(borough as Borough)}
                    >
                      <Text style={styles.boroughText}>{borough}</Text>
                      <Ionicons 
                        name="chevron-forward" 
                        size={20} 
                        color={cupidTheme.colors.textMuted} 
                      />
                    </Pressable>
                  ))}
                </ScrollView>
                {value && (
                  <Pressable style={styles.clearButton} onPress={handleClear}>
                    <Text style={styles.clearButtonText}>Clear Selection</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <View style={styles.backButtonContainer}>
                  <Pressable 
                    style={styles.backButton}
                    onPress={handleBack}
                  >
                    <Ionicons 
                      name="chevron-back" 
                      size={20} 
                      color={cupidTheme.colors.accent} 
                    />
                    <Text style={styles.backButtonText}>Back to Boroughs</Text>
                  </Pressable>
                </View>

                <View style={styles.searchContainer}>
                  <Ionicons 
                    name="search" 
                    size={20} 
                    color={cupidTheme.colors.textMuted} 
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={`Search ${selectedBorough} neighborhoods...`}
                    placeholderTextColor={cupidTheme.colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <Pressable 
                      onPress={() => setSearchQuery('')}
                      style={styles.clearSearchButton}
                    >
                      <Ionicons 
                        name="close-circle" 
                        size={20} 
                        color={cupidTheme.colors.textMuted} 
                      />
                    </Pressable>
                  )}
                </View>

                <ScrollView 
                  style={styles.neighborhoodList} 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredNeighborhoods.length > 0 ? (
                    filteredNeighborhoods.map((neighborhood) => {
                      const fullLocation = `${selectedBorough} - ${neighborhood}`;
                      const isSelected = value === fullLocation;
                      return (
                        <Pressable
                          key={neighborhood}
                          style={[
                            styles.neighborhoodButton,
                            isSelected && styles.neighborhoodButtonSelected
                          ]}
                          onPress={() => handleSelectLocation(fullLocation)}
                        >
                          <Text style={[
                            styles.neighborhoodText,
                            isSelected && styles.neighborhoodTextSelected
                          ]}>
                            {neighborhood}
                          </Text>
                          {isSelected && (
                            <Ionicons 
                              name="checkmark-circle" 
                              size={22} 
                              color={cupidTheme.colors.accent} 
                            />
                          )}
                        </Pressable>
                      );
                    })
                  ) : (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        No neighborhoods found matching "{searchQuery}"
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: cupidTheme.radii.lg,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    minHeight: 50,
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: cupidTheme.colors.textPrimary,
    marginRight: 8,
  },
  pickerPlaceholder: {
    color: cupidTheme.colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: cupidTheme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    ...cardShadow('floating'),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: cupidTheme.colors.borderSubtle,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 12,
  },
  boroughList: {
    maxHeight: 500,
  },
  boroughButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: cupidTheme.colors.borderSubtle,
  },
  boroughText: {
    fontSize: 18,
    fontWeight: '600',
    color: cupidTheme.colors.textPrimary,
  },
  backButtonContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: cupidTheme.colors.borderSubtle,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: cupidTheme.colors.accent,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: cupidTheme.colors.borderSubtle,
    backgroundColor: cupidTheme.colors.surfaceMuted,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: cupidTheme.colors.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: cupidTheme.radii.md,
    backgroundColor: cupidTheme.colors.surface,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  neighborhoodList: {
    maxHeight: 400,
  },
  neighborhoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: cupidTheme.colors.borderSubtle,
  },
  neighborhoodButtonSelected: {
    backgroundColor: cupidTheme.colors.accentSoft,
  },
  neighborhoodText: {
    fontSize: 16,
    color: cupidTheme.colors.textPrimary,
    flex: 1,
  },
  neighborhoodTextSelected: {
    fontWeight: '600',
    color: cupidTheme.colors.accent,
  },
  noResultsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: cupidTheme.colors.textMuted,
    textAlign: 'center',
  },
  clearButton: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: cupidTheme.colors.borderSubtle,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: cupidTheme.colors.error,
  },
});
