import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BackButton from '../../components/BackButton';
import DeadlinePicker from '../../components/DeadlinePicker';
import Press from '../../components/Press';
import Screen from '../../components/Screen';
import { createGoal, getGoal, updateGoal } from '../../lib/api';
import { goBack } from '../../lib/nav';
import { Theme, useTheme } from '../../theme';

export default function FormularioObjetivo() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [loading, setLoading] = useState(editingId !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // al editar, se rellena con los datos actuales
  useEffect(() => {
    if (editingId === null) return;
    getGoal(editingId)
      .then((g) => {
        setTitle(g.title);
        setDescription(g.description ?? '');
        setDeadline(g.targetDate);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se ha podido cargar el objetivo.'))
      .finally(() => setLoading(false));
  }, [editingId]);

  const valid = title.trim().length > 0;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    const body = {
      title: title.trim(),
      description: description.trim() || undefined,
      targetDate: deadline ?? undefined,
    };
    try {
      if (editingId === null) await createGoal(body);
      else await updateGoal(editingId, body);
      goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido guardar el objetivo.');
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = (name: string) => [styles.field, focus === name && styles.fieldFocused];
  const focusProps = (name: string) => ({
    onFocus: () => setFocus(name),
    onBlur: () => setFocus(null),
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <BackButton />
          </View>

          <Text style={styles.heading}>{editingId === null ? 'Nuevo objetivo' : 'Editar objetivo'}</Text>
          <Text style={styles.lead}>Define qué quieres conseguir y para cuándo.</Text>

          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : (
            <>
              <Text style={styles.label}>Título</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Aprobar el B2 de inglés"
                placeholderTextColor={colors.muted}
                maxLength={200}
                returnKeyType="next"
                style={fieldStyle('title')}
                {...focusProps('title')}
              />

              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Por qué lo quieres y qué significa conseguirlo"
                placeholderTextColor={colors.muted}
                multiline
                style={[fieldStyle('description'), styles.multiline]}
                {...focusProps('description')}
              />

              <Text style={styles.label}>Fecha límite</Text>
              <DeadlinePicker value={deadline} onChange={setDeadline} />
            </>
          )}

          {error && (
            <View style={styles.error}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Press
            onPress={save}
            disabled={!valid || saving || loading}
            containerStyle={styles.saveSlot}
            style={[styles.save, (!valid || saving || loading) && styles.saveOff]}
          >
            <LinearGradient
              colors={[colors.accent, colors.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar objetivo'}</Text>
          </Press>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 48 },
    topBar: { paddingTop: 12 },
    heading: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8, color: c.ink, marginTop: 18 },
    lead: { fontSize: 16, color: c.muted, marginTop: 4, marginBottom: 6 },
    loader: { marginTop: 40 },

    label: { fontSize: 14, fontWeight: '600', color: c.muted, marginTop: 24, marginBottom: 8 },
    field: {
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.hairline,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 17,
      color: c.ink,
    },
    fieldFocused: { borderColor: c.accent },
    multiline: { minHeight: 96, textAlignVertical: 'top' },

    error: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.danger + '55',
      padding: 14,
      marginTop: 24,
    },
    errorText: { flex: 1, fontSize: 14, lineHeight: 20, color: c.ink },

    saveSlot: { marginTop: 32 },
    save: {
      height: 56,
      borderRadius: 16,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveOff: { opacity: 0.4 },
    saveText: { fontSize: 17, fontWeight: '700', color: c.onAccent },
  });