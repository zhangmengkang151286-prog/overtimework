import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable as RNPressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
  Dimensions,
  Switch,
  FlatList,
} from 'react-native';
import {customAlert} from '../components/CustomAlert';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {duration, easing} from '../theme/animations';
import {typography} from '../theme/typography';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Feather} from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import {
  Spinner,
} from '@gluestack-ui/themed';
import {useAppSelector, useAppDispatch} from '../hooks/redux';
import {clearUser, updateUserInfo} from '../store/slices/userSlice';
import {storageService} from '../services/storage';
import {supabaseService} from '../services/supabaseService';
import GenderSlider from '../components/GenderSlider';
import {AuthService} from '../services/enhanced-auth/AuthService';
import {ProfileService} from '../services/enhanced-auth/ProfileService';
import {locationService} from '../services/enhanced-auth/LocationService';
import {optionsDataService} from '../services/enhanced-auth/OptionsDataService';
import {SearchableSelector} from '../components/SearchableSelector';
import {Avatar} from '../data/builtInAvatars';
import {AvatarPicker} from '../components/AvatarPicker';
import {getProvinces, getCitiesByProvince} from '../data/chinaRegions';
import {Tag} from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * 从左侧滑入的面板组件 — 支持手势左滑关闭
 */
interface SlidePanelProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// 滑动关闭阈值
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

const SlidePanel: React.FC<SlidePanelProps> = ({visible, onClose, children}) => {
  const slideVal = useSharedValue(-SCREEN_WIDTH);
  const backdropVal = useSharedValue(0);
  const startX = useSharedValue(0);
  // 是否曾经打开过（首次打开前不渲染，避免透明层拦截触摸）
  const hasOpenedOnce = useRef(false);
  // 是否完全关闭（动画结束后设为 true，用于 pointerEvents 穿透）
  const [isFullyClosed, setIsFullyClosed] = useState(true);

  const markClosed = useCallback(() => setIsFullyClosed(true), []);
  const triggerClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (visible) {
      hasOpenedOnce.current = true;
      setIsFullyClosed(false);
      slideVal.value = -SCREEN_WIDTH;
      backdropVal.value = 0;
      // 滑入动画
      slideVal.value = withTiming(0, {
        duration: duration.medium,
        easing: easing.easeOut,
      });
      backdropVal.value = withTiming(1, {
        duration: duration.normal,
        easing: easing.ease,
      });
    } else if (hasOpenedOnce.current) {
      // 滑出动画
      slideVal.value = withTiming(
        -SCREEN_WIDTH,
        {duration: duration.normal, easing: easing.easeIn},
        finished => {
          if (finished) {
            runOnJS(markClosed)();
          }
        },
      );
      backdropVal.value = withTiming(0, {
        duration: duration.normal,
        easing: easing.ease,
      });
    }
  }, [visible]);

  // 手势：左滑关闭
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart(() => {
      startX.value = slideVal.value;
    })
    .onUpdate(event => {
      const newVal = startX.value + event.translationX;
      slideVal.value = Math.min(0, newVal);
      backdropVal.value = interpolate(
        slideVal.value,
        [-SCREEN_WIDTH, 0],
        [0, 1],
        Extrapolation.CLAMP,
      );
    })
    .onEnd(event => {
      const shouldClose =
        slideVal.value < -SWIPE_THRESHOLD ||
        event.velocityX < -VELOCITY_THRESHOLD;

      if (shouldClose) {
        slideVal.value = withTiming(
          -SCREEN_WIDTH,
          {duration: duration.normal, easing: easing.easeIn},
          finished => {
            if (finished) {
              runOnJS(markClosed)();
              runOnJS(triggerClose)();
            }
          },
        );
        backdropVal.value = withTiming(0, {
          duration: duration.normal,
          easing: easing.ease,
        });
      } else {
        slideVal.value = withTiming(0, {
          duration: duration.normal,
          easing: easing.easeOut,
        });
        backdropVal.value = withTiming(1, {
          duration: duration.normal,
          easing: easing.ease,
        });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropVal.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: slideVal.value}],
  }));

  // 未曾打开过，不渲染任何内容
  if (!hasOpenedOnce.current) {
    return null;
  }

  return (
    <View
      style={slidePanelStyles.fullScreen}
      pointerEvents={isFullyClosed ? 'none' : 'box-none'}>
      {/* 半透明遮罩 */}
      <ReAnimated.View
        style={[slidePanelStyles.backdrop, backdropStyle]}
        pointerEvents={isFullyClosed ? 'none' : 'auto'}
      />
      {/* 面板内容 — 手势滑动关闭 */}
      <GestureDetector gesture={panGesture}>
        <ReAnimated.View
          style={[slidePanelStyles.container, containerStyle]}
          pointerEvents={isFullyClosed ? 'none' : 'box-none'}>
          {children}
        </ReAnimated.View>
      </GestureDetector>
    </View>
  );
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

const slidePanelStyles = StyleSheet.create({
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
});

/**
 * 菜单项组件
 */
interface MenuItemProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({icon, label, onPress}) => (
  <RNPressable
    style={({pressed}) => [
      styles.menuItem,
      pressed && {opacity: 0.6},
    ]}
    onPress={onPress}>
    <View style={styles.menuIconWrap}>
      <Feather name={icon} size={22} color="#E7E9EA" />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
  </RNPressable>
);

// 生成年份列表（1950 ~ 当前年份）
const generateYearList = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1950; y--) {
    years.push(y);
  }
  return years;
};

// 性别滑块组件已提取到 ../components/GenderSlider.tsx

// 出生年份选择弹窗组件
const BirthYearPicker: React.FC<{
  visible: boolean;
  value: number | undefined;
  onSelect: (year: number) => void;
  onClose: () => void;
}> = ({visible, value, onSelect, onClose}) => {
  const years = generateYearList();

  const renderYearItem = ({item}: {item: number}) => (
    <TouchableOpacity
      style={[birthYearStyles.item, value === item && birthYearStyles.itemSelected]}
      onPress={() => { onSelect(item); onClose(); }}
      activeOpacity={0.6}>
      <Text style={[birthYearStyles.itemText, value === item && birthYearStyles.itemTextSelected]}>
        {item} 年
      </Text>
      {value === item && <Feather name="check" size={18} color="#FFFFFF" />}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={birthYearStyles.overlay}>
        <View style={birthYearStyles.content}>
          <View style={birthYearStyles.header}>
            <Text style={birthYearStyles.title}>选择出生年份</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
              <Text style={{color: '#888', fontSize: typography.fontSize.form, fontWeight: '500'}}>取消</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={years}
            keyExtractor={item => item.toString()}
            renderItem={renderYearItem}
            style={{maxHeight: 400}}
            initialScrollIndex={value ? years.indexOf(value) : 0}
            getItemLayout={(_, index) => ({length: 50, offset: 50 * index, index})}
          />
        </View>
      </View>
    </Modal>
  );
};

interface SettingsScreenProps {
  onClose?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({onClose}) => {
  const navigation = useNavigation();
  const user = useAppSelector(state => state.user.currentUser);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  // 编辑状态
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAvatarEditing, setIsAvatarEditing] = useState(false);
  const [isSecurityPanel, setIsSecurityPanel] = useState(false);
  const [isReminderPanel, setIsReminderPanel] = useState(false);
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  // 提醒设置
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);

  // 表单数据
  const [username, setUsername] = useState(user?.username || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState(user?.avatar || '');
  const [province, setProvince] = useState(user?.province || '');
  const [city, setCity] = useState(user?.city || '');
  const [industry, setIndustry] = useState(user?.industry || '');
  const [gender, setGender] = useState<'male' | 'female' | undefined>(user?.gender || 'male');
  const [birthYear, setBirthYear] = useState<number | undefined>(user?.birthYear);
  const [position, setPosition] = useState(user?.position || '');
  const [positionCategory, setPositionCategory] = useState(user?.positionCategory || '');
  const [workStartTime, setWorkStartTime] = useState(
    (user?.workStartTime || '09:00').slice(0, 5),
  );
  const [workEndTime, setWorkEndTime] = useState((user?.workEndTime || '18:00').slice(0, 5));

  // 手机号修改
  const [newPhone, setNewPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  // 密码修改
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 选择器状态
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [showProvinceSelector, setShowProvinceSelector] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showBirthYearPicker, setShowBirthYearPicker] = useState(false);

  // 时间选择器状态（共享一个 picker）
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end' | null>(null);
  const editScrollRef = useRef<ScrollView>(null);

  // 展开时间选择器时自动滚动到底部，避免被截断
  useEffect(() => {
    if (activeTimePicker !== null) {
      setTimeout(() => {
        editScrollRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [activeTimePicker]);

  // 数据
  const [industries, setIndustries] = useState<Tag[]>([]);
  const [positions, setPositions] = useState<Tag[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // 初始化数据（立即加载，GestureDrawer 已保证 children 不重复挂载）
  useEffect(() => {
    loadTagsData();
    loadRegionData();
    loadReminderSetting();
  }, []);

  // 更新表单数据
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setSelectedAvatarId(user.avatar || '');
      setEditingAvatarId(user.avatar || '');
      setProvince(user.province || '');
      setCity(user.city || '');
      setIndustry(user.industry || '');
      setGender(user.gender || 'male');
      setBirthYear(user.birthYear);
      setPosition(user.position || '');
      setPositionCategory(user.positionCategory || '');
      setWorkStartTime((user.workStartTime || '09:00').slice(0, 5));
      setWorkEndTime((user.workEndTime || '18:00').slice(0, 5));
    }
  }, [user]);

  // 手机号验证码倒计时
  useEffect(() => {
    if (phoneCountdown > 0) {
      const timer = setTimeout(
        () => setPhoneCountdown(phoneCountdown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [phoneCountdown]);

  // 加载标签数据
  const loadTagsData = async () => {
    try {
      // 从 positions 表和 industries 表查询（而非 tags 表）
      const [industriesOptions, positionsOptions] = await Promise.all([
        optionsDataService.getIndustries(),
        optionsDataService.getPositions(),
      ]);
      // 转换为 Tag 格式供 SearchableSelector 使用
      setIndustries(industriesOptions.map(opt => ({
        id: opt.id,
        name: opt.label,
        type: 'industry' as const,
        isActive: true,
        usageCount: opt.usageCount || 0,
        createdAt: new Date(),
      })));
      setPositions(positionsOptions.map(opt => ({
        id: opt.id,
        name: opt.label,
        type: 'position' as const,
        subcategory: opt.category, // 按行业分类分组显示
        isActive: true,
        usageCount: opt.usageCount || 0,
        createdAt: new Date(),
      })));
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  // 加载省市数据
  const loadRegionData = () => {
    const provinceList = getProvinces();
    setProvinces(provinceList);
    if (province) {
      const cityList = getCitiesByProvince(province);
      setCities(cityList);
    }
  };

  // 提醒设置的存储键
  const REMINDER_KEY = '@OvertimeIndexApp:dailyReminder';

  // 加载提醒设置
  const loadReminderSetting = async () => {
    try {
      const saved = await storageService.getItem<boolean>(REMINDER_KEY);
      if (saved === true) {
        setDailyReminderEnabled(true);
      }
    } catch (error) {
      console.error('加载提醒设置失败:', error);
    }
  };

  // 调度每日提醒通知
  const scheduleDailyReminder = async (endTime: string) => {
    // 先取消已有的提醒
    await Notifications.cancelAllScheduledNotificationsAsync();

    const [hours, minutes] = endTime.split(':').map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '下班状态更新提醒',
        body: '今天的工作结束了，记得更新你的下班状态哦 📊',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
  };

  // 切换每日提醒开关
  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      // 请求通知权限
      const {status: existingStatus} = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const {status} = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        customAlert('权限不足', '请在系统设置中允许通知权限');
        return;
      }
      // 读取用户下班时间
      const endTime = user?.workEndTime || workEndTime || '18:00';
      await scheduleDailyReminder(endTime);
      setDailyReminderEnabled(true);
      await storageService.setItem(REMINDER_KEY, true);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setDailyReminderEnabled(false);
      await storageService.setItem(REMINDER_KEY, false);
    }
  };

  // 当省份改变时更新城市列表
  const handleProvinceChange = (provinceName: string) => {
    setProvince(provinceName);
    setCity('');
    const cityList = getCitiesByProvince(provinceName);
    setCities(cityList);
  };

  // 请求定位
  const requestLocation = async () => {
    try {
      setLocationLoading(true);
      const hasPermission = await locationService.requestLocationPermission();
      if (!hasPermission) {
        customAlert('提示', '请授权定位权限以自动获取位置');
        return;
      }
      const location = await locationService.getLocationInfo();
      handleProvinceChange(location.province);
      setCity(location.city);
      customAlert('成功', `已获取位置：${location.province} ${location.city}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '无法获取位置';
      customAlert('定位失败', msg);
    } finally {
      setLocationLoading(false);
    }
  };

  // 时间选择处理（共享一个 picker）
  const handleTimeChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setActiveTimePicker(null);
    }
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      if (activeTimePicker === 'start') {
        setWorkStartTime(timeStr);
      } else if (activeTimePicker === 'end') {
        setWorkEndTime(timeStr);
      }
    }
  };

  const parseTimeString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 9);
    date.setMinutes(minutes || 0);
    return date;
  };

  // 保存个人信息
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    const trimmedName = username.trim();
    if (!trimmedName) {
      customAlert('错误', '请输入用户名');
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 12) {
      customAlert('错误', '用户名长度需在2-12个字符之间');
      return;
    }
    if (!province || !city) {
      customAlert('错误', '请选择省份和城市');
      return;
    }
    if (!gender) {
      customAlert('错误', '请选择性别');
      return;
    }
    if (!birthYear) {
      customAlert('错误', '请选择出生年份');
      return;
    }
    if (!industry || !position) {
      customAlert('错误', '请完善行业和职位信息');
      return;
    }
    try {
      setLoading(true);
      const profileService = ProfileService.getInstance();
      await profileService.updateProfile(user.id, {
        username: username.trim(),
        avatar: selectedAvatarId,
        province,
        city,
        industry,
        positionCategory,
        position,
        workStartTime,
        workEndTime,
      });
      // 同时更新 gender 和 birthYear（直接写数据库）
      const genderUpdate: Record<string, unknown> = {gender, birth_year: birthYear};
      await supabaseService.updateUser(user.id, genderUpdate);
      dispatch(
        updateUserInfo({
          username: username.trim(),
          avatar: selectedAvatarId,
          gender,
          birthYear,
          province,
          city,
          industry,
          positionCategory,
          position,
          workStartTime,
          workEndTime,
        }),
      );
      customAlert('成功', '个人信息已更新');
      setIsEditingProfile(false);
      // 如果提醒已开启，更新通知调度时间
      if (dailyReminderEnabled) {
        await scheduleDailyReminder(workEndTime);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '更新失败';
      customAlert('错误', msg);
    } finally {
      setLoading(false);
    }
  };

  // 发送手机号验证码
  const handleSendPhoneCode = async () => {
    if (!newPhone.trim()) {
      customAlert('错误', '请输入新手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(newPhone)) {
      customAlert('错误', '请输入有效的手机号');
      return;
    }
    try {
      setLoading(true);
      await AuthService.sendSMSCode(newPhone, 'bind');
      setPhoneCountdown(60);
      customAlert('成功', '验证码已发送');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '发送验证码失败';
      customAlert('错误', msg);
    } finally {
      setLoading(false);
    }
  };

  // 修改手机号
  const handleChangePhone = async () => {
    if (!newPhone.trim() || !phoneCode.trim()) {
      customAlert('错误', '请输入新手机号和验证码');
      return;
    }
    if (!user?.id) return;
    try {
      setLoading(true);
      const profileService = ProfileService.getInstance();
      await profileService.updatePhoneNumber(user.id, newPhone, phoneCode);
      dispatch(updateUserInfo({phoneNumber: newPhone}));
      customAlert('成功', '手机号已更新');
      setIsChangingPhone(false);
      setNewPhone('');
      setPhoneCode('');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '修改手机号失败';
      customAlert('错误', msg);
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    const userAny = user as unknown as Record<string, unknown>;
    const hasPassword =
      userAny?.passwordHash !== null &&
      userAny?.passwordHash !== undefined &&
      userAny?.passwordHash !== '';

    if (hasPassword && !oldPassword) {
      customAlert('错误', '请输入旧密码');
      return;
    }
    if (!newPassword || !confirmPassword) {
      customAlert('错误', '请输入新密码');
      return;
    }
    if (newPassword !== confirmPassword) {
      customAlert('错误', '两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      customAlert('错误', '密码长度至少为8位，必须包含字母和数字');
      return;
    }
    if (!user?.phoneNumber || !user?.id) return;
    try {
      setLoading(true);
      if (hasPassword) {
        const loginResult = await AuthService.loginWithPassword(
          user.phoneNumber,
          oldPassword,
        );
        if (!loginResult.success) {
          customAlert('错误', '旧密码错误');
          return;
        }
      }
      const setResult = await AuthService.setPassword(user.id, newPassword);
      if (!setResult.success) {
        customAlert('错误', setResult.error || '设置密码失败');
        return;
      }
      customAlert('成功', hasPassword ? '密码已更新' : '密码设置成功');
      setIsChangingPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '设置密码失败';
      customAlert('错误', msg);
    } finally {
      setLoading(false);
    }
  };

  // 退出登录
  const handleLogout = () => {
    customAlert('退出登录', '确定要退出登录吗？', [
      {text: '取消', style: 'cancel'},
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          try {
            if (onClose) onClose();
            // Supabase 已禁用，直接清除本地登录状态
            await storageService.logout();
            dispatch(clearUser());
            navigation.reset({
              index: 0,
              routes: [{name: 'Login' as never}],
            });
          } catch (error) {
            console.error('退出登录失败:', error);
            customAlert('错误', '退出登录失败，请重试');
          }
        },
      },
    ]);
  };

  // 注销账号
  const handleDeleteAccount = () => {
    customAlert(
      '注销账号',
      '注销后，你的所有数据（个人信息、打卡记录等）将被永久删除且无法恢复。确定要注销吗？',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '确认注销',
          style: 'destructive',
          onPress: () => {
            // 二次确认
            customAlert(
              '最终确认',
              '此操作不可撤销，确定要永久删除账号吗？',
              [
                {text: '取消', style: 'cancel'},
                {
                  text: '永久删除',
                  style: 'destructive',
                  onPress: async () => {
                    if (!user?.id) return;
                    try {
                      setLoading(true);
                      await supabaseService.deleteUserAccount(user.id);
                      if (onClose) onClose();
                      await storageService.clear();
                      dispatch(clearUser());
                      navigation.reset({
                        index: 0,
                        routes: [{name: 'Login' as never}],
                      });
                    } catch (error) {
                      console.error('注销账号失败:', error);
                      customAlert('错误', '注销账号失败，请稍后重试');
                    } finally {
                      setLoading(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  // 取消编辑，还原表单数据为用户原始值
  const handleCancelEditProfile = () => {
    setUsername(user?.username || '');
    setSelectedAvatarId(user?.avatar || '');
    setProvince(user?.province || '');
    setCity(user?.city || '');
    setIndustry(user?.industry || '');
    setGender(user?.gender || 'male');
    setBirthYear(user?.birthYear);
    setPosition(user?.position || '');
    setPositionCategory(user?.positionCategory || '');
    setWorkStartTime((user?.workStartTime || '09:00').slice(0, 5));
    setWorkEndTime((user?.workEndTime || '18:00').slice(0, 5));
    // 还原城市列表
    if (user?.province) {
      const cityList = getCitiesByProvince(user.province);
      setCities(cityList);
    }
    setIsEditingProfile(false);
  };

  // 渲染个人信息编辑模态框
  const renderEditProfileModal = () => (
    <SlidePanel
      visible={isEditingProfile}
      onClose={handleCancelEditProfile}>
      <View style={{flex: 1, backgroundColor: '#000', paddingTop: insets.top}}>
        {/* 顶部导航栏 */}
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={handleCancelEditProfile} style={modalStyles.headerBtn}>
            <Text style={modalStyles.headerBtnText}>取消</Text>
          </TouchableOpacity>
          <Text style={modalStyles.headerTitle}>编辑个人信息</Text>
          <TouchableOpacity onPress={handleSaveProfile} disabled={loading} style={[modalStyles.headerBtn, {opacity: loading ? 0.4 : 1}]}>
            <Text style={modalStyles.headerBtnText}>{loading ? '保存中...' : '保存'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView ref={editScrollRef} style={{flex: 1, backgroundColor: '#000'}} contentContainerStyle={{padding: 20, paddingBottom: 40}}>
          {/* 用户名 */}
          <Text style={modalStyles.label}>用户名</Text>
          <View style={modalStyles.inputWrap}>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="请输入用户名"
              placeholderTextColor="#555"
              style={modalStyles.inputText}
              maxLength={12}
            />
          </View>

          {/* 性别 */}
          <Text style={modalStyles.label}>性别</Text>
          <View style={{alignItems: 'center', marginBottom: 8}}>
            <GenderSlider value={gender} onChange={setGender} />
          </View>

          {/* 出生年份 */}
          <Text style={modalStyles.label}>出生年份</Text>
          <TouchableOpacity style={[modalStyles.selectBox, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]} onPress={() => setShowBirthYearPicker(true)} activeOpacity={0.6}>
            <Text style={{color: birthYear ? '#E7E9EA' : '#555', fontSize: typography.fontSize.form}}>{birthYear ? `${birthYear} 年` : '请选择出生年份'}</Text>
            <Feather name="chevron-right" size={18} color="#71767B" />
          </TouchableOpacity>

          {/* 省份城市 */}
          <Text style={modalStyles.label}>省份城市</Text>
          <TouchableOpacity style={modalStyles.selectBox} onPress={() => setShowProvinceSelector(true)} activeOpacity={0.6}>
            <Text style={{color: province ? '#E7E9EA' : '#555', fontSize: typography.fontSize.form}}>{province || '请选择省份'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.selectBox} onPress={() => {
            if (!province) { customAlert('提示', '请先选择省份'); return; }
            setShowCitySelector(true);
          }} activeOpacity={0.6}>
            <Text style={{color: city ? '#E7E9EA' : '#555', fontSize: typography.fontSize.form}}>{city || '请选择城市'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={requestLocation} disabled={locationLoading} style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 6}} activeOpacity={0.6}>
            {locationLoading ? (
              <Spinner size="small" color="#71767B" />
            ) : (
              <>
                <Feather name="map-pin" size={16} color="#71767B" />
                <Text style={{color: '#71767B', fontSize: typography.fontSize.base}}>获取当前位置</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 行业 */}
          <Text style={modalStyles.label}>行业</Text>
          <TouchableOpacity style={modalStyles.selectBox} onPress={() => setShowIndustrySelector(true)} activeOpacity={0.6}>
            <Text style={{color: industry ? '#E7E9EA' : '#555', fontSize: typography.fontSize.form}}>{industry || '请选择行业'}</Text>
          </TouchableOpacity>

          {/* 职位 */}
          <Text style={modalStyles.label}>职位</Text>
          <TouchableOpacity style={modalStyles.selectBox} onPress={() => setShowPositionSelector(true)} activeOpacity={0.6}>
            <Text style={{color: position ? '#E7E9EA' : '#555', fontSize: typography.fontSize.form}}>{position || '请选择职位'}</Text>
          </TouchableOpacity>

          {/* 工作时间 */}
          <Text style={modalStyles.label}>工作时间</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <TouchableOpacity style={[modalStyles.selectBox, {flex: 1, alignItems: 'center', justifyContent: 'center'}]} onPress={() => setActiveTimePicker('start')} activeOpacity={0.6}>
              <Text style={{color: '#E7E9EA', fontSize: typography.fontSize.form, textAlign: 'center'}}>{workStartTime}</Text>
            </TouchableOpacity>
            <Text style={{color: '#71767B', fontSize: typography.fontSize.form}}>至</Text>
            <TouchableOpacity style={[modalStyles.selectBox, {flex: 1, alignItems: 'center', justifyContent: 'center'}]} onPress={() => setActiveTimePicker('end')} activeOpacity={0.6}>
              <Text style={{color: '#E7E9EA', fontSize: typography.fontSize.form, textAlign: 'center'}}>{workEndTime}</Text>
            </TouchableOpacity>
          </View>

          {activeTimePicker !== null && (
            <View style={{alignItems: 'center', marginTop: 8}}>
              <DateTimePicker
                value={parseTimeString(activeTimePicker === 'start' ? workStartTime : workEndTime)}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleTimeChange}
                style={{width: '100%'}}
                textColor="#E7E9EA"
              />
            </View>
          )}
        </ScrollView>
      </View>

      {/* 选择器 */}
      <SearchableSelector visible={showIndustrySelector} title="选择行业" type="industry" items={industries} selectedValue={industry}
        onSelect={tag => { setIndustry(tag.name); setShowIndustrySelector(false); }} onClose={() => setShowIndustrySelector(false)} />
      <SearchableSelector visible={showPositionSelector} title="选择职位" type="position" items={positions} selectedValue={position}
        onSelect={tag => { setPosition(tag.name); setPositionCategory(tag.subcategory || ''); setShowPositionSelector(false); }} onClose={() => setShowPositionSelector(false)} />
      <SearchableSelector visible={showProvinceSelector} title="选择省份" type={'province' as 'industry'}
        items={provinces.map(p => ({ id: p, name: p, type: 'province' as 'industry', isActive: true, usageCount: 0, createdAt: new Date() }))}
        selectedValue={province} onSelect={item => { handleProvinceChange(item.name); setShowProvinceSelector(false); }} onClose={() => setShowProvinceSelector(false)} />
      <SearchableSelector visible={showCitySelector} title="选择城市" type={'city' as 'industry'}
        items={cities.map(c => ({ id: c, name: c, type: 'city' as 'industry', isActive: true, usageCount: 0, createdAt: new Date() }))}
        selectedValue={city} onSelect={item => { setCity(item.name); setShowCitySelector(false); }} onClose={() => setShowCitySelector(false)} />
      {/* 出生年份选择器 */}
      <BirthYearPicker
        visible={showBirthYearPicker}
        value={birthYear}
        onSelect={setBirthYear}
        onClose={() => setShowBirthYearPicker(false)}
      />
    </SlidePanel>
  );

  // 渲染提醒设置面板
  const renderReminderPanel = () => (
    <SlidePanel
      visible={isReminderPanel}
      onClose={() => setIsReminderPanel(false)}>
      <View style={{flex: 1, backgroundColor: '#000', paddingTop: insets.top}}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setIsReminderPanel(false)} style={modalStyles.headerBtn}>
            <Text style={modalStyles.headerBtnText}>返回</Text>
          </TouchableOpacity>
          <Text style={modalStyles.headerTitle}>提醒</Text>
          <View style={{width: 50}} />
        </View>
        <View style={{paddingHorizontal: 24, paddingTop: 16}}>
          {/* 每日下班状态更新提醒 */}
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2F3336'}}>
            <View style={{flex: 1, marginRight: 12}}>
              <Text style={{color: '#E7E9EA', fontSize: typography.fontSize.md, fontWeight: '500'}}>每日下班状态更新提醒</Text>
              <Text style={{color: '#71767B', fontSize: typography.fontSize.caption, marginTop: 4, lineHeight: 18}}>
                每天在你设定的下班时间（{user?.workEndTime || workEndTime || '18:00'}）发送通知，提醒你更新下班状态
              </Text>
            </View>
            <Switch
              value={dailyReminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{false: '#333', true: '#555'}}
              thumbColor={dailyReminderEnabled ? '#E7E9EA' : '#888'}
            />
          </View>
        </View>
      </View>
    </SlidePanel>
  );

  // 渲染安全设置面板
  const renderSecurityPanel = () => (
    <SlidePanel
      visible={isSecurityPanel}
      onClose={() => setIsSecurityPanel(false)}>
      <View style={{flex: 1, backgroundColor: '#000', paddingTop: insets.top}}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setIsSecurityPanel(false)} style={modalStyles.headerBtn}>
            <Text style={modalStyles.headerBtnText}>返回</Text>
          </TouchableOpacity>
          <Text style={modalStyles.headerTitle}>安全</Text>
          <View style={{width: 50}} />
        </View>
        <View style={{paddingHorizontal: 24, paddingTop: 8}}>
          <MenuItem
            icon="smartphone"
            label="修改手机号"
            onPress={() => {
              setIsSecurityPanel(false);
              setTimeout(() => setIsChangingPhone(true), 260);
            }}
          />
          <MenuItem
            icon="lock"
            label="修改密码"
            onPress={() => {
              setIsSecurityPanel(false);
              setTimeout(() => setIsChangingPassword(true), 260);
            }}
          />
        </View>
      </View>
    </SlidePanel>
  );

  // 渲染手机号修改模态框
  const renderChangePhoneModal = () => (
    <SlidePanel
      visible={isChangingPhone}
      onClose={() => setIsChangingPhone(false)}>
      <View style={{flex: 1, backgroundColor: '#000', paddingTop: insets.top}}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setIsChangingPhone(false)} style={modalStyles.headerBtn}>
            <Text style={modalStyles.headerBtnText}>取消</Text>
          </TouchableOpacity>
          <Text style={modalStyles.headerTitle}>修改手机号</Text>
          <View style={{width: 50}} />
        </View>
        <ScrollView style={{flex: 1, backgroundColor: '#000'}} contentContainerStyle={{padding: 20}}>
          <Text style={modalStyles.label}>新手机号</Text>
          <View style={modalStyles.inputWrap}>
            <TextInput value={newPhone} onChangeText={setNewPhone} placeholder="请输入新手机号" placeholderTextColor="#555" keyboardType="phone-pad" maxLength={11} style={modalStyles.inputText} />
          </View>

          <Text style={modalStyles.label}>验证码</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <View style={[modalStyles.inputWrap, {flex: 1}]}>
              <TextInput value={phoneCode} onChangeText={setPhoneCode} placeholder="请输入验证码" placeholderTextColor="#555" keyboardType="number-pad" maxLength={6} style={modalStyles.inputText} />
            </View>
            <TouchableOpacity onPress={handleSendPhoneCode} disabled={phoneCountdown > 0 || loading}
              style={{borderWidth: 1, borderColor: phoneCountdown > 0 ? '#333' : '#555', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, minWidth: 110, alignItems: 'center'}} activeOpacity={0.6}>
              <Text style={{color: phoneCountdown > 0 ? '#555' : '#E7E9EA', fontWeight: '600', fontSize: typography.fontSize.base}}>
                {phoneCountdown > 0 ? `${phoneCountdown}秒` : '发送验证码'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleChangePhone} disabled={loading}
            style={{backgroundColor: '#E7E9EA', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24, opacity: loading ? 0.5 : 1}} activeOpacity={0.7}>
            <Text style={{color: '#000', fontWeight: '700', fontSize: typography.fontSize.md}}>{loading ? '提交中...' : '确认修改'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SlidePanel>
  );

  // 渲染密码修改模态框
  const renderChangePasswordModal = () => {
    const userAny2 = user as unknown as Record<string, unknown>;
    const hasPassword =
      userAny2?.passwordHash !== null &&
      userAny2?.passwordHash !== undefined &&
      userAny2?.passwordHash !== '';

    return (
      <SlidePanel
        visible={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}>
        <View style={{flex: 1, backgroundColor: '#000', paddingTop: insets.top}}>
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={() => setIsChangingPassword(false)} style={modalStyles.headerBtn}>
              <Text style={modalStyles.headerBtnText}>取消</Text>
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>{hasPassword ? '修改密码' : '设置密码'}</Text>
            <View style={{width: 50}} />
          </View>
          <ScrollView style={{flex: 1, backgroundColor: '#000'}} contentContainerStyle={{padding: 20}}>
            {hasPassword && (
              <>
                <Text style={modalStyles.label}>旧密码</Text>
                <View style={modalStyles.inputWrap}>
                  <TextInput value={oldPassword} onChangeText={setOldPassword} placeholder="请输入旧密码" placeholderTextColor="#555" secureTextEntry style={modalStyles.inputText} />
                </View>
              </>
            )}
            {!hasPassword && (
              <View style={{backgroundColor: '#1A1A1A', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#2F3336', marginBottom: 16}}>
                <Text style={{color: '#71767B', fontSize: typography.fontSize.base, lineHeight: 20}}>💡 您还未设置密码，设置后可以使用手机号 + 密码快速登录</Text>
              </View>
            )}

            <Text style={modalStyles.label}>{hasPassword ? '新密码' : '登录密码'}</Text>
            <View style={modalStyles.inputWrap}>
              <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="请输入密码（至少8位，需包含字母和数字）" placeholderTextColor="#555" secureTextEntry maxLength={20} style={modalStyles.inputText} />
            </View>

            <Text style={modalStyles.label}>确认密码</Text>
            <View style={modalStyles.inputWrap}>
              <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="请再次输入密码" placeholderTextColor="#555" secureTextEntry maxLength={20} style={modalStyles.inputText} />
            </View>

            <TouchableOpacity onPress={handleChangePassword} disabled={loading}
              style={{backgroundColor: '#E7E9EA', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24, opacity: loading ? 0.5 : 1}} activeOpacity={0.7}>
              <Text style={{color: '#000', fontWeight: '700', fontSize: typography.fontSize.md}}>{loading ? '提交中...' : hasPassword ? '确认修改' : '设置密码'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SlidePanel>
    );
  };

  // 渲染使用说明模态框
  const renderHelpModal = () => (
    <SlidePanel
      visible={isHelpVisible}
      onClose={() => setIsHelpVisible(false)}>
      <View style={{flex: 1, backgroundColor: '#000', paddingTop: insets.top}}>
        {/* 顶部导航栏 - 和其他设置面板一致 */}
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setIsHelpVisible(false)} style={modalStyles.headerBtn}>
            <Text style={modalStyles.headerBtnText}>返回</Text>
          </TouchableOpacity>
          <Text style={modalStyles.headerTitle}>使用说明</Text>
          <View style={modalStyles.headerBtn} />
        </View>
        {/* 内容区 */}
        <ScrollView style={{flex: 1, paddingHorizontal: 20}} showsVerticalScrollIndicator={false}>
          <View style={{paddingTop: 16, paddingBottom: 40}}>
            {/* 提交流程 */}
            <Text style={helpStyles.title}>提交状态</Text>
            <Text style={helpStyles.body}>
              每天下班后点击「提交今日状态」按钮，选择加班或准时下班，然后选择一个标签描述你的情况。选择加班时还需填写加班时长。提交后当天不可重复提交。
            </Text>
            <Text style={helpStyles.body}>
              未提交状态时，趋势页的数字和图表会被遮挡，提交后自动解锁。
            </Text>

            {/* 统计周期 */}
            <Text style={helpStyles.title}>统计周期</Text>
            <Text style={helpStyles.body}>
              每轮统计周期为当日 06:00 至次日 05:59（共24小时）。页面顶部的倒计时和进度条显示本轮剩余时间。次日 06:00 自动归档并开启新一轮。
            </Text>

            {/* 趋势页 */}
            <Text style={helpStyles.sectionHeader}>趋势页</Text>

            <Text style={helpStyles.title}>参与人数</Text>
            <Text style={helpStyles.body}>
              页面中央的大数字表示本轮已提交状态的用户总数（去重统计，每人只计一次）。
            </Text>

            <Text style={helpStyles.title}>7个圆点</Text>
            <Text style={helpStyles.body}>
              显示最近7天每天的整体加班情况，从左到右依次为最早到最近：{'\n'}
              · 红色 = 当天加班人数 {'>'} 准时人数{'\n'}
              · 绿色 = 当天准时人数 {'>'}= 加班人数{'\n'}
              · 黄色闪烁 = 今天，尚未出结果{'\n'}
              · 灰色 = 无数据{'\n'}
              点击圆点可查看当天的具体人数。
            </Text>

            <Text style={helpStyles.title}>对比条</Text>
            <Text style={helpStyles.body}>
              红绿横条显示本轮加班与准时下班的人数比例。红色部分代表加班人数，绿色部分代表准时人数，两端分别标注具体数值。
            </Text>

            <Text style={helpStyles.title}>标签分布（网格图）</Text>
            <Text style={helpStyles.body}>
              展示选择人数最多的前20个标签。每个小方块代表一位用户选择的标签。绿色系为准时标签，红色系为加班标签。颜色深浅区分不同标签。点击方块可查看该标签名称和选择人数。
            </Text>

            <Text style={helpStyles.title}>标签排行榜</Text>
            <Text style={helpStyles.body}>
              按选择人数从高到低排列当前最热门的标签，显示标签名称和对应人数。
            </Text>

            <Text style={helpStyles.title}>标签占比（树图）</Text>
            <Text style={helpStyles.body}>
              以矩形面积展示各标签的占比关系，面积越大表示选择该标签的人越多。
            </Text>

            {/* 我的页面 */}
            <Text style={helpStyles.sectionHeader}>我的页面</Text>

            <Text style={helpStyles.title}>月历视图</Text>
            <Text style={helpStyles.body}>
              以日历形式展示你每天的提交记录：{'\n'}
              · 红色 = 加班{'\n'}
              · 绿色 = 准时下班{'\n'}
              · 灰色/空白 = 未提交{'\n'}
              可左右切换月份查看历史记录。
            </Text>

            <Text style={helpStyles.title}>长期趋势图</Text>
            <Text style={helpStyles.body}>
              折线图展示你个人的加班趋势变化，支持按日、周、月三种维度切换查看。
            </Text>

            <Text style={helpStyles.title}>标签占比</Text>
            <Text style={helpStyles.body}>
              统计你历史提交中各标签的使用比例，帮助你了解自己最常见的加班/准时原因。
            </Text>
          </View>
        </ScrollView>
      </View>
    </SlidePanel>
  );

  // ========== 主页面渲染（X 风格侧边栏布局）==========
  // 头像编辑：在抽屉内通过 SlidePanel 打开头像选择
  const handleAvatarEdit = () => {
    setIsAvatarEditing(true);
  };

  // 头像编辑状态
  const [editingAvatarId, setEditingAvatarId] = useState(user?.avatar || '');
  const [avatarSaving, setAvatarSaving] = useState(false);

  // 保存头像
  const handleSaveAvatar = async () => {
    if (!user?.id || !editingAvatarId) return;
    try {
      setAvatarSaving(true);
      const profileService = ProfileService.getInstance();
      await profileService.updateProfile(user.id, {avatar: editingAvatarId});
      dispatch(updateUserInfo({avatar: editingAvatarId}));
      customAlert('成功', '头像已更新');
      setIsAvatarEditing(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '更新失败';
      customAlert('错误', msg);
    } finally {
      setAvatarSaving(false);
    }
  };

  // 取消头像编辑
  const handleCancelAvatarEdit = () => {
    setEditingAvatarId(user?.avatar || '');
    setIsAvatarEditing(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.safeArea, {paddingTop: insets.top}]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          {/* 顶部：头像 + 昵称 */}
          <View style={styles.profileSection}>
            <View style={styles.avatarRow}>
              <Avatar avatarId={user?.avatar} size={44} />
            </View>
            <Text style={styles.displayName}>{user?.username || '用户'}</Text>
            <Text style={styles.phoneNumber}>{user?.phoneNumber || ''}</Text>
            {/* 省市 · 行业信息 */}
            {(user?.province || user?.industry) && (
              <Text style={styles.infoLine}>
                {[
                  user?.province && user?.city
                    ? `${user.province} ${user.city}`
                    : '',
                  user?.industry || '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}
          </View>

          {/* 分隔线 */}
          <View style={styles.divider} />

          {/* 菜单列表 */}
          <View style={styles.menuSection}>
            <MenuItem
              icon="image"
              label="修改头像"
              onPress={handleAvatarEdit}
            />
            <MenuItem
              icon="user"
              label="个人资料"
              onPress={() => setIsEditingProfile(true)}
            />
            <MenuItem
              icon="bell"
              label="提醒"
              onPress={() => setIsReminderPanel(true)}
            />
            <MenuItem
              icon="shield"
              label="安全"
              onPress={() => setIsSecurityPanel(true)}
            />
            <MenuItem
              icon="book-open"
              label="使用说明"
              onPress={() => setIsHelpVisible(true)}
            />
          </View>

          {/* 底部分隔线 */}
          <View style={styles.divider} />

          {/* 底部功能区 */}
          <View style={styles.bottomSection}>
            <RNPressable
              style={({pressed}) => [
                styles.logoutButton,
                pressed && {opacity: 0.6},
              ]}
              onPress={handleLogout}>
              <Text style={styles.logoutText}>退出登录</Text>
            </RNPressable>

            <RNPressable
              style={({pressed}) => [
                styles.deleteAccountButton,
                pressed && {opacity: 0.6},
              ]}
              onPress={handleDeleteAccount}>
              <Text style={styles.deleteAccountText}>注销账号</Text>
            </RNPressable>

            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </ScrollView>
      </View>

      {/* 模态框 */}
      {/* 头像编辑面板 */}
      <SlidePanel visible={isAvatarEditing} onClose={handleCancelAvatarEdit}>
        <View style={{flex: 1, backgroundColor: '#000', paddingTop: insets.top}}>
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={handleCancelAvatarEdit} style={modalStyles.headerBtn}>
              <Text style={modalStyles.headerBtnText}>取消</Text>
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>修改头像</Text>
            <TouchableOpacity onPress={handleSaveAvatar} disabled={avatarSaving || editingAvatarId === (user?.avatar || '')} style={[modalStyles.headerBtn, {opacity: avatarSaving || editingAvatarId === (user?.avatar || '') ? 0.4 : 1}]}>
              <Text style={modalStyles.headerBtnText}>{avatarSaving ? '保存中...' : '保存'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{alignItems: 'center', paddingVertical: 28, gap: 12}}>
            <Avatar avatarId={editingAvatarId} size={80} />
            <Text style={{color: '#71767B', fontSize: typography.fontSize.base}}>点击下方头像进行选择</Text>
          </View>
          <View style={{flex: 1, paddingHorizontal: 20}}>
            <AvatarPicker selectedId={editingAvatarId} onSelect={setEditingAvatarId} columns={4} avatarSize={56} />
          </View>
        </View>
      </SlidePanel>
      {renderEditProfileModal()}
      {renderReminderPanel()}
      {renderSecurityPanel()}
      {renderChangePhoneModal()}
      {renderChangePasswordModal()}
      {renderHelpModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  // 顶部个人信息区
  profileSection: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: typography.fontSize.lg,
    color: '#888',
  },
  displayName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: typography.fontSize.base,
    color: '#71767B',
    marginBottom: 4,
  },
  infoLine: {
    fontSize: typography.fontSize.base,
    color: '#71767B',
  },
  // 分隔线
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2F3336',
  },
  // 菜单区
  menuSection: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 20,
  },
  menuIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: '#E7E9EA',
    letterSpacing: 0.3,
  },
  // 底部区域
  bottomSection: {
    paddingVertical: 24,
    gap: 20,
  },
  logoutButton: {
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: typography.fontSize.md,
    color: '#F4212E',
    fontWeight: '600',
  },
  deleteAccountButton: {
    paddingVertical: 12,
  },
  deleteAccountText: {
    fontSize: typography.fontSize.base,
    color: '#71767B',
  },
  versionText: {
    fontSize: typography.fontSize.caption,
    color: '#333',
  },
});

// 模态框通用样式
const modalStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2F3336',
    backgroundColor: '#000',
  },
  headerBtn: {
    padding: 4,
    minWidth: 50,
  },
  headerBtnText: {
    color: '#E7E9EA',
    fontSize: typography.fontSize.nav,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#E7E9EA',
    fontSize: typography.fontSize.nav,
    fontWeight: '700',
  },
  label: {
    color: '#E7E9EA',
    fontSize: typography.fontSize.form,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrap: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputText: {
    color: '#E7E9EA',
    fontSize: typography.fontSize.form,
    paddingVertical: 12,
  },
  selectBox: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
});

// 出生年份选择器样式
const birthYearStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  title: {
    color: '#E8EAED',
    fontSize: typography.fontSize.nav,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272A',
  },
  itemSelected: {
    backgroundColor: '#27272A',
  },
  itemText: {
    color: '#A1A1AA',
    fontSize: typography.fontSize.md,
  },
  itemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});


// 使用说明样式
const helpStyles = StyleSheet.create({
  sectionHeader: {
    color: '#fff',
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    paddingBottom: 8,
  },
  title: {
    color: '#E8EAED',
    fontSize: typography.fontSize.form,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  body: {
    color: '#A1A1AA',
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    marginBottom: 4,
  },
});
