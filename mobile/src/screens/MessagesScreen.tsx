import { ScreenContainer } from '@/components/ScreenContainer';
import { useApiClient } from '@/hooks/useApiClient';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ThreadItem {
  matchId: string;
  peer: {
    id: string;
    displayName: string;
    bio: string;
  };
  lastMessage: {
    id: string;
    text: string;
    sentAt: string;
  } | null;
}

export function MessagesScreen() {
  const api = useApiClient();
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<ThreadItem | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/matches/inbox');
      const data = await response.json();
      setThreads(data.items ?? []);
    } catch (error) {
      console.warn('Failed to load inbox', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  async function sendMessage() {
    if (!selectedMatch || !message.trim()) return;
    const text = message.trim();
    setMessage('');
    try {
      const response = await api.post(`/api/matches/${selectedMatch.matchId}/messages`, { text });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? 'Failed to send message');
      }
      fetchThreads();
    } catch (error) {
      setMessage(text);
      console.warn('Send message failed', error);
    }
  }

  return (
    <ScreenContainer>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#F472B6" />
        </View>
      ) : (
        <>
          <FlatList
            data={threads}
            keyExtractor={(item) => item.matchId}
            refreshing={loading}
            onRefresh={fetchThreads}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.thread, selectedMatch?.matchId === item.matchId && styles.threadActive]} onPress={() => setSelectedMatch(item)}>
                <Text style={styles.title}>{item.peer.displayName}</Text>
                <Text style={styles.preview}>{item.lastMessage?.text ?? 'No messages yet'}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Like someone and match to start chatting.</Text>}
          />
          {selectedMatch && (
            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder={`Message ${selectedMatch.peer.displayName}`}
                placeholderTextColor="#6B7280"
              />
              <TouchableOpacity style={styles.send} onPress={sendMessage}>
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thread: {
    padding: 16,
    backgroundColor: '#1F2028',
    borderRadius: 16,
    gap: 4,
  },
  threadActive: {
    borderWidth: 1,
    borderColor: '#F472B6',
  },
  title: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
  preview: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  separator: {
    height: 12,
  },
  empty: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 40,
  },
  composer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#272934',
    paddingHorizontal: 12,
    color: '#F9FAFB',
  },
  send: {
    backgroundColor: '#F472B6',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendText: {
    color: '#0B0B0D',
    fontWeight: '700',
  },
});
