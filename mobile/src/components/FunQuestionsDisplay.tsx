import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cupidTheme } from '@/constants/theme';
import { type FunQuestionsAnswers } from './FunQuestions';

type FunQuestionsDisplayProps = {
  answers: FunQuestionsAnswers;
  variant?: 'compact' | 'default' | 'detailed';
};

const QUESTION_EMOJIS: Record<keyof FunQuestionsAnswers, string> = {
  dogVsCat: '🐕',
  favoriteNYCSpot: '🗽',
  idealFirstDate: '💕',
  biggestTurnOn: '🔥',
  biggestRedFlag: '🚩',
  loveLanguage: '💝',
  favoriteSeason: '🍂',
  goToDrink: '🥂',
};

const QUESTION_LABELS: Record<keyof FunQuestionsAnswers, string> = {
  dogVsCat: 'Pet preference',
  favoriteNYCSpot: 'Favorite NYC spot',
  idealFirstDate: 'Ideal first date',
  biggestTurnOn: 'Biggest turn-on',
  biggestRedFlag: 'Biggest red flag',
  loveLanguage: 'Love language',
  favoriteSeason: 'Favorite season',
  goToDrink: 'Go-to drink',
};

export function FunQuestionsDisplay({ answers, variant = 'default' }: FunQuestionsDisplayProps) {
  // Filter out questions with no answers, handling both single values and arrays
  const answeredQuestions = Object.entries(answers).filter(([_, value]) => {
    if (!value) return false;
    if (Array.isArray(value)) {
      return value.length > 0 && value.some(v => v !== undefined && v !== null && v !== '');
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return true;
  }) as Array<[keyof FunQuestionsAnswers, string | string[]]>;

  if (answeredQuestions.length === 0) {
    return null;
  }

  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  const formatAnswer = (key: keyof FunQuestionsAnswers, value: string | string[]): string => {
    // Handle arrays - join multiple answers
    if (Array.isArray(value)) {
      const formatted = value.map(v => formatSingleAnswer(key, v)).filter(Boolean);
      return formatted.length > 0 ? formatted.join(', ') : '';
    }
    return formatSingleAnswer(key, value);
  };

  const formatSingleAnswer = (key: keyof FunQuestionsAnswers, value: string): string => {
    if (key === 'dogVsCat') {
      const normalized = value.toLowerCase().replace(' person', '').replace('!', '');
      if (normalized === 'both' || normalized === 'neither') {
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
      }
      return normalized.charAt(0).toUpperCase() + normalized.slice(1) + ' person';
    }
    return value;
  };

  // Show fewer questions in compact mode
  const questionsToShow = isCompact 
    ? answeredQuestions.slice(0, 3) 
    : isDetailed
    ? answeredQuestions
    : answeredQuestions.slice(0, 5);

  return (
    <View style={styles.container}>
      {questionsToShow.map(([key, value]) => (
        <View key={key} style={[styles.answerRow, isCompact && styles.answerRowCompact]}>
          <View style={styles.answerLeft}>
            <Text style={styles.emoji}>{QUESTION_EMOJIS[key]}</Text>
            <Text style={[styles.questionLabel, isCompact && styles.questionLabelCompact]} numberOfLines={1}>
              {QUESTION_LABELS[key]}:
            </Text>
          </View>
          <Text style={[styles.answerText, isCompact && styles.answerTextCompact]} numberOfLines={isCompact ? 1 : 2}>
            {formatAnswer(key, value)}
          </Text>
        </View>
      ))}
      {isDetailed && answeredQuestions.length > questionsToShow.length && (
        <Text style={styles.moreText}>+{answeredQuestions.length - questionsToShow.length} more</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginTop: 4,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: cupidTheme.colors.surfaceMuted,
    borderRadius: cupidTheme.radii.md,
    borderWidth: 1,
    borderColor: cupidTheme.colors.borderSubtle,
  },
  answerRowCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  answerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 140,
  },
  emoji: {
    fontSize: 18,
  },
  questionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: cupidTheme.colors.textSecondary,
  },
  questionLabelCompact: {
    fontSize: 12,
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: cupidTheme.colors.textPrimary,
  },
  answerTextCompact: {
    fontSize: 13,
  },
  moreText: {
    fontSize: 12,
    color: cupidTheme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});
