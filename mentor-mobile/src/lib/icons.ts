import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// el icono se elige por palabras del nombre; si no hay coincidencia, una bandera
const RULES: [RegExp, IconName][] = [
  [/ingl|idioma|franc|alem|italian|vocab/i, 'language-outline'],
  [/leer|lectura|libro|p[aá]gina/i, 'book-outline'],
  [/escrib|redact|diario|palabra/i, 'pencil-outline'],
  [/correr|andar|camin|paso|km|sender/i, 'walk-outline'],
  [/gym|gimnasio|pesas|fuerza|entren|ejercicio|flexion/i, 'barbell-outline'],
  [/c[oó]digo|program|java|react|web/i, 'code-slash-outline'],
  [/m[uú]sica|piano|guitarra|cant/i, 'musical-notes-outline'],
  [/agua|beber|hidrat/i, 'water-outline'],
  [/dormir|sue[nñ]o|descans/i, 'moon-outline'],
  [/medit|respir|yoga/i, 'leaf-outline'],
  [/ahorr|dinero|presupuesto|gast/i, 'wallet-outline'],
  [/estudi|clase|curso|examen|tema/i, 'school-outline'],
];

export function iconFor(title: string): IconName {
  for (const [pattern, icon] of RULES) {
    if (pattern.test(title)) return icon;
  }
  return 'flag-outline';
}