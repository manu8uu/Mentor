import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fmt, parseAmount } from '../lib/format';
import { iconFor } from '../lib/icons';
import type { Item } from '../store';
import { Theme, useTheme } from '../theme';
import Press from './Press';
import ProgressBar from './ProgressBar';

type Props = {
  item: Item | null;
  onClose: () => void;
  onAdd: (amount: number, note?: string) => void;
  onSubtract: (amount: number, note?: string) => void;
  onComplete: () => void;
  onDelete: (scope: 'day' | 'series') => void;
};

// atajos: 10 %, 25 % y 50 % de la meta, redondeados
function suggestions(target: number): number[] {
  const values = [0.1, 0.25, 0.5]
    .map((f) => target * f)
    .map((v) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10))
    .filter((v) => v > 0);
  return Array.from(new Set(values));
}

export default function TaskSheet({ item, onClose, onAdd, onSubtract, onComplete, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [focused, setFocused] = useState<'amount' | 'note' | null>(null);

  // conservamos el último dato para que el contenido no desaparezca mientras la hoja baja
  const last = useRef<Item | null>(null);
  if (item) last.current = item;
  const data = item ?? last.current;

  useEffect(() => {
    setText('');
    setNote('');
  }, [item?.id]);

  if (!data) return null;

  const amount = parseAmount(text);
  const cleanNote = note.trim() || undefined;
  const ratio = data.current / data.target;
  const done = ratio >= 1;
  const tone = done ? colors.done : colors.accent;
  const canSubtract = amount !== null && data.current > 0;

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

  const add = () => {
    if (amount === null) return;
    tap();
    onAdd(amount, cleanNote);
    onClose();
  };

  const subtract = () => {
    if (!canSubtract || amount === null) return;
    tap();
    onSubtract(amount, cleanNote);
    onClose();
  };

  const complete = () => {
    tap();
    onComplete();
    onClose();
  };

  // cierra la hoja y abre la pantalla de detalles cuando ya ha bajado
  const details = () => {
    onClose();
    setTimeout(() => router.push(`/task/${data.taskId}`), 250);
  };

  const confirmDelete = () => {
    const remove = (scope: 'day' | 'series') => () => {
      onDelete(scope);
      onClose();
    };

    // tarea ocasional: un solo aviso
    if (!data.repeat) {
      Alert.alert(`¿Eliminar «${data.title}»?`, 'Se borrará también su historial de progreso.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: remove('series') },
      ]);
      return;
    }

    // tarea recurrente: solo ese día o todos
    Alert.alert(
      `Eliminar «${data.title}»`,
      'Esta tarea se repite.\n\n' +
        'Solo este día: quita únicamente el día seleccionado.\n\n' +
        'Todos los días: la elimina desde hoy y conserva tu historial anterior.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Solo este día', onPress: remove('day') },
        { text: 'Todos los días', style: 'destructive', onPress: remove('series') },
      ],
    );
  };

  return (
    <Modal visible={item !== null} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.head}>
              <View style={[styles.tile, { backgroundColor: tone + '22' }]}>
                <Ionicons name={iconFor(data.title)} size={22} color={tone} />
              </View>
              <View style={styles.headTexts}>
                <Text style={styles.title} numberOfLines={1}>{data.title}</Text>
                {data.repeat ? <Text style={styles.repeat}>{data.repeat}</Text> : null}
              </View>
              <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.summary}>
              <Text style={styles.big}>
                {fmt(data.current)}
                <Text style={styles.bigUnit}> de {fmt(data.target)} {data.unit}</Text>
              </Text>
              <Text style={[styles.pct, { color: tone }]}>{Math.min(Math.round(ratio * 100), 100)} %</Text>
            </View>
            <ProgressBar progress={ratio} height={12} />

            <Text style={styles.label}>Cantidad</Text>
            <View style={[styles.inputWrap, focused === 'amount' && { borderColor: colors.accent }]}>
              <TextInput
                value={text}
                onChangeText={setText}
                onFocus={() => setFocused('amount')}
                onBlur={() => setFocused(null)}
                onSubmitEditing={add}
                keyboardType="decimal-pad"
                returnKeyType="done"
                placeholder="0"
                placeholderTextColor={colors.muted}
                accessibilityLabel={`Cantidad en ${data.unit}`}
                style={styles.input}
              />
              <Text style={styles.unit}>{data.unit}</Text>
            </View>

            <View style={styles.chips}>
              {suggestions(data.target).map((v) => (
                <Press
                  key={v}
                  onPress={() => setText(String(v).replace('.', ','))}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>{fmt(v)}</Text>
                </Press>
              ))}
            </View>

            <Text style={styles.label}>Nota (opcional)</Text>
            <View style={[styles.inputWrap, focused === 'note' && { borderColor: colors.accent }]}>
              <TextInput
                value={note}
                onChangeText={setNote}
                onFocus={() => setFocused('note')}
                onBlur={() => setFocused(null)}
                maxLength={255}
                returnKeyType="done"
                placeholder="Qué has hecho, cómo ha ido…"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Nota"
                style={styles.noteInput}
              />
            </View>

            <View style={styles.buttons}>
              <Press
                onPress={subtract}
                disabled={!canSubtract}
                containerStyle={styles.buttonSlot}
                style={[styles.button, styles.buttonGhost, !canSubtract && styles.off]}
              >
                <Ionicons name="remove" size={20} color={colors.ink} />
                <Text style={styles.buttonGhostText}>Restar</Text>
              </Press>
              <Press
                onPress={add}
                disabled={amount === null}
                containerStyle={styles.buttonSlot}
                style={[styles.button, amount === null && styles.off]}
              >
                <LinearGradient
                  colors={[colors.accent, colors.accent2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="add" size={20} color={colors.onAccent} />
                <Text style={styles.buttonText}>Añadir</Text>
              </Press>
            </View>

            <View style={styles.footer}>
              {!done && (
                <Pressable onPress={complete} style={styles.footerAction} hitSlop={6}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.done} />
                  <Text style={[styles.footerText, { color: colors.done }]}>Marcar como completada</Text>
                </Pressable>
              )}
              <Pressable onPress={details} style={styles.footerAction} hitSlop={6}>
                <Ionicons name="time-outline" size={20} color={colors.ink} />
                <Text style={[styles.footerText, { color: colors.ink }]}>Detalles e historial</Text>
              </Pressable>
              <Pressable onPress={confirmDelete} style={styles.footerAction} hitSlop={6}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                <Text style={[styles.footerText, { color: colors.danger }]}>Eliminar tarea</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
      maxHeight: '92%',
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 22,
      paddingTop: 10,
      paddingBottom: 30,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.hairline,
      marginBottom: 18,
    },

    head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    tile: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    headTexts: { flex: 1 },
    title: { fontSize: 20, fontWeight: '700', color: c.ink },
    repeat: { fontSize: 13, color: c.muted, marginTop: 2 },

    summary: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: 22,
      marginBottom: 12,
    },
    big: { fontSize: 34, fontWeight: '700', color: c.ink, fontVariant: ['tabular-nums'] },
    bigUnit: { fontSize: 16, fontWeight: '500', color: c.muted },
    pct: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },

    label: { fontSize: 14, fontWeight: '500', color: c.muted, marginTop: 20, marginBottom: 8 },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.paper,
      borderWidth: 1.5,
      borderColor: c.hairline,
      borderRadius: 14,
      paddingHorizontal: 16,
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 22,
      fontWeight: '600',
      color: c.ink,
      fontVariant: ['tabular-nums'],
    },
    unit: { fontSize: 16, color: c.muted },
    noteInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: c.ink },

    chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: c.accent + '1F',
    },
    chipText: { fontSize: 15, fontWeight: '600', color: c.accent, fontVariant: ['tabular-nums'] },

    buttons: { flexDirection: 'row', gap: 12, marginTop: 20 },
    buttonSlot: { flex: 1 },
    button: {
      height: 52,
      borderRadius: 14,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    buttonGhost: { backgroundColor: c.paper, borderWidth: 1.5, borderColor: c.hairline },
    buttonText: { fontSize: 16, fontWeight: '700', color: c.onAccent },
    buttonGhostText: { fontSize: 16, fontWeight: '600', color: c.ink },
    off: { opacity: 0.4 },

    footer: { marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline },
    footerAction: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 16 },
    footerText: { fontSize: 15, fontWeight: '600' },
  });