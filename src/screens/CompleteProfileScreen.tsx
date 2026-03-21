import React, {useState, useEffect, useRef} from 'react';
import {
  Platform,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView as RNScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {customAlert} from '../components/CustomAlert';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  VStack,
  Text,
  Heading,
  ScrollView,
  Button,
  ButtonText,
  Spinner,
} from '@gluestack-ui/themed';
import {useNavigation, useRoute} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Feather} from '@expo/vector-icons';
import {SearchableSelector} from '../components/SearchableSelector';
import {Avatar} from '../data/builtInAvatars';
import {Input, InputField} from '@gluestack-ui/themed';
import {supabaseService} from '../services/supabaseService';
import {AuthService} from '../services/enhanced-auth/AuthService';
import {locationService} from '../services/enhanced-auth/LocationService';
import {typography} from '../theme/typography';
import {optionsDataService} from '../services/enhanced-auth/OptionsDataService';
import {storageService} from '../services/storage';
import {Tag} from '../types';
import {useAppSelector, useAppDispatch} from '../hooks/redux';
import {updateUserInfo} from '../store/slices/userSlice';
import {getProvinces, getCitiesByProvince} from '../data/chinaRegions';
import GenderSlider from '../components/GenderSlider';

interface RouteParams {
  userId?: string;
  phoneNumber?: string;
  wechatId?: string;
  username?: string;
  avatar?: string;
  isEditing?: boolean;
}

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
      style={[
        styles.yearItem,
        value === item && styles.yearItemSelected,
      ]}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
      activeOpacity={0.6}>
      <Text
        style={[
          styles.yearItemText,
          value === item && styles.yearItemTextSelected,
        ]}>
        {item} 年
      </Text>
      {value === item && (
        <Feather name="check" size={18} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择出生年份</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
              <Text style={{color: '#888', fontSize: typography.fontSize.form, fontWeight: '500'}}>取消</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={years}
            keyExtractor={item => item.toString()}
            renderItem={renderYearItem}
            style={{maxHeight: 400}}
            initialScrollIndex={value ? years.indexOf(value) : years.indexOf(1990)}
            getItemLayout={(_, index) => ({
              length: 50,
              offset: 50 * index,
              index,
            })}
          />
        </View>
      </View>
    </Modal>
  );
};

