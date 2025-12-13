import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cupidTheme } from '@/constants/theme';
import { ALL_NEIGHBORHOODS } from '@/constants/nycNeighborhoods';

export type FunQuestionsAnswers = {
  dogVsCat?: 'dog' | 'cat' | 'both' | 'neither' | string | string[]; // Support single or array for backward compatibility
  favoriteNYCSpot?: string | string[];
  idealFirstDate?: string | string[];
  biggestTurnOn?: string | string[];
  biggestRedFlag?: string | string[];
  loveLanguage?: string | string[];
  favoriteSeason?: string | string[];
  goToDrink?: string | string[];
};

type FunQuestionsProps = {
  answers: FunQuestionsAnswers;
  onChange: (answers: FunQuestionsAnswers) => void;
  disabled?: boolean;
};

const IDEAL_FIRST_DATE_OPTIONS = [
  'Coffee shop',
  'Museum',
  'Park walk',
  'Rooftop bar',
  'Comedy show',
  'Concert',
  'Dinner',
  'Brunch',
  'Art gallery',
  'Beach',
  'Bookstore',
  'Rooftop picnic',
  'Food market',
  'Sunset spot',
];

const BIGGEST_TURN_ON_OPTIONS = [
  'Good sense of humor',
  'Intelligence',
  'Confidence',
  'Kindness',
  'Ambition',
  'Creativity',
  'Adventurous spirit',
  'Great style',
  'Good listener',
  'Passion for something',
];

const BIGGEST_RED_FLAG_OPTIONS = [
  'Bad communication',
  'Rude to waitstaff',
  'Constantly on phone',
  'No ambition',
  'Disrespectful',
  'Self-centered',
  'Too clingy',
  'Jealousy issues',
  'No sense of humor',
  'Poor hygiene',
];

const LOVE_LANGUAGES = [
  'Words of Affirmation',
  'Quality Time',
  'Physical Touch',
  'Acts of Service',
  'Gift Giving',
];

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

const DRINKS = [
  'Coffee',
  'Wine',
  'Cocktail',
  'Beer',
  'Tea',
  'Matcha',
  'Whiskey',
  'Mocktail',
];

// Extract QuestionSection as a separate component to prevent remounting on every keystroke
type QuestionSectionProps = {
  id: string;
  title: string;
  emoji: string;
  options?: string[];
  answer?: string | string[];
  allowCustom?: boolean;
  disabled?: boolean;
  isExpanded: boolean;
  searchQuery: string;
  customAnswer: string;
  isCustomMode: boolean;
  onToggle: () => void;
  onSearchChange: (text: string) => void;
  onSelect: (value: string) => void;
  onRemove: (value: string) => void;
  onEnableCustomMode: () => void;
  onUpdateCustomAnswer: (text: string) => void;
  onBackToOptions: () => void;
};

