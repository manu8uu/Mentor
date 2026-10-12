
import * as Speech from 'expo-speech';
import { chatWithMentor } from './api';

let speaking = false;

export async function mentorTaskCompleted(taskTitle: string) {
  console.log('[MentorVoice] Inicio:', taskTitle);

  if (speaking) {
    console.log('[MentorVoice] Ya hay una intervención en curso.');
    return;
  }

  speaking = true;

  try {
    console.log('[MentorVoice] Solicitando respuesta a la IA...');

    const response = await chatWithMentor(
      `Acabo de completar la tarea "${taskTitle}". Reacciona como mi mentor personal: sé directo, exigente y breve. Máximo 35 palabras. Devuelve únicamente la frase que dirías en voz alta.`,
    );

    const message = response.reply?.trim();
    console.log('[MentorVoice] Respuesta recibida:', message);

    if (!message) {
      console.warn('[MentorVoice] La IA devolvió una respuesta vacía.');
      return;
    }

    await new Promise<void>((resolve) => {
      Speech.speak(message, {
        language: 'es-ES',
        rate: 0.94,
        onStart: () => console.log('[MentorVoice] La voz ha comenzado.'),
        onDone: () => {
          console.log('[MentorVoice] La voz ha terminado.');
          resolve();
        },
        onStopped: () => {
          console.log('[MentorVoice] La voz se ha detenido.');
          resolve();
        },
        onError: (error) => {
          console.error('[MentorVoice] Error de voz:', error);
          resolve();
        },
      });
    });
  } catch (error) {
    console.error('[MentorVoice] Error al generar la intervención:', error);
  } finally {
    speaking = false;
  }
}
