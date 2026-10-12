
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { chatWithMentor } from '../lib/api';
import { Theme, useTheme } from '../theme';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export default function ChatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '¡Hola! Soy Mentor, tu asistente personal. Puedo ayudarte a organizar tu día, priorizar tareas y mejorar tu productividad. ¿Qué necesitas?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  async function sendMessage() {
    const message = input.trim();

    if (!message || loading) return;

    setInput('');
    setError('');
    setLoading(true);

    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-user`,
        role: 'user',
        text: message,
      },
    ]);

    try {
      const response = await chatWithMentor(message);

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: response.reply,
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se ha podido obtener una respuesta. Inténtalo de nuevo.',
      );
      setInput(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={23} color={colors.ink} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>Mentor AI</Text>
          <Text style={styles.subtitle}>Tu asistente personal</Text>
        </View>

        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={22} color={colors.onAccent} />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.conversation}
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => {
          const isUser = message.role === 'user';

          return (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                isUser && styles.userRow,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser && styles.userMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={styles.messageRow}>
            <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>Mentor está pensando...</Text>
            </View>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
            <View style={styles.errorContent}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={sendMessage}>
                <Text style={styles.retryText}>Reintentar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
          maxLength={4000}
          editable={!loading}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
          accessibilityLabel="Mensaje para Mentor"
        />

        <Pressable
          onPress={sendMessage}
          disabled={!input.trim() || loading}
          style={[
            styles.sendButton,
            (!input.trim() || loading) && styles.sendButtonDisabled,
          ]}
          accessibilityLabel="Enviar mensaje"
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <Ionicons name="send" size={20} color={colors.onAccent} />
          )}
        </Pressable>
      </View>

      <Text style={styles.disclaimer}>
        Las respuestas de la IA pueden contener errores.
      </Text>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.paper,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: c.ink,
      fontSize: 19,
      fontWeight: '700',
    },
    subtitle: {
      color: c.muted,
      fontSize: 13,
      marginTop: 2,
    },
    aiIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    conversation: {
      flex: 1,
    },
    messages: {
      padding: 18,
      gap: 14,
      paddingBottom: 24,
    },
    messageRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    userRow: {
      justifyContent: 'flex-end',
    },
    bubble: {
      maxWidth: '88%',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 19,
    },
    assistantBubble: {
      backgroundColor: c.surface,
      borderBottomLeftRadius: 5,
    },
    userBubble: {
      backgroundColor: c.accent,
      borderBottomRightRadius: 5,
    },
    messageText: {
      color: c.ink,
      fontSize: 15,
      lineHeight: 22,
    },
    userMessageText: {
      color: c.onAccent,
    },
    loadingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    loadingText: {
      color: c.muted,
      fontSize: 13,
    },
    errorBox: {
      flexDirection: 'row',
      gap: 10,
      padding: 13,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.danger,
    },
    errorContent: {
      flex: 1,
      gap: 8,
    },
    errorText: {
      color: c.ink,
      fontSize: 13,
      lineHeight: 19,
    },
    retryText: {
      color: c.accent,
      fontWeight: '700',
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.hairline,
    },
    input: {
      flex: 1,
      minHeight: 48,
      maxHeight: 120,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 22,
      backgroundColor: c.surface,
      color: c.ink,
      fontSize: 15,
      borderWidth: 1,
      borderColor: c.hairline,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    disclaimer: {
      color: c.muted,
      fontSize: 11,
      textAlign: 'center',
      paddingBottom: 8,
      paddingHorizontal: 12,
    },
  });
