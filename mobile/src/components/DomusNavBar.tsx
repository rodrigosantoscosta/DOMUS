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
  DOMUS_COLORS,
  DOMUS_SPACING,
  DOMUS_TYPOGRAPHY,
} from '../theme/tokens';
import { AbaDomus } from '../types/domus';

export interface TabConfig {
  id: AbaDomus;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

export const DOMUS_TABS: TabConfig[] = [
  { id: 'Agendar', label: 'Agendar', iconName: 'calendar-outline' },
  { id: 'Imoveis', label: 'Imoveis', iconName: 'business-outline' },
  { id: 'Atendimentos', label: 'Atendimentos', iconName: 'clipboard-outline' },
  { id: 'Clientes', label: 'Clientes', iconName: 'people-outline' },
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
  return (
    <View style={[styles.container, style]} testID="domus-navbar">
      {DOMUS_TABS.map((tab) => {
        const estaAtiva = tab.id === abaAtiva;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, estaAtiva && styles.tabItemActive]}
            onPress={() => onSelectTab && onSelectTab(tab.id)}
            testID={`tab-btn-${tab.id}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: estaAtiva }}
            accessibilityLabel={`Aba ${tab.label}`}
          >
            <Ionicons
              name={tab.iconName}
              size={18}
              color={estaAtiva ? DOMUS_COLORS.navBarActive : DOMUS_COLORS.navBarText}
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
            {estaAtiva && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DOMUS_COLORS.navBarBg,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    paddingHorizontal: DOMUS_SPACING.xs,
    paddingTop: DOMUS_SPACING.sm,
    paddingBottom: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DOMUS_SPACING.sm,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 163, 71, 0.08)',
  },
  tabIcon: {
    marginBottom: 3,
  },
  tabLabel: {
    ...DOMUS_TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: DOMUS_COLORS.navBarActive,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: DOMUS_COLORS.navBarText,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: DOMUS_COLORS.navBarActive,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});

export default DomusNavBar;