const QuestionSection = memo(function QuestionSection({
  id,
  title,
  emoji,
  options,
  answer,
  allowCustom = true,
  disabled = false,
  isExpanded,
  searchQuery,
  customAnswer,
  isCustomMode,
  onToggle,
  onSearchChange,
  onSelect,
  onRemove,
  onEnableCustomMode,
  onUpdateCustomAnswer,
  onBackToOptions,
}: QuestionSectionProps) {
  // Normalize answer to array format
  const selectedAnswers = useMemo(() => {
    if (!answer) return [];
    if (Array.isArray(answer)) return answer;
    return [answer];
  }, [answer]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!options || !searchQuery.trim()) return options || [];
    const query = searchQuery.toLowerCase().trim();
    return options.filter(option => option.toLowerCase().includes(query));
  }, [options, searchQuery]);

  // Check if search query doesn't match any preset options and should be shown as custom option
  const showCustomOption = useMemo(() => {
    if (!searchQuery.trim() || !options) return false;
    const query = searchQuery.trim();
    // Don't show if it exactly matches a preset option (case-insensitive)
    const exactMatch = options.some(opt => opt.toLowerCase().trim() === query.toLowerCase());
    // Don't show if it matches any filtered option
    const matchesFiltered = filteredOptions.length > 0;
    return !exactMatch && !matchesFiltered;
  }, [searchQuery, options, filteredOptions]);

  // Convert stored values to display format (for dogVsCat)
  const getDisplayValue = useCallback((value: string) => {
    if (id === 'dogVsCat') {
      if (value === 'dog') return 'Dog person';
      if (value === 'cat') return 'Cat person';
      if (value === 'both') return 'Both!';
      if (value === 'neither') return 'Neither';
    }
    return value;
  }, [id]);

  const isAnswerSelected = useCallback((option: string) => {
    return selectedAnswers.some(ans => {
      const displayValue = getDisplayValue(ans);
      return displayValue === option || ans === option;
    });
  }, [selectedAnswers, getDisplayValue]);

  const isCustomAnswer = useCallback((value: string) => {
    if (id === 'dogVsCat') {
      const presetValues = ['dog', 'cat', 'both', 'neither'];
      return !presetValues.includes(value) && !['Dog person', 'Cat person', 'Both!', 'Neither'].includes(value);
    }
    return options ? !options.includes(value) : false;
  }, [id, options]);

  const isEditable = !disabled && !isCustomMode;

  return (
    <View style={styles.questionSection}>
      <Pressable 
        style={styles.questionHeader}
        onPress={onToggle}
        disabled={disabled}
      >
        <View style={styles.questionHeaderLeft}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.questionTitle}>{title}</Text>
        </View>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={cupidTheme.colors.textMuted} 
        />
      </Pressable>
      
      {isExpanded && (
        <View style={styles.optionsContainer}>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons 
              name="search" 
              size={18} 
              color={cupidTheme.colors.textMuted} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search options...`}
              placeholderTextColor={cupidTheme.colors.textMuted}
              value={searchQuery}
              onChangeText={onSearchChange}
              editable={isEditable}
              autoCapitalize="words"
              blurOnSubmit={false}
              returnKeyType="search"
              autoCorrect={false}
              textContentType="none"
            />
            {searchQuery.length > 0 && (
              <Pressable 
                onPress={() => onSearchChange('')}
                style={styles.clearSearchButton}
              >
                <Ionicons 
                  name="close-circle" 
                  size={18} 
                  color={cupidTheme.colors.textMuted} 
                />
              </Pressable>
            )}
          </View>

          {/* Selected Answers Display */}
          {selectedAnswers.length > 0 && (
            <View style={styles.selectedAnswersContainer}>
              {selectedAnswers.map((ans, idx) => {
                const displayValue = getDisplayValue(ans);
                // Use a stable key
                const uniqueKey = `${ans}-${idx}`;
                return (
                  <View key={uniqueKey} style={styles.selectedAnswerChip}>
                    <Text style={styles.selectedAnswerText}>{displayValue}</Text>
                    <Pressable
                      onPress={() => onRemove(displayValue)}
                      style={styles.removeButton}
                      disabled={disabled}
                    >
                      <Ionicons 
                        name="close-circle" 
                        size={18} 
                        color={cupidTheme.colors.textMuted} 
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          {/* Options List */}
          {!isCustomMode && (
            <>
              {/* Show filtered preset options */}
              {filteredOptions.length > 0 && (
                filteredOptions.map((option) => {
                  const isSelected = isAnswerSelected(option);
                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected
                      ]}
                      onPress={() => onSelect(option)}
                      disabled={disabled}
                    >
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected
                      ]}>
                        {option}
                      </Text>
                      {isSelected && (
                        <Ionicons 
                          name="checkmark-circle" 
                          size={20} 
                          color={cupidTheme.colors.accent} 
                        />
                      )}
                    </Pressable>
                  );
                })
              )}
              
              {/* Show typed text as selectable option if it doesn't match any preset */}
              {showCustomOption && !selectedAnswers.includes(searchQuery.trim()) && (
                <Pressable
                  key={`custom-${searchQuery}`}
                  style={[
                    styles.optionButton,
                    styles.customOptionButton,
                    isAnswerSelected(searchQuery.trim()) && styles.optionButtonSelected
                  ]}
                  onPress={() => onSelect(searchQuery.trim())}
                  disabled={disabled}
                >
                  <View style={styles.customOptionContent}>
                    <Ionicons 
                      name="create-outline" 
                      size={18} 
                      color={cupidTheme.colors.accent} 
                      style={styles.customOptionIcon}
                    />
                    <Text style={[
                      styles.optionText,
                      isAnswerSelected(searchQuery.trim()) && styles.optionTextSelected
                    ]}>
                      {searchQuery.trim()}
                    </Text>
                  </View>
                  {isAnswerSelected(searchQuery.trim()) && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={20} 
                      color={cupidTheme.colors.accent} 
                    />
                  )}
                </Pressable>
              )}

              {/* Show message if no results and no custom option to show */}
              {filteredOptions.length === 0 && !showCustomOption && searchQuery.trim() && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    Type to create a custom answer
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Custom Answer Input */}
          {isCustomMode && (
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                placeholder="Enter your custom answer..."
                placeholderTextColor={cupidTheme.colors.textMuted}
                value={customAnswer || (isAnswerCustom && answer ? answer : '')}
                onChangeText={onUpdateCustomAnswer}
                editable={!disabled}
                autoCapitalize="words"
                multiline={false}
                maxLength={100}
              />
              <Pressable
                style={styles.backToOptionsButton}
                onPress={onBackToOptions}
              >
                <Text style={styles.backToOptionsText}>Back to options</Text>
              </Pressable>
            </View>
          )}

        </View>
      )}
      
      {selectedAnswers.length > 0 && !isExpanded && (
        <View style={styles.answerPreview}>
          <Text style={styles.answerPreviewText} numberOfLines={1}>
            {selectedAnswers.map(ans => getDisplayValue(ans)).join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
});

export function FunQuestions({ answers, onChange, disabled = false }: FunQuestionsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [useCustomMode, setUseCustomMode] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    if (disabled) return;
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Toggle answer in array (add if not present, remove if present)
  const toggleAnswer = useCallback((key: keyof FunQuestionsAnswers, value: string) => {
    const current = answers[key];
    let currentArray: string[] = [];
    
    if (Array.isArray(current)) {
      currentArray = current;
    } else if (current) {
      currentArray = [current];
    }

    // For dogVsCat, normalize the value before storing
    let valueToStore = value;
    if (key === 'dogVsCat') {
      // Convert display format back to stored format
      if (value === 'Dog person') valueToStore = 'dog';
      else if (value === 'Cat person') valueToStore = 'cat';
      else if (value === 'Both!') valueToStore = 'both';
      else if (value === 'Neither') valueToStore = 'neither';
    }

    const isSelected = currentArray.includes(valueToStore) || currentArray.includes(value);
    let newArray: string[];
    
    if (isSelected) {
      // Remove if already selected
      newArray = currentArray.filter(
        ans => ans !== valueToStore && ans !== value && 
        (key !== 'dogVsCat' || (ans !== 'Dog person' && ans !== 'Cat person' && ans !== 'Both!' && ans !== 'Neither'))
      );
    } else {
      // Add if not selected
      newArray = [...currentArray, valueToStore];
    }

    onChange({ ...answers, [key]: newArray.length === 0 ? undefined : newArray.length === 1 ? newArray[0] : newArray });
    // Clear search after selection
    setSearchQueries((prev) => ({ ...prev, [key]: '' }));
    setUseCustomMode((prev) => ({ ...prev, [key]: false }));
  }, [answers, onChange]);

  const removeAnswer = useCallback((key: keyof FunQuestionsAnswers, displayValue: string) => {
    const current = answers[key];
    if (!current) return;

    let currentArray: string[] = [];
    if (Array.isArray(current)) {
      currentArray = current;
    } else {
      currentArray = [current];
    }

    // For dogVsCat, convert display value to stored value for comparison
    let valueToRemove: string | null = null;
    if (key === 'dogVsCat') {
      if (displayValue === 'Dog person') valueToRemove = 'dog';
      else if (displayValue === 'Cat person') valueToRemove = 'cat';
      else if (displayValue === 'Both!') valueToRemove = 'both';
      else if (displayValue === 'Neither') valueToRemove = 'neither';
      else valueToRemove = displayValue; // Custom answer
    } else {
      valueToRemove = displayValue;
    }

    // Remove both stored format and display format (for backward compatibility)
    const newArray = currentArray.filter(ans => {
      // Convert stored answer to display format for comparison
      if (key === 'dogVsCat') {
        let storedAsDisplay = ans;
        if (ans === 'dog') storedAsDisplay = 'Dog person';
        else if (ans === 'cat') storedAsDisplay = 'Cat person';
        else if (ans === 'both') storedAsDisplay = 'Both!';
        else if (ans === 'neither') storedAsDisplay = 'Neither';
        return storedAsDisplay !== displayValue && ans !== displayValue && ans !== valueToRemove;
      }
      return ans !== displayValue && ans !== valueToRemove;
    });

    onChange({ ...answers, [key]: newArray.length === 0 ? undefined : newArray.length === 1 ? newArray[0] : newArray });
  }, [answers, onChange]);

  const updateCustomAnswer = useCallback((key: keyof FunQuestionsAnswers, value: string) => {
    setCustomAnswers((prev) => ({ ...prev, [key]: value }));
    if (value.trim()) {
      onChange({ ...answers, [key]: value.trim() });
    }
  }, [answers, onChange]);

  const enableCustomMode = useCallback((key: keyof FunQuestionsAnswers) => {
    setUseCustomMode((prev) => ({ ...prev, [key]: true }));
    setSearchQueries((prev) => ({ ...prev, [key]: '' }));
  }, []);

  // Create stable search change handlers - memoized per key to prevent re-renders
  const searchHandlers = useMemo(() => {
    const handlers: Record<string, (text: string) => void> = {};
    const questionKeys = ['dogVsCat', 'favoriteNYCSpot', 'idealFirstDate', 'biggestTurnOn', 'biggestRedFlag', 'loveLanguage', 'favoriteSeason', 'goToDrink'];
    questionKeys.forEach((key) => {
      handlers[key] = (text: string) => {
        setSearchQueries((prev) => ({ ...prev, [key]: text }));
      };
    });
    return handlers;
  }, []); // Empty deps - handlers use functional updates so they're stable

  // Disable custom mode when search query becomes non-empty (using useEffect to avoid blocking input)
  useEffect(() => {
    Object.keys(searchQueries).forEach((key) => {
      if (searchQueries[key]) {
        // Only update if custom mode is actually enabled for this key
        setUseCustomMode((prev) => {
          if (prev[key]) {
            return { ...prev, [key]: false };
          }
          return prev;
        });
      }
    });
  }, [searchQueries]); // Only depend on searchQueries, use functional update for useCustomMode


  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
    >
      <Text style={styles.sectionTitle}>Fun Questions 🔥</Text>
      <Text style={styles.sectionSubtitle}>
        Help others get to know the real you with these fun prompts
      </Text>

      <QuestionSection
        id="dogVsCat"
        title="Dog person or cat person?"
        emoji="🐕"
        options={['Dog person', 'Cat person', 'Both!', 'Neither']}
        answer={answers.dogVsCat}
        disabled={disabled}
        isExpanded={expandedSections.has('dogVsCat')}
        searchQuery={searchQueries['dogVsCat'] || ''}
        customAnswer={customAnswers['dogVsCat'] || ''}
        isCustomMode={useCustomMode['dogVsCat'] || false}
        onToggle={() => toggleSection('dogVsCat')}
        onSearchChange={searchHandlers.dogVsCat}
        onSelect={(value) => toggleAnswer('dogVsCat', value)}
        onRemove={(value) => removeAnswer('dogVsCat', value)}
        onEnableCustomMode={() => enableCustomMode('dogVsCat')}
        onUpdateCustomAnswer={(text) => updateCustomAnswer('dogVsCat', text)}
        onBackToOptions={() => setUseCustomMode((prev) => ({ ...prev, 'dogVsCat': false }))}
      />

      <QuestionSection
        id="favoriteNYCSpot"
        title="Favorite NYC spot for a vibe?"
        emoji="🗽"
        options={ALL_NEIGHBORHOODS.map(n => n.split(' - ')[1])}
        answer={answers.favoriteNYCSpot}
        disabled={disabled}
        isExpanded={expandedSections.has('favoriteNYCSpot')}
        searchQuery={searchQueries['favoriteNYCSpot'] || ''}
        customAnswer={customAnswers['favoriteNYCSpot'] || ''}
        isCustomMode={useCustomMode['favoriteNYCSpot'] || false}
        onToggle={() => toggleSection('favoriteNYCSpot')}
        onSearchChange={searchHandlers.favoriteNYCSpot}
        onSelect={(value) => toggleAnswer('favoriteNYCSpot', value)}
        onRemove={(value) => removeAnswer('favoriteNYCSpot', value)}
        onEnableCustomMode={() => enableCustomMode('favoriteNYCSpot')}
        onUpdateCustomAnswer={(text) => updateCustomAnswer('favoriteNYCSpot', text)}
        onBackToOptions={() => setUseCustomMode((prev) => ({ ...prev, 'favoriteNYCSpot': false }))}
      />

      <QuestionSection
        id="idealFirstDate"
        title="Ideal first date?"
        emoji="💕"
        options={IDEAL_FIRST_DATE_OPTIONS}
        answer={answers.idealFirstDate}
        disabled={disabled}
        isExpanded={expandedSections.has('idealFirstDate')}
        searchQuery={searchQueries['idealFirstDate'] || ''}
        customAnswer={customAnswers['idealFirstDate'] || ''}
        isCustomMode={useCustomMode['idealFirstDate'] || false}
        onToggle={() => toggleSection('idealFirstDate')}
        onSearchChange={searchHandlers.idealFirstDate}
        onSelect={(value) => toggleAnswer('idealFirstDate', value)}
        onRemove={(value) => removeAnswer('idealFirstDate', value)}
        onEnableCustomMode={() => enableCustomMode('idealFirstDate')}
        onUpdateCustomAnswer={(text) => updateCustomAnswer('idealFirstDate', text)}
        onBackToOptions={() => setUseCustomMode((prev) => ({ ...prev, 'idealFirstDate': false }))}
      />

      <QuestionSection
        id="biggestTurnOn"
        title="Biggest turn-on?"
        emoji="🔥"
        options={BIGGEST_TURN_ON_OPTIONS}
        answer={answers.biggestTurnOn}
        disabled={disabled}
        isExpanded={expandedSections.has('biggestTurnOn')}
        searchQuery={searchQueries['biggestTurnOn'] || ''}
        customAnswer={customAnswers['biggestTurnOn'] || ''}
        isCustomMode={useCustomMode['biggestTurnOn'] || false}
        onToggle={() => toggleSection('biggestTurnOn')}
        onSearchChange={searchHandlers.biggestTurnOn}
        onSelect={(value) => toggleAnswer('biggestTurnOn', value)}
        onRemove={(value) => removeAnswer('biggestTurnOn', value)}
        onEnableCustomMode={() => enableCustomMode('biggestTurnOn')}
        onUpdateCustomAnswer={(text) => updateCustomAnswer('biggestTurnOn', text)}
        onBackToOptions={() => setUseCustomMode((prev) => ({ ...prev, 'biggestTurnOn': false }))}
      />

      <QuestionSection
        id="biggestRedFlag"
        title="Biggest red flag?"
        emoji="🚩"
        options={BIGGEST_RED_FLAG_OPTIONS}
        answer={answers.biggestRedFlag}
        disabled={disabled}
        isExpanded={expandedSections.has('biggestRedFlag')}
        searchQuery={searchQueries['biggestRedFlag'] || ''}
        customAnswer={customAnswers['biggestRedFlag'] || ''}
        isCustomMode={useCustomMode['biggestRedFlag'] || false}
        onToggle={() => toggleSection('biggestRedFlag')}
        onSearchChange={searchHandlers.biggestRedFlag}
        onSelect={(value) => toggleAnswer('biggestRedFlag', value)}
        onRemove={(value) => removeAnswer('biggestRedFlag', value)}
        onEnableCustomMode={() => enableCustomMode('biggestRedFlag')}
        onUpdateCustomAnswer={(text) => updateCustomAnswer('biggestRedFlag', text)}
        onBackToOptions={() => setUseCustomMode((prev) => ({ ...prev, 'biggestRedFlag': false }))}
      />

      <QuestionSection
        id="loveLanguage"
        title="Love language?"
        emoji="💝"
        options={LOVE_LANGUAGES}
        answer={answers.loveLanguage}
        disabled={disabled}
        isExpanded={expandedSections.has('loveLanguage')}
        searchQuery={searchQueries['loveLanguage'] || ''}
        customAnswer={customAnswers['loveLanguage'] || ''}
        isCustomMode={useCustomMode['loveLanguage'] || false}
        onToggle={() => toggleSection('loveLanguage')}
        onSearchChange={searchHandlers.loveLanguage}
        onSelect={(value) => toggleAnswer('loveLanguage', value)}
        onRemove={(value) => removeAnswer('loveLanguage', value)}
        onEnableCustomMode={() => enableCustomMode('loveLanguage')}
        onUpdateCustomAnswer={(text) => updateCustomAnswer('loveLanguage', text)}
        onBackToOptions={() => setUseCustomMode((prev) => ({ ...prev, 'loveLanguage': false }))}
      />

      <QuestionSection
        id="favoriteSeason"
        title="Favorite season?"
        emoji="🍂"
        options={SEASONS}
        answer={answers.favoriteSeason}
        disabled={disabled}
        isExpanded={expandedSections.has('favoriteSeason')}
        searchQuery={searchQueries['favoriteSeason'] || ''}
        customAnswer={customAnswers['favoriteSeason'] || ''}
        isCustomMode={useCustomMode['favoriteSeason'] || false}
        onToggle={() => toggleSection('favoriteSeason')}
        onSearchChange={searchHandlers.favoriteSeason}
        onSelect={(value) => toggleAnswer('favoriteSeason', value)}
        onRemove={(value) => removeAnswer('favoriteSeason', value)}
        onEnableCustomMode={() => enableCustomMode('favoriteSeason')}
        onUpdateCustomAnswer={(text) => updateCustomAnswer('favoriteSeason', text)}
        onBackToOptions={() => setUseCustomMode((prev) => ({ ...prev, 'favoriteSeason': false }))}
      />

      <QuestionSection
        id="goToDrink"
        title="Go-to drink?"
        emoji="🥂"
        options={DRINKS}
        answer={answers.goToDrink}
        disabled={disabled}
        isExpanded={expandedSections.has('goToDrink')}
        searchQuery={searchQueries['goToDrink'] || ''}
        customAnswer={customAnswers['goToDrink'] || ''}
        isCustomMode={useCustomMode['goToDrink'] || false}
        onToggle={() => toggleSection('goToDrink')}
        onSearchChange={searchHandlers.goToDrink}
        onSelect={(value) => toggleAnswer('goToDrink', value)}
        onRemove={(value) => removeAnswer('goToDrink', value)}
        onEnableCustomMode={() => enableCustomMode('goToDrink')}
        onUpdateCustomAnswer={(text) => updateCustomAnswer('goToDrink', text)}
        onBackToOptions={() => setUseCustomMode((prev) => ({ ...prev, 'goToDrink': false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: cupidTheme.colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: cupidTheme.colors.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },
  questionSection: {
    marginBottom: 12,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderRadius: cupidTheme.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  questionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emoji: {
    fontSize: 24,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: cupidTheme.colors.textPrimary,
    flex: 1,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cupidTheme.colors.surface,
    borderRadius: cupidTheme.radii.md,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: cupidTheme.colors.textPrimary,
    padding: 0,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: cupidTheme.colors.surface,
  },
  customOptionButton: {
    borderWidth: 1,
    borderColor: cupidTheme.colors.accent,
    borderStyle: 'dashed',
    backgroundColor: cupidTheme.colors.accentSoft,
  },
  customOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customOptionIcon: {
    marginRight: 8,
  },
  optionButtonSelected: {
    backgroundColor: cupidTheme.colors.accentSoft,
    borderColor: cupidTheme.colors.accent,
  },
  optionText: {
    fontSize: 15,
    color: cupidTheme.colors.textPrimary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: cupidTheme.colors.accent,
    fontWeight: '700',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: cupidTheme.colors.textMuted,
    textAlign: 'center',
  },
  customInputContainer: {
    gap: 8,
    marginTop: 4,
  },
  customInput: {
    padding: 14,
    backgroundColor: cupidTheme.colors.surface,
    borderRadius: cupidTheme.radii.md,
    borderWidth: 1,
    borderColor: cupidTheme.colors.accent,
    fontSize: 15,
    color: cupidTheme.colors.textPrimary,
    minHeight: 50,
  },
  backToOptionsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  backToOptionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: cupidTheme.colors.textMuted,
  },
  customAnswerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: cupidTheme.colors.accentSoft,
    borderRadius: cupidTheme.radii.md,
    borderWidth: 1,
    borderColor: cupidTheme.colors.accent,
    marginTop: 4,
  },
  customAnswerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: cupidTheme.colors.textSecondary,
  },
  customAnswerValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: cupidTheme.colors.accent,
  },
  editCustomButton: {
    padding: 4,
  },
  selectedAnswersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectedAnswerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cupidTheme.colors.accentSoft,
    borderRadius: cupidTheme.radii.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: cupidTheme.colors.accent,
    gap: 6,
  },
  selectedAnswerText: {
    fontSize: 14,
    fontWeight: '600',
    color: cupidTheme.colors.accent,
  },
  removeButton: {
    padding: 2,
  },
  answerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  answerPreviewText: {
    fontSize: 14,
    color: cupidTheme.colors.accent,
    fontWeight: '600',
    flex: 1,
  },
});
