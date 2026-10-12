import { ReactNode, useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>; // aspecto del contenido
  containerStyle?: StyleProp<ViewStyle>; // posición y tamaño dentro de su contenedor
  scale?: number;
  children: ReactNode;
};

export default function Press({ style, containerStyle, scale = 0.97, children, ...rest }: Props) {
  const value = useRef(new Animated.Value(1)).current;

  const to = (toValue: number) =>
    Animated.spring(value, { toValue, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  return (
    <Pressable
      {...rest}
      style={containerStyle}
      onPressIn={(e) => {
        to(scale);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        rest.onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale: value }] }]}>{children}</Animated.View>
    </Pressable>
  );
}