import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DOMUS_THEME,
  DOMUS_SPACING,
} from '../theme/tokens';
import { AbaDomus } from '../types/domus';
import { triggerSelectionHaptic } from '../utils/haptics';

export interface TabConfig {
  id: AbaDomus;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

export const DOMUS_TABS: TabConfig[] = [
  { id: 'Agendar', label: 'Agendar', iconName: 'calendar-outline', iconActive: 'calendar' },
  { id: 'Imoveis', label: 'Imoveis', iconName: 'business-outline', iconActive: 'business' },
  { id: 'Atendimentos', label: 'Atendimentos', iconName: 'clipboard-outline', iconActive: 'clipboard' },
  { id: 'Clientes', label: 'Clientes', iconName: 'people-outline', iconActive: 'people' },
];

export interface DomusNavBarProps {
  abaAtiva?: AbaDomus;
  onSelectTab?: (aba: AbaDomus) => void;
  style?: StyleProp<ViewStyle>;
}

export const DomusNavBar: React.FC<DomusNavBarProps> = ({
  abaAtiva = 'Agendar',
  onSelectTab,
  style,
}) => {
  const handleTabPress = (tabId: AbaDomus) => {
    triggerSelectionHaptic();
    if (onSelectTab) {
      onSelectTab(tabId);
    }
  };

  return (
    <View style={[styles.container, style]} testID="domus-navbar">
      {DOMUS_TABS.map((tab) => {
        const estaAtiva = tab.id === abaAtiva;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, estaAtiva && styles.tabItemActive]}
            onPress={() => handleTabPress(tab.id)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            testID={`tab-btn-${tab.id}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: estaAtiva }}
            accessibilityLabel={`Aba ${tab.label}`}
          >
            {estaAtiva && <View style={styles.activeIndicator} />}
            <Ionicons
              name={estaAtiva ? tab.iconActive : tab.iconName}
              size={20}
              color={estaAtiva ? DOMUS_THEME.primary : '#64748B'}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabLabel,
                estaAtiva ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    paddingHorizontal: DOMUS_SPACING.xs,
    paddingTop: 0,
    paddingBottom: DOMUS_SPACING.xs,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: 'transparent',
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
  },
  tabLabelActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#64748B',
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#EA580C',
  },
});

export default DomusNavBar;
