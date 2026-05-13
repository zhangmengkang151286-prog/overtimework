/**
 * 视角筛选组件（WaterfallFilter）
 * 极简纯文字风格：无边框无背景，选中态用加粗+下划线区分
 * 铃铛固定右侧不跟随滚动
 *
 * Requirements: 5.1, 5.12, 5.13, 5.14, 5.15
 */

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import {Text, HStack} from '@gluestack-ui/themed';
import {Feather} from '@expo/vector-icons';
import Animated, {useSharedValue, useAnimatedStyle, withTiming, Easing} from 'react-native-reanimated';
import {useTheme} from '../../hooks/useTheme';
import {typography} from '../../theme/typography';
import {WaterfallQueryParams, ClockOutType} from '../../types/clock-out-waterfall';
import * as postgrestApi from '../../services/postgrestApi';

interface SelectOption {
  id: string;
  label: string;
  value: string;
}

interface WaterfallFilterProps {
  onFilterChange: (params: WaterfallQueryParams) => void;
  onNotificationPress?: () => void;
  unreadCount?: number;
}

type TypeFilter = 'all' | 'ontime' | 'overtime';

export const WaterfallFilter: React.FC<WaterfallFilterProps> = ({
  onFilterChange,
  onNotificationPress,
  unreadCount = 0,
}) => {
  const theme = useTheme();

  const [industry, setIndustry] = useState<string | undefined>(undefined);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [position, setPosition] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorType, setSelectorType] = useState<'industry' | 'city' | 'position'>('industry');
  const [selectorOptions, setSelectorOptions] = useState<SelectOption[]>([]);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorLoading, setSelectorLoading] = useState(false);

  // 弹窗动画：遮罩淡入 + 面板从底部滑入（与 SearchableSelector 一致）
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const ANIM_DURATION = 250;
  const [shouldRenderModal, setShouldRenderModal] = useState(false);
  const modalTranslateY = useSharedValue(SCREEN_HEIGHT);
  const modalBackdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (selectorVisible) {
      setShouldRenderModal(true);
      modalTranslateY.value = SCREEN_HEIGHT;
      modalBackdropOpacity.value = 0;
      requestAnimationFrame(() => {
        modalTranslateY.value = withTiming(0, {duration: ANIM_DURATION, easing: Easing.out(Easing.cubic)});
        modalBackdropOpacity.value = withTiming(0.8, {duration: ANIM_DURATION, easing: Easing.out(Easing.cubic)});
      });
    } else if (shouldRenderModal) {
      modalTranslateY.value = withTiming(SCREEN_HEIGHT, {duration: ANIM_DURATION, easing: Easing.in(Easing.cubic)});
      modalBackdropOpacity.value = withTiming(0, {duration: ANIM_DURATION, easing: Easing.in(Easing.cubic)});
      setTimeout(() => setShouldRenderModal(false), ANIM_DURATION);
    }
  }, [selectorVisible]);

  const modalBackdropStyle = useAnimatedStyle(() => ({
    opacity: modalBackdropOpacity.value,
  }));

  const modalSheetStyle = useAnimatedStyle(() => ({
    transform: [{translateY: modalTranslateY.value}],
  }));

  const emitFilterChange = useCallback(
    (newIndustry?: string, newCity?: string, newPosition?: string, newType?: TypeFilter) => {
      const type = newType ?? typeFilter;
      const clockOutTypes: ClockOutType[] = [];
      if (type === 'ontime') clockOutTypes.push('ontime');
      if (type === 'overtime') clockOutTypes.push('overtime');

      const params: WaterfallQueryParams = {};
      const ind = newIndustry !== undefined ? newIndustry : industry;
      const cit = newCity !== undefined ? newCity : city;
      const pos = newPosition !== undefined ? newPosition : position;

      if (ind) params.industry = ind;
      if (cit) params.city = cit;
      if (pos) params.position = pos;
      if (clockOutTypes.length > 0) params.clockOutTypes = clockOutTypes;

      onFilterChange(params);
    },
    [industry, city, position, typeFilter, onFilterChange],
  );

  const fetchOptions = useCallback(
    async (type: 'industry' | 'city' | 'position', search?: string): Promise<SelectOption[]> => {
      try {
        const table = type === 'industry' ? '/industries' : type === 'city' ? '/cities' : '/positions';
        const params: any = {select: 'id,name', limit: 50};
        if (type !== 'city') {
          params.is_active = 'eq.true';
          params.order = 'usage_count.desc';
        } else {
          params.order = 'display_order.asc';
        }
        if (search && search.trim()) {
          params.name = `ilike.*${search.trim()}*`;
        }
        const data = await postgrestApi.get<any[]>(table, params);
        return (data || []).map((item: any) => ({id: item.id, label: item.name, value: item.name}));
      } catch {
        return [];
      }
    },
    [],
  );

  const openSelector = useCallback(
    async (type: 'industry' | 'city' | 'position') => {
      setSelectorType(type);
      setSelectorSearch('');
      setSelectorVisible(true);
      setSelectorLoading(true);
      try {
        const options = await fetchOptions(type);
        setSelectorOptions(options);
      } catch {
        setSelectorOptions([]);
      } finally {
        setSelectorLoading(false);
      }
    },
    [fetchOptions],
  );

  const handleSearch = useCallback(
    async (text: string) => {
      setSelectorSearch(text);
      setSelectorLoading(true);
      try {
        const options = await fetchOptions(selectorType, text);
        setSelectorOptions(options);
      } catch {
        setSelectorOptions([]);
      } finally {
        setSelectorLoading(false);
      }
    },
    [selectorType, fetchOptions],
  );

  const handleSelectOption = useCallback(
    (option: SelectOption | null) => {
      const value = option?.value || undefined;
      if (selectorType === 'industry') {
        setIndustry(value);
        emitFilterChange(value || '', undefined, undefined);
      } else if (selectorType === 'city') {
        setCity(value);
        emitFilterChange(undefined, value || '', undefined);
      } else {
        setPosition(value);
        emitFilterChange(undefined, undefined, value || '');
      }
      setSelectorVisible(false);
    },
    [selectorType, emitFilterChange],
  );

  // 下划线动画
  const underlineLeft = useSharedValue(0);
  const underlineWidth = useSharedValue(0);
  const underlineColor = useSharedValue(theme.colors.text);
  const tabLayouts = useRef<{x: number; width: number}[]>([{x: 0, width: 0}, {x: 0, width: 0}, {x: 0, width: 0}]);

  const TAB_COLORS: Record<TypeFilter, string> = {
    all: theme.colors.text,
    ontime: '#4ade80',
    overtime: '#f87171',
  };

  const handleTabLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    const {x, width} = e.nativeEvent.layout;
    tabLayouts.current[index] = {x, width};
    // 初始化第一个 tab 的下划线位置
    if (index === 0 && typeFilter === 'all') {
      underlineLeft.value = x;
      underlineWidth.value = width;
    }
  }, [typeFilter, underlineLeft, underlineWidth]);

  const animatedUnderlineStyle = useAnimatedStyle(() => ({
    transform: [{translateX: underlineLeft.value}],
    width: underlineWidth.value,
    backgroundColor: underlineColor.value,
  }));

  const handleTypeChangeAnimated = useCallback(
    (type: TypeFilter, index: number) => {
      setTypeFilter(type);
      const layout = tabLayouts.current[index];
      if (layout) {
        underlineLeft.value = withTiming(layout.x, {duration: 250});
        underlineWidth.value = withTiming(layout.width, {duration: 250});
        underlineColor.value = withTiming(
          TAB_COLORS[type] as any,
          {duration: 200},
        ) as any;
      }
      emitFilterChange(undefined, undefined, undefined, type);
    },
    [emitFilterChange, underlineLeft, underlineWidth, underlineColor, TAB_COLORS],
  );

  const selectorTitle =
    selectorType === 'industry' ? '行业' : selectorType === 'city' ? '城市' : '职位';

  return (
    <View style={styles.container}>
      {/* 左侧可滚动筛选区 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* 类型切换：带滑动下划线的纯文字 tab */}
        <View style={styles.tabGroup}>
          <TouchableOpacity
            style={styles.tabItem}
            onLayout={(e) => handleTabLayout(0, e)}
            onPress={() => handleTypeChangeAnimated('all', 0)}
            accessibilityState={{selected: typeFilter === 'all'}}>
            <Text style={[styles.tabText, {color: typeFilter === 'all' ? theme.colors.text : theme.colors.textTertiary}, typeFilter === 'all' && {fontWeight: '600'}]}>
              全部
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            onLayout={(e) => handleTabLayout(1, e)}
            onPress={() => handleTypeChangeAnimated('ontime', 1)}
            accessibilityState={{selected: typeFilter === 'ontime'}}>
            <Text style={[styles.tabText, {color: typeFilter === 'ontime' ? '#4ade80' : theme.colors.textTertiary}, typeFilter === 'ontime' && {fontWeight: '600'}]}>
              准时
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            onLayout={(e) => handleTabLayout(2, e)}
            onPress={() => handleTypeChangeAnimated('overtime', 2)}
            accessibilityState={{selected: typeFilter === 'overtime'}}>
            <Text style={[styles.tabText, {color: typeFilter === 'overtime' ? '#f87171' : theme.colors.textTertiary}, typeFilter === 'overtime' && {fontWeight: '600'}]}>
              加班
            </Text>
          </TouchableOpacity>
          {/* 滑动下划线 */}
          <Animated.View style={[styles.slidingUnderline, animatedUnderlineStyle]} />
        </View>

        {/* 小圆点分隔 */}
        <View style={[styles.dot, {backgroundColor: theme.colors.textTertiary}]} />

        {/* 属性筛选：带下箭头的文字 */}
        <DropdownItem
          label={industry || '行业'}
          active={!!industry}
          onPress={() => openSelector('industry')}
          theme={theme}
        />
        <DropdownItem
          label={city || '城市'}
          active={!!city}
          onPress={() => openSelector('city')}
          theme={theme}
        />
        <DropdownItem
          label={position || '职位'}
          active={!!position}
          onPress={() => openSelector('position')}
          theme={theme}
        />
      </ScrollView>

      {/* 右侧固定铃铛 */}
      {onNotificationPress && (
        <TouchableOpacity
          style={styles.bellButton}
          onPress={onNotificationPress}
          accessibilityLabel="查看消息通知">
          <Feather name="bell" size={20} color={theme.colors.textSecondary} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadCount > 99 ? '99+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* 选择器弹窗 — 遮罩淡入 + 面板从底部滑入 */}
      <Modal visible={shouldRenderModal} animationType="none" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          {/* 遮罩层：整体淡入变暗 */}
          <Animated.View style={[StyleSheet.absoluteFill, {backgroundColor: '#000'}, modalBackdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectorVisible(false)} />
          </Animated.View>
          {/* 内容面板：从底部滑入 */}
          <Animated.View style={[styles.modalSheet, modalSheetStyle]}>
            <View style={[styles.modalContent, {backgroundColor: theme.colors.background}]}>
            <HStack
              justifyContent="space-between"
              alignItems="center"
              style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <Text
                  style={{color: theme.colors.textSecondary, fontSize: typography.fontSize.base}}>
                  取消
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: typography.fontSize.md,
                  fontWeight: '600',
                }}>
                选择{selectorTitle}
              </Text>
              <TouchableOpacity onPress={() => handleSelectOption(null)}>
                <Text
                  style={{color: theme.colors.textSecondary, fontSize: typography.fontSize.base}}>
                  全部
                </Text>
              </TouchableOpacity>
            </HStack>

            <View
              style={[
                styles.searchBox,
                {backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.border},
              ]}>
              <TextInput
                style={[styles.searchInput, {color: theme.colors.text}]}
                placeholder={`搜索${selectorTitle}...`}
                placeholderTextColor={theme.colors.textTertiary}
                value={selectorSearch}
                onChangeText={handleSearch}
              />
            </View>

            {/* 用 ScrollView 取代 FlatList：与趋势页标签选择器一致，
                避免 Android 上 VirtualizedList 在滑动时强制关闭键盘 */}
            <ScrollView
              style={{flex: 1}}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled>
              {selectorOptions.length === 0 ? (
                <View style={styles.emptyList}>
                  <Text
                    style={{color: theme.colors.textTertiary, fontSize: typography.fontSize.sm}}>
                    {selectorLoading ? '加载中...' : '无匹配结果'}
                  </Text>
                </View>
              ) : (
                selectorOptions.map(item => (
                  <Pressable
                    key={item.id}
                    style={[styles.optionItem, {borderBottomColor: theme.colors.border}]}
                    onPress={() => handleSelectOption(item)}>
                    <Text style={{color: theme.colors.text, fontSize: typography.fontSize.base}}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};


/**
 * 下拉文字项（属性筛选用）
 * 无边框，纯文字 + 小箭头
 */
const DropdownItem: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  theme: any;
}> = ({label, active, onPress, theme}) => (
  <TouchableOpacity style={styles.dropdownItem} onPress={onPress} accessibilityLabel={`选择${label}`}>
    <Text
      style={[styles.dropdownText, {color: active ? theme.colors.text : theme.colors.textSecondary}]}
      numberOfLines={1}>
      {label}
    </Text>
    <Feather
      name="chevron-down"
      size={12}
      color={active ? theme.colors.text : theme.colors.textTertiary}
      style={{marginLeft: 2}}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 16,
  },
  tabGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
    gap: 16,
    paddingBottom: 6,
  },
  tabItem: {
    paddingBottom: 0,
  },
  tabText: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
  slidingUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.5,
    marginBottom: 12,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
  },
  dropdownText: {
    fontSize: 15,
    maxWidth: 72,
  },
  bellButton: {
    position: 'relative',
    padding: 8,
    marginLeft: 4,
    marginBottom: 2,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    height: '80%',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  searchInput: {
    height: 36,
    fontSize: typography.fontSize.sm,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
