import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { AuthUser } from '@/context/auth-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
  user: AuthUser | null;
};

const AVATAR_PLACEHOLDER =
  'https://ui-avatars.com/api/?background=1e293b&color=f8fafc&name=MedPing&size=256';

export function Sidebar({ visible, onClose, onLogout, user }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await onLogout();
    onClose();
  };

  const handleNavigate = (route: string) => {
    onClose();
    router.push(`/(tabs)/${route}` as any);
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <LinearGradient colors={['#0f172a', '#0ea5e9']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileSection}>
            <Image source={{ uri: AVATAR_PLACEHOLDER }} style={styles.profileImage} />
            <Text style={styles.profileName}>{user?.nome ?? 'Usuário MedPing'}</Text>
            <Text style={styles.profileLogin}>{user?.login ?? 'login.medping'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Perfil</Text>
            <SidebarItem
              label="Editar perfil"
              icon="person-circle-outline"
              onPress={() => handleNavigate('perfil')}
            />
            <SidebarItem
              label="Notificações"
              icon="notifications-outline"
              onPress={() => handleNavigate('notificacoes')}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configurações</Text>
            <SidebarItem
              label="Preferências"
              icon="options-outline"
              onPress={() => handleNavigate('preferencias')}
            />
            <SidebarItem
              label="Privacidade"
              icon="lock-closed-outline"
              onPress={() => handleNavigate('privacidade')}
            />
          </View>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fef2f2" />
            <Text style={styles.logoutText}>Limpar token / Sair</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

type SidebarItemProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

function SidebarItem({ label, icon, onPress }: SidebarItemProps) {
  return (
    <Pressable style={styles.item} onPress={onPress} disabled={!onPress}>
      <View style={styles.itemIconWrapper}>
        <Ionicons name={icon} size={20} color="#0f172a" />
      </View>
      <Text style={styles.itemLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#cbd5f5" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '75%',
    maxWidth: 320,
    borderTopRightRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    elevation: 8,
  },
  content: {
    paddingTop: 64,
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  profileImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#38bdf8',
    marginBottom: 16,
  },
  profileName: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  profileLogin: {
    color: '#cbd5f5',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  item: {
    backgroundColor: 'rgba(248, 250, 252, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  logoutButton: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: '#be123c',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutText: {
    color: '#fef2f2',
    fontSize: 16,
    fontWeight: '700',
  },
});