export const CompleteProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.user.currentUser);

  // 判断是否为编辑模式
  const isEditing = params?.isEditing || false;
  const userId = isEditing ? currentUser?.id : params?.userId;

  // 表单状态
  const [avatar, setAvatar] = useState(
    isEditing ? currentUser?.avatar || '' : params?.avatar || '',
  );
  const [username, setUsername] = useState(
    isEditing ? currentUser?.username || '' : params?.username || '',
  );
  const [gender, setGender] = useState<'male' | 'female' | undefined>(
    isEditing ? currentUser?.gender || 'male' : 'male',
  );
  const [birthYear, setBirthYear] = useState<number | undefined>(
    isEditing ? currentUser?.birthYear : undefined,
  );
  const [province, setProvince] = useState(
    isEditing ? currentUser?.province || '' : '',
  );
  const [city, setCity] = useState(isEditing ? currentUser?.city || '' : '');
  const [industry, setIndustry] = useState(
    isEditing ? currentUser?.industry || '' : '',
  );
  const [position, setPosition] = useState(
    isEditing ? currentUser?.position || '' : '',
  );
  const [positionCategory, setPositionCategory] = useState(
    isEditing ? currentUser?.positionCategory || '' : '',
  );
  const [workStartTime, setWorkStartTime] = useState(
    isEditing ? (currentUser?.workStartTime || '09:00').slice(0, 5) : '09:00',
  );
  const [workEndTime, setWorkEndTime] = useState(
    isEditing ? (currentUser?.workEndTime || '18:00').slice(0, 5) : '18:00',
  );

  // 选择器状态
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [showProvinceSelector, setShowProvinceSelector] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showBirthYearPicker, setShowBirthYearPicker] = useState(false);

  // 数据状态
  const [industries, setIndustries] = useState<Tag[]>([]);
  const [positions, setPositions] = useState<Tag[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // 时间选择器状态
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end' | null>(null);
  const scrollViewRef = useRef<RNScrollView>(null);

  // 展开时间选择器时自动滚动到底部，避免被截断
  useEffect(() => {
    if (activeTimePicker !== null) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [activeTimePicker]);

  // 选中的标签
  const [selectedIndustry, setSelectedIndustry] = useState<Tag | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Tag | null>(null);

  // 加载标签数据
  useEffect(() => {
    loadTagsData();
    loadRegionData();
  }, []);

  // 编辑模式下初始化选中的标签
  useEffect(() => {
    if (isEditing && currentUser && industries.length > 0) {
      const matchedIndustry = industries.find(
        ind => ind.name === currentUser.industry,
      );
      if (matchedIndustry) setSelectedIndustry(matchedIndustry);
    }
  }, [isEditing, currentUser, industries]);

  useEffect(() => {
    if (isEditing && currentUser && positions.length > 0) {
      const matchedPosition = positions.find(
        pos => pos.name === currentUser.position,
      );
      if (matchedPosition) setSelectedPosition(matchedPosition);
    }
  }, [isEditing, currentUser, positions]);

  const loadTagsData = async () => {
    try {
      setDataLoading(true);
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
    } catch (error: unknown) {
      console.error('加载选项数据失败:', error);
      setIndustries([
        {id: '1', name: '互联网', type: 'industry', isActive: true, usageCount: 0, createdAt: new Date()},
        {id: '2', name: '金融', type: 'industry', isActive: true, usageCount: 0, createdAt: new Date()},
      ]);
      setPositions([
        {id: '1', name: '软件工程师', type: 'position', isActive: true, usageCount: 0, createdAt: new Date()},
        {id: '2', name: '产品经理', type: 'position', isActive: true, usageCount: 0, createdAt: new Date()},
      ]);
    } finally {
      setDataLoading(false);
    }
  };

  const loadRegionData = () => {
    const provinceList = getProvinces();
    setProvinces(provinceList);
  };

  const handleProvinceChange = (provinceName: string) => {
    setProvince(provinceName);
    setCity('');
    const cityList = getCitiesByProvince(provinceName);
    setCities(cityList);
  };

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
      customAlert('成功', `已自动获取您的位置：${location.province} ${location.city}`);
    } catch (error: unknown) {
      console.error('获取定位失败:', error);
      const msg = error instanceof Error ? error.message : '无法获取位置，请手动选择省份城市';
      customAlert('定位失败', msg, [{text: '确定'}]);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleTimeChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setActiveTimePicker(null);
    }
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      // 时间值变化时触发轻震动反馈
      Haptics.selectionAsync();
      if (activeTimePicker === 'start') setWorkStartTime(timeStr);
      else if (activeTimePicker === 'end') setWorkEndTime(timeStr);
    }
  };

  const parseTimeString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 9);
    date.setMinutes(minutes || 0);
    return date;
  };

  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!avatar) { customAlert('提示', '请选择头像'); return; }
    if (!username.trim()) { customAlert('提示', '请输入用户名'); return; }
    if (username.trim().length < 2 || username.trim().length > 12) { customAlert('提示', '用户名长度需在2-12个字符之间'); return; }
    if (!gender) { customAlert('提示', '请选择性别'); return; }
    if (!birthYear) { customAlert('提示', '请选择出生年份'); return; }
    if (!province || !city) { customAlert('提示', '请选择省份城市'); return; }
    if (!selectedIndustry) { customAlert('提示', '请选择行业'); return; }
    if (!selectedPosition) { customAlert('提示', '请选择职位'); return; }
    if (!positionCategory) { customAlert('提示', '请选择职位分类'); return; }
    if (!validateTimeFormat(workStartTime) || !validateTimeFormat(workEndTime)) {
      customAlert('提示', '请输入正确的时间格式(HH:mm)');
      return;
    }
    if (!userId) { customAlert('错误', '用户ID不存在'); return; }

    try {
      setLoading(true);

      const profileData = {
        avatar_url: avatar,
        username: username.trim(),
        gender,
        birth_year: birthYear,
        province,
        city,
        industry: selectedIndustry.name,
        position_category: positionCategory,
        position: selectedPosition.name,
        work_start_time: workStartTime,
        work_end_time: workEndTime,
        is_profile_complete: true,
      };

      const result = await AuthService.updateUserProfile(userId, profileData);
      if (!result.success) throw new Error(result.error || '更新失败');

      const updatedUser = result.user!;

      const userForStorage = {
        id: updatedUser.id,
        phoneNumber: updatedUser.phoneNumber,
        avatar: updatedUser.avatarUrl || avatar,
        username: updatedUser.username || '',
        gender: updatedUser.gender,
        birthYear: updatedUser.birthYear,
        province: updatedUser.province || '',
        city: updatedUser.city || '',
        industry: updatedUser.industry || '',
        company: updatedUser.company || '',
        positionCategory: updatedUser.positionCategory || '',
        position: updatedUser.position || '',
        workStartTime: (updatedUser.workStartTime || '09:00').slice(0, 5),
        workEndTime: (updatedUser.workEndTime || '18:00').slice(0, 5),
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
      await storageService.saveUser(userForStorage);
      dispatch(
        updateUserInfo({
          avatar: updatedUser.avatarUrl || avatar,
          username: updatedUser.username,
          gender: updatedUser.gender,
          birthYear: updatedUser.birthYear,
          province: updatedUser.province,
          city: updatedUser.city,
          industry: updatedUser.industry,
          company: updatedUser.company,
          positionCategory: updatedUser.positionCategory,
          position: updatedUser.position,
          workStartTime: (updatedUser.workStartTime || '09:00').slice(0, 5),
          workEndTime: (updatedUser.workEndTime || '18:00').slice(0, 5),
        }),
      );

      if (isEditing) {
        customAlert('成功', '个人信息已更新', [
          {text: '确定', onPress: () => (navigation as any).goBack()},
        ]);
      } else {
        customAlert('成功', '信息完善成功', [
          {
            text: '确定',
            onPress: () => {
              (navigation as any).navigate('SetPassword', {
                userId,
                phoneNumber: params?.phoneNumber || '',
              });
            },
          },
        ]);
      }
    } catch (error: unknown) {
      console.error('提交失败:', error);
      console.error('提交失败详情:', JSON.stringify(error, null, 2));
      const msg = error instanceof Error ? error.message : (isEditing ? '更新信息失败，请重试' : '完善信息失败，请重试');
      customAlert(isEditing ? '更新失败' : '提交失败', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={{flex: 1, backgroundColor: '#000000'}} edges={['top']}>
      <RNScrollView
        ref={scrollViewRef}
        style={{flex: 1, backgroundColor: '#000000'}}
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled">
        <VStack px="$6" pt="$10" pb="$10">
          {/* 头部 */}
          <VStack mb="$8">
            <Heading size="2xl" fontWeight="$bold" mb="$2" color="$textDark50">
              {isEditing ? '编辑个人信息' : '完善个人信息'}
            </Heading>
            <Text size="md" color="$textDark400">
              {isEditing ? '修改您的个人信息' : '请填写以下信息以完成注册'}
            </Text>
          </VStack>

          {/* 头像预览（仅注册模式显示） */}
          {!isEditing && avatar && (
            <VStack alignItems="center" mb="$6">
              <Avatar avatarId={avatar} size={80} />
            </VStack>
          )}

          {/* 用户名 */}
          <VStack mb="$5">
            <Text size="sm" fontWeight="$medium" mb="$2" color="$textDark50">
              用户名 *
            </Text>
            <Input
              variant="outline"
              size="lg"
              bg="#09090B"
              borderColor="#27272A"
              $focus={{borderColor: '$white'}}>
              <InputField
                placeholder="请输入用户名"
                placeholderTextColor="#71717A"
                value={username}
                onChangeText={setUsername}
                maxLength={12}
                style={{color: '#E8EAED', fontSize: typography.fontSize.form}}
              />
            </Input>
          </VStack>

          {/* 性别 */}
          <VStack mb="$5" alignItems="center">
            <Text size="sm" fontWeight="$medium" mb="$3" color="$textDark50" alignSelf="flex-start">
              性别 *
            </Text>
            <GenderSlider value={gender} onChange={setGender} />
          </VStack>

          {/* 出生年份 */}
          <VStack mb="$5">
            <Text size="sm" fontWeight="$medium" mb="$2" color="$textDark50">
              出生年份 *
            </Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowBirthYearPicker(true)}
              activeOpacity={0.6}>
              <Text style={{color: birthYear ? '#E7E9EA' : '#71717A', fontSize: typography.fontSize.form}}>
                {birthYear ? `${birthYear} 年` : '请选择出生年份'}
              </Text>
              <Feather name="chevron-right" size={18} color="#71717A" />
            </TouchableOpacity>
          </VStack>

          {/* 省份城市 */}
          <VStack mb="$5">
            <Text size="sm" fontWeight="$medium" mb="$2" color="$textDark50">
              省份城市 *
            </Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowProvinceSelector(true)}
              activeOpacity={0.6}>
              <Text style={{color: province ? '#E7E9EA' : '#555', fontSize: typography.fontSize.form}}>
                {province || '请选择省份'}
              </Text>
            </TouchableOpacity>
            <View style={{height: 10}} />
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => {
                if (!province) { customAlert('提示', '请先选择省份'); return; }
                setShowCitySelector(true);
              }}
              activeOpacity={0.6}>
              <Text style={{color: city ? '#E7E9EA' : '#555', fontSize: typography.fontSize.form}}>
                {city || '请选择城市'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={requestLocation}
              disabled={locationLoading}
              style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 6}}
              activeOpacity={0.6}>
              {locationLoading ? (
                <Spinner size="small" color="#71767B" />
              ) : (
                <>
                  <Feather name="map-pin" size={16} color="#71767B" />
                  <Text style={{color: '#71767B', fontSize: typography.fontSize.base}}>获取当前位置</Text>
                </>
              )}
            </TouchableOpacity>
          </VStack>

          {/* 行业 */}
          <VStack mb="$5">
            <Text size="sm" fontWeight="$medium" mb="$2" color="$textDark50">
              行业 *
            </Text>
            <Button
              h={50} variant="outline" borderRadius="$md"
              bg="#09090B" borderColor="#27272A"
              justifyContent="space-between" px="$4"
              $active={{bg: '#18181B'}}
              onPress={() => setShowIndustrySelector(true)}>
              <ButtonText size="md" color={selectedIndustry ? '#E8EAED' : '#71717A'}>
                {selectedIndustry ? selectedIndustry.name : '请选择行业'}
              </ButtonText>
              <Text size="2xl" color="#71717A">›</Text>
            </Button>
          </VStack>

          {/* 职位 */}
          <VStack mb="$5">
            <Text size="sm" fontWeight="$medium" mb="$2" color="$textDark50">
              职位 *
            </Text>
            <Button
              h={50} variant="outline" borderRadius="$md"
              bg="#09090B" borderColor="#27272A"
              justifyContent="space-between" px="$4"
              $active={{bg: '#18181B'}}
              onPress={() => setShowPositionSelector(true)}>
              <ButtonText size="md" color={selectedPosition ? '#E8EAED' : '#71717A'}>
                {selectedPosition ? selectedPosition.name : '请选择职位'}
              </ButtonText>
              <Text size="2xl" color="#71717A">›</Text>
            </Button>
          </VStack>

          {/* 工作时间 */}
          <VStack mb="$5">
            <Text size="sm" fontWeight="$medium" mb="$2" color="$textDark50">
              标准工作时间 *
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTimePicker('start');
                }}
                activeOpacity={0.6}>
                <Text style={{color: '#E8EAED', fontSize: typography.fontSize.form}}>{workStartTime}</Text>
              </TouchableOpacity>
              <Text style={{color: '#71717A', fontSize: typography.fontSize.form}}>至</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTimePicker('end');
                }}
                activeOpacity={0.6}>
                <Text style={{color: '#E8EAED', fontSize: typography.fontSize.form}}>{workEndTime}</Text>
              </TouchableOpacity>
            </View>
          </VStack>

          {/* 时间选择器 */}
          {activeTimePicker !== null && (
            <View style={{alignItems: 'center', marginBottom: 20}}>
              <DateTimePicker
                value={parseTimeString(activeTimePicker === 'start' ? workStartTime : workEndTime)}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleTimeChange}
                style={{width: '100%'}}
                textColor="#E8EAED"
              />
            </View>
          )}

          {/* 提交按钮 */}
          <Button
            variant="solid" bg="$white" size="lg" mt="$5"
            onPress={handleSubmit}
            isDisabled={loading}
            opacity={loading ? 0.5 : 1}>
            {loading ? (
              <Spinner color="#000000" />
            ) : (
              <ButtonText color="$black" fontWeight="$semibold">
                {isEditing ? '保存修改' : '下一步'}
              </ButtonText>
            )}
          </Button>
        </VStack>
      </RNScrollView>
      </SafeAreaView>

      {/* 出生年份选择弹窗 */}
      <BirthYearPicker
        visible={showBirthYearPicker}
        value={birthYear}
        onSelect={setBirthYear}
        onClose={() => setShowBirthYearPicker(false)}
      />

      {/* 行业选择器 */}
      <SearchableSelector
        visible={showIndustrySelector}
        title="选择行业"
        type="industry"
        items={industries}
        selectedValue={selectedIndustry?.id}
        onSelect={item => {
          setSelectedIndustry(item);
          setIndustry(item.name);
          setShowIndustrySelector(false);
        }}
        onClose={() => setShowIndustrySelector(false)}
        loading={dataLoading}
        placeholder="搜索行业..."
      />

      {/* 职位选择器 */}
      <SearchableSelector
        visible={showPositionSelector}
        title="选择职位"
        type="position"
        items={positions}
        selectedValue={selectedPosition?.id}
        onSelect={item => {
          setSelectedPosition(item);
          setPosition(item.name);
          setPositionCategory(item.subcategory || '');
          setShowPositionSelector(false);
        }}
        onClose={() => setShowPositionSelector(false)}
        loading={dataLoading}
        placeholder="搜索职位..."
      />

      {/* 省份选择器 */}
      <SearchableSelector
        visible={showProvinceSelector}
        title="选择省份"
        type={'province' as 'industry'}
        items={provinces.map(p => ({
          id: p, name: p, type: 'province' as 'industry',
          isActive: true, usageCount: 0, createdAt: new Date(),
        }))}
        selectedValue={province}
        onSelect={item => {
          handleProvinceChange(item.name);
          setShowProvinceSelector(false);
        }}
        onClose={() => setShowProvinceSelector(false)}
      />

      {/* 城市选择器 */}
      <SearchableSelector
        visible={showCitySelector}
        title="选择城市"
        type={'city' as 'industry'}
        items={cities.map(c => ({
          id: c, name: c, type: 'city' as 'industry',
          isActive: true, usageCount: 0, createdAt: new Date(),
        }))}
        selectedValue={city}
        onSelect={item => {
          setCity(item.name);
          setShowCitySelector(false);
        }}
        onClose={() => setShowCitySelector(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#09090B',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  modalTitle: {
    color: '#E8EAED',
    fontSize: typography.fontSize.nav,
    fontWeight: '600',
  },
  yearItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272A',
  },
  yearItemSelected: {
    backgroundColor: '#27272A',
  },
  yearItemText: {
    color: '#A1A1AA',
    fontSize: typography.fontSize.md,
  },
  yearItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
