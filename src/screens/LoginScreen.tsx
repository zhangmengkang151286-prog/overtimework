import React, {useState, useEffect} from 'react';
import {Dimensions, InteractionManager, Image} from 'react-native';
import {customAlert} from '../components/CustomAlert';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import {duration, easing, spring} from '../theme/animations';
import {typography} from '../theme/typography';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../hooks/useTheme';
import {
  Box,
  VStack,
  HStack,
  ScrollView,
  Text,
  Button,
  ButtonText,
  ButtonSpinner,
  Input,
  InputField,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from '@gluestack-ui/themed';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {setUser} from '../store/slices/userSlice';
import {storageService} from '../services/storage';
import {AuthService} from '../services/enhanced-auth/AuthService';

type LoginMethod = 'sms' | 'password';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const tc = theme.colors;

  // 登录方式
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('sms');
  
  // Reanimated 动画值
  const slideVal = useSharedValue(0);
  // 两个表单区域各自独立的透明度动画值
  const smsOpacity = useSharedValue(1);
  const passwordOpacity = useSharedValue(0);

  // 表单字段
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [password, setPassword] = useState('');

  // UI状态
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [smsSent, setSmsSent] = useState(false); // 新增：验证码发送成功标记

  // 错误提示
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 清除错误
  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[field];
      return newErrors;
    });
  };

  // 准备用户数据用于 Redux（确保所有数据都是可序列化的）
  const prepareUserForRedux = (user: any) => {
    return {
      ...user,
      avatar: user.avatarUrl || '',
      phoneNumber: user.phoneNumber,
      province: user.province || '',
      city: user.city || '',
      industry: user.industry || '',
      company: user.company || '',
      position: user.position || '',
      positionCategory: user.positionCategory || '',
      workStartTime: (user.workStartTime || '09:00').slice(0, 5),
      workEndTime: (user.workEndTime || '18:00').slice(0, 5),
      // 保持日期为字符串格式，Redux 不支持 Date 对象
      createdAt: typeof user.createdAt === 'string' ? user.createdAt : user.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: typeof user.updatedAt === 'string' ? user.updatedAt : user.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  };

  // 验证手机号
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) {
      setErrors(prev => ({...prev, phoneNumber: '请输入手机号'}));
      return false;
    }
    if (!/^1\d{10}$/.test(phone)) {
      setErrors(prev => ({...prev, phoneNumber: '请输入正确的手机号'}));
      return false;
    }
    clearError('phoneNumber');
    return true;
  };

  // 发送短信验证码（使用独立的 loading 状态，避免影响整个表单）
  const [smsSending, setSmsSending] = useState(false);
  const handleSendSMSCode = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    setSmsSending(true);
    setSmsSent(false);

    // 等待 UI 更新完成后再发起网络请求，避免闪黑屏
    InteractionManager.runAfterInteractions(async () => {
      try {
        const result = await AuthService.sendSMSCode(phoneNumber, 'login');

        if (result.success) {
          setCountdown(60);
          setSmsSent(true);
        } else {
          setTimeout(() => {
            customAlert('发送失败', result.error || '验证码发送失败，请稍后重试');
          }, 100);
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '验证码发送失败';
        setTimeout(() => {
          customAlert('发送失败', msg.includes('网络') || msg.includes('超时') || msg.includes('连接')
            ? msg
            : '验证码发送失败，请检查网络后重试');
        }, 100);
      } finally {
        setSmsSending(false);
      }
    });
  };

  // 短信验证码登录
  const handleSMSLogin = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    if (!smsCode) {
      setErrors(prev => ({...prev, smsCode: '请输入验证码'}));
      return;
    }

    if (smsCode.length !== 6) {
      setErrors(prev => ({...prev, smsCode: '验证码为6位数字'}));
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.loginWithPhone(phoneNumber, smsCode);

      if (result.success && result.user) {
        // 准备用户数据（确保可序列化）
        const userForRedux = prepareUserForRedux(result.user);
        dispatch(setUser(userForRedux));
        // 同步保存到 AsyncStorage，防止应用重启后丢失登录状态
        await storageService.saveUser(userForRedux);

        // 使用 requestAnimationFrame 确保状态更新完成后再跳转
        requestAnimationFrame(() => {
          setLoading(false);
          // 使用 reset 替代 navigate，清除导航栈中的 Login 页面
          if (result.requiresProfileCompletion) {
            (navigation as any).navigate('AvatarSelection', {
              userId: result.user!.id,
              phoneNumber: phoneNumber,
            });
          } else {
            (navigation as any).reset({
              index: 0,
              routes: [{name: 'Trend'}],
            });
          }
        });
      } else {
        setLoading(false);
        setTimeout(() => {
          customAlert('操作失败', result.error || '请重试');
        }, 100);
      }
    } catch (error: any) {
      setLoading(false);
      setTimeout(() => {
        customAlert('操作失败', error.message || '请重试');
      }, 100);
    }
  };

  // 密码登录
  const handlePasswordLogin = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    if (!password) {
      setErrors(prev => ({...prev, password: '请输入密码'}));
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.loginWithPassword(phoneNumber, password);

      if (result.success && result.user) {
        // 准备用户数据（确保可序列化）
        const userForRedux = prepareUserForRedux(result.user);
        dispatch(setUser(userForRedux));
        // 同步保存到 AsyncStorage，防止应用重启后丢失登录状态
        await storageService.saveUser(userForRedux);

        // 使用 requestAnimationFrame 确保状态更新完成后再跳转
        requestAnimationFrame(() => {
          setLoading(false);
          // 使用 reset 替代 navigate，清除导航栈中的 Login 页面
          if (result.requiresProfileCompletion) {
            (navigation as any).navigate('AvatarSelection', {
              userId: result.user!.id,
              phoneNumber: phoneNumber,
            });
          } else {
            (navigation as any).reset({
              index: 0,
              routes: [{name: 'Trend'}],
            });
          }
        });
      } else {
        setLoading(false);
        setTimeout(() => {
          customAlert('登录失败', result.error || '登录失败，请重试');
        }, 100);
      }
    } catch (error: any) {
      setLoading(false);
      setTimeout(() => {
        customAlert('登录失败', error.message || '登录失败，请重试');
      }, 100);
    }
  };

  // 忘记密码
  const handleForgotPassword = () => {
    (navigation as any).navigate('PasswordRecovery');
  };

  // 处理登录
  const handleLogin = () => {
    if (loginMethod === 'sms') {
      handleSMSLogin();
    } else {
      handlePasswordLogin();
    }
  };

  // 切换登录方式的动画（纯 Reanimated 驱动，无 setTimeout）
  const switchLoginMethod = (method: LoginMethod) => {
    if (method === loginMethod) return;
    setLoginMethod(method);

    // 滑动指示器
    slideVal.value = withSpring(
      method === 'sms' ? 0 : 1,
      spring.snappy,
    );

    // 交叉淡入淡出：当前的淡出，目标的淡入
    if (method === 'sms') {
      passwordOpacity.value = withTiming(0, {duration: duration.fast, easing: easing.easeIn});
      smsOpacity.value = withTiming(1, {duration: duration.normal, easing: easing.easeOut});
    } else {
      smsOpacity.value = withTiming(0, {duration: duration.fast, easing: easing.easeIn});
      passwordOpacity.value = withTiming(1, {duration: duration.normal, easing: easing.easeOut});
    }
  };

  // 两个表单区域各自的动画样式
  const smsFormStyle = useAnimatedStyle(() => ({
    opacity: smsOpacity.value,
  }));
  const passwordFormStyle = useAnimatedStyle(() => ({
    opacity: passwordOpacity.value,
  }));

  const slideIndicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          slideVal.value,
          [0, 1],
          [0, (SCREEN_WIDTH - 56) / 2],
        ),
      },
    ],
  }));

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}} edges={['top']}>
      <ScrollView
        flex={1}
        bg={theme.colors.background}
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}>
        {/* Logo区域 */}
        <VStack alignItems="center" pt="$4" pb="$4">
          <Image
            source={require('../../assets/image_1024x1024_sharp.png')}
            style={{width: 103, height: 103, marginBottom: 8}}
            resizeMode="contain"
          />
        </VStack>

        {/* 标语 */}
        <Text
          color={tc.textTertiary}
          fontSize="$sm"
          fontWeight="$light"
          textAlign="center"
          pb="$8"
          letterSpacing={4}
        >
          记录我们的下班时刻
        </Text>

        {/* 登录表单 */}
        <VStack px="$6" pb="$5" space="md">
          {/* 登录方式切换 - 滑块按钮 */}
          <Box position="relative" bg={tc.backgroundTertiary} borderRadius="$md" p="$1" h={48}>
            {/* 滑动的白色背景块 */}
            <ReAnimated.View
              style={[{
                position: 'absolute',
                top: 4,
                left: 4,
                height: 40,
                width: (SCREEN_WIDTH - 56) / 2,
                backgroundColor: tc.text,
                borderRadius: 6,
              }, slideIndicatorStyle]}
            />
            
            {/* 按钮文字层 */}
            <HStack flex={1}>
              <Button
                flex={1}
                variant="link"
                bg="transparent"
                onPress={() => switchLoginMethod('sms')}
                h="$full">
                <ButtonText color={loginMethod === 'sms' ? tc.textInverse : tc.textTertiary} textDecorationLine="none">
                  验证码登录
                </ButtonText>
              </Button>
              <Button
                flex={1}
                variant="link"
                bg="transparent"
                onPress={() => switchLoginMethod('password')}
                h="$full">
                <ButtonText color={loginMethod === 'password' ? tc.textInverse : tc.textTertiary} textDecorationLine="none">
                  密码登录
                </ButtonText>
              </Button>
            </HStack>
          </Box>

          {/* 手机号输入 - 不参与切换动画，始终显示 */}
          <FormControl isInvalid={!!errors.phoneNumber}>
            <FormControlLabel mb="$1">
              <FormControlLabelText>手机号</FormControlLabelText>
            </FormControlLabel>
            <Input
              variant="outline"
              size="lg"
              isDisabled={loading}
              isInvalid={!!errors.phoneNumber}
              $focus={{
                borderColor: tc.inputFocusBorder,
              }}>
              <InputField
                placeholder="请输入11位手机号"
                keyboardType="phone-pad"
                maxLength={11}
                value={phoneNumber}
                onChangeText={(text: string) => {
                  setPhoneNumber(text);
                  clearError('phoneNumber');
                }}
                style={{fontSize: typography.fontSize.form, color: tc.text}}
                placeholderTextColor={theme.colors.inputPlaceholder}
              />
            </Input>
            {errors.phoneNumber && (
              <FormControlError>
                <FormControlErrorText>
                  {errors.phoneNumber}
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* 验证码/密码 切换区域 - 同时渲染叠放，验证码撑高度，密码绝对定位 */}
          <Box position="relative">
            {/* 验证码登录 - 始终 relative，撑起容器高度 */}
            <ReAnimated.View
              style={[smsFormStyle]}
              pointerEvents={loginMethod === 'sms' ? 'auto' : 'none'}
            >
              <FormControl isInvalid={!!errors.smsCode}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText>验证码</FormControlLabelText>
                </FormControlLabel>
                <HStack space="md" alignItems="center">
                  <Box flex={1}>
                    <Input
                      variant="outline"
                      size="lg"
                      isDisabled={loading}
                      isInvalid={!!errors.smsCode}
                      $focus={{
                        borderColor: tc.inputFocusBorder,
                      }}>
                      <InputField
                        placeholder="请输入6位验证码"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={smsCode}
                        onChangeText={(text: string) => {
                          setSmsCode(text);
                          clearError('smsCode');
                        }}
                        style={{fontSize: typography.fontSize.form, color: tc.text}}
                        placeholderTextColor={theme.colors.inputPlaceholder}
                      />
                    </Input>
                  </Box>
                  <Button
                    variant="solid"
                    size="lg"
                    bg={tc.backgroundTertiary}
                    borderWidth={1}
                    borderColor={tc.border}
                    onPress={handleSendSMSCode}
                    isDisabled={countdown > 0 || smsSending}
                    px="$4"
                    minWidth={110}>
                    <ButtonText color={tc.text} fontSize={14}>
                      {smsSending ? '发送中...' : countdown > 0 ? `${countdown}秒` : '获取验证码'}
                    </ButtonText>
                  </Button>
                </HStack>
                {errors.smsCode && (
                  <FormControlError>
                    <FormControlErrorText>{errors.smsCode}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
              
              {/* 提示区域 */}
              <Box mt="$2" minHeight={40}>
                {smsSent && countdown > 0 ? (
                  <Text color={tc.text} size="sm">
                    ✓ 验证码已发送，请查收短信
                  </Text>
                ) : (
                  <Text color={tc.textTertiary} size="sm">
                    新用户将进入注册流程
                  </Text>
                )}
              </Box>
            </ReAnimated.View>

            {/* 密码登录 - 始终绝对定位叠放在验证码表单上方 */}
            <ReAnimated.View
              style={[passwordFormStyle, {position: 'absolute', top: 0, left: 0, right: 0}]}
              pointerEvents={loginMethod === 'password' ? 'auto' : 'none'}
            >
              <FormControl isInvalid={!!errors.password}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText>密码</FormControlLabelText>
                </FormControlLabel>
                <Input
                  variant="outline"
                  size="lg"
                  isDisabled={loading}
                  isInvalid={!!errors.password}
                  $focus={{
                    borderColor: tc.inputFocusBorder,
                  }}>
                  <InputField
                    placeholder="请输入密码"
                    type="password"
                    value={password}
                    onChangeText={(text: string) => {
                      setPassword(text);
                      clearError('password');
                    }}
                    style={{fontSize: typography.fontSize.form, color: tc.text}}
                    placeholderTextColor={theme.colors.inputPlaceholder}
                  />
                </Input>
                {errors.password && (
                  <FormControlError>
                    <FormControlErrorText>{errors.password}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
              
              {/* 密码提示和忘记密码 */}
              <Box mt="$2" minHeight={40} justifyContent="flex-start">
                {!errors.password && (
                  <HStack justifyContent="space-between" alignItems="flex-start">
                    <Text color={tc.textTertiary} size="sm" flex={1}>
                      密码长度至少8位，需包含字母和数字
                    </Text>
                    <Button
                      variant="link"
                      onPress={handleForgotPassword}
                      px="$0"
                      h="auto"
                      minHeight="auto">
                      <ButtonText color={tc.textTertiary} size="sm" textDecorationLine="none">
                        忘记密码？
                      </ButtonText>
                    </Button>
                  </HStack>
                )}
              </Box>
            </ReAnimated.View>
          </Box>

          {/* 登录按钮 */}
          <Button
            variant="solid"
            bg={tc.text}
            size="lg"
            onPress={handleLogin}
            isDisabled={loading}
            mt="$2">
            {loading && <ButtonSpinner mr="$2" color={tc.background} />}
            <ButtonText color={tc.background}>{loading ? '登录中...' : '登录'}</ButtonText>
          </Button>
        </VStack>

        {/* 底部说明 */}
        {/* 底部说明 */}
        <VStack py="$6" px="$6" alignItems="center">
          <HStack alignItems="center" flexWrap="wrap" justifyContent="center">
            <Text size="sm" color={tc.textTertiary}>
              登录即表示同意
            </Text>
            <Text
              size="sm"
              color={tc.textSecondary}
              onPress={() =>
                (navigation as any).navigate('LegalDoc', {
                  docType: 'userAgreement',
                })
              }>
              《用户协议》
            </Text>
            <Text size="sm" color={tc.textTertiary}>
              和
            </Text>
            <Text
              size="sm"
              color={tc.textSecondary}
              onPress={() =>
                (navigation as any).navigate('LegalDoc', {
                  docType: 'privacyPolicy',
                })
              }>
              《隐私政策》
            </Text>
          </HStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
};
