import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CircleUser } from 'lucide-react-native';
import { colors } from '../theme';
import { Logo, tap } from './ui';

// Logo a la izquierda y la cuenta a la derecha, como el encabezado del modo app de la web.
export function TopBar() {
  return (
    <View style={styles.bar}>
      <Logo size={28} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tu cuenta"
        hitSlop={10}
        onPress={() => {
          tap();
          router.push('/cuenta');
        }}
        style={({ pressed }) => [styles.account, pressed && { opacity: 0.7 }]}
      >
        <CircleUser size={22} color={colors.paper} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  account: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.line },
});
