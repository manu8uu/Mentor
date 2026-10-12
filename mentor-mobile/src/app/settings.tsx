import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Press from '../components/Press';
import Screen from '../components/Screen';
import { goBack } from '../lib/nav';
import { Theme, ThemeName, palettes, useTheme } from '../theme';
import BackButton from '../components/BackButton';

export default function Ajustes() {
  const { colors, name, setName } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const names = Object.keys(palettes) as ThemeName[];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <BackButton />
        </View>

        <Text style={styles.heading}>Ajustes</Text>

        <Text style={styles.section}>Estilo de la app</Text>
        <Text style={styles.hint}>Se aplica al instante y se recuerda al reabrir.</Text>

        <View style={styles.grid}>
          {names.map((key) => {
            const p = palettes[key];
            const active = key === name;
            return (
              <Press
                key={key}
                onPress={() => setName(key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                containerStyle={styles.slot}
                style={[
                  styles.preview,
                  {
                    backgroundColor: p.paper,
                    borderColor: active ? colors.accent : colors.hairline,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.mini, { backgroundColor: p.surface, borderColor: p.hairline }]}>
                  <View style={styles.miniHead}>
                    <View style={[styles.miniTile, { backgroundColor: p.accent + '33' }]}>
                      <View style={[styles.miniDot, { backgroundColor: p.accent }]} />
                    </View>
                    <View style={[styles.miniLine, { backgroundColor: p.ink }]} />
                  </View>
                  <View style={[styles.miniTrack, { backgroundColor: p.hairline }]}>
                    <View style={[styles.miniFill, { backgroundColor: p.accent }]} />
                  </View>
                </View>
                <View style={styles.previewFoot}>
                  <Text style={[styles.previewLabel, { color: p.ink }]} numberOfLines={1}>
                    {p.label}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color={p.accent} />}
                </View>
              </Press>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 48 },

    topBar: { paddingTop: 12 },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heading: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8, color: c.ink, marginTop: 18 },

    section: { fontSize: 18, fontWeight: '700', color: c.ink, marginTop: 30 },
    hint: { fontSize: 14, color: c.muted, marginTop: 4, marginBottom: 16 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
    slot: { width: '48%' },
    preview: { borderRadius: 18, padding: 12, gap: 12 },
    mini: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 10, gap: 10 },
    miniHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    miniTile: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
    miniDot: { width: 8, height: 8, borderRadius: 4 },
    miniLine: { height: 5, width: '55%', borderRadius: 3, opacity: 0.8 },
    miniTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    miniFill: { height: '100%', width: '62%', borderRadius: 3 },
    previewFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    previewLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  });