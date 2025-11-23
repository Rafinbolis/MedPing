import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AuthUser } from '@/context/auth-context';

type Props = {
  onMenuPress: () => void;
  user: AuthUser | null;
};

const AVATAR_PLACEHOLDER =
  'https://ui-avatars.com/api/?background=1e293b&color=f8fafc&name=MedPing&size=128';

export function AppHeader({ onMenuPress, user }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir menu lateral"
        onPress={onMenuPress}
        style={styles.menuButton}
      >
        <Ionicons name="menu" size={28} color="#f8fafc" />
      </Pressable>

      <Text style={styles.title}>MedPing</Text>

      <View style={styles.avatarWrapper}>
        <Image
          source={{ uri: AVATAR_PLACEHOLDER }}
          style={styles.avatar}
          accessibilityLabel={`Foto do perfil ${user?.nome ?? 'do usuário'}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: '#0d4a7b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  menuButton: {
    padding: 8,
    borderRadius: 999,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});


