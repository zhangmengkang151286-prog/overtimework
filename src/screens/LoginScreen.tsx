import React, {useState, useEffect, useRef} from 'react';
import {Alert, Animated, Dimensions, InteractionManager, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
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

  // 登录方式
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('sms');
  
  // 动画值
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
            Alert.alert('发送失败', result.error || '验证码发送失败');
          }, 100);
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '验证码发送失败';
        setTimeout(() => {
          Alert.alert('发送失败', msg);
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
          Alert.alert('操作失败', result.error || '请重试');
        }, 100);
      }
    } catch (error: any) {
      setLoading(false);
      setTimeout(() => {
        Alert.alert('操作失败', error.message || '请重试');
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
          Alert.alert('登录失败', result.error || '登录失败，请重试');
        }, 100);
      }
    } catch (error: any) {
      setLoading(false);
      setTimeout(() => {
        Alert.alert('登录失败', error.message || '登录失败，请重试');
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

  // 切换登录方式的动画
  const switchLoginMethod = (method: LoginMethod) => {
    if (method === loginMethod) return;

    // 淡出当前内容
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // 切换方式
      setLoginMethod(method);
      
      // 滑动指示器
      Animated.spring(slideAnim, {
        toValue: method === 'sms' ? 0 : 1,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();

      // 淡入新内容
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#000000'}} edges={['top']}>
      <ScrollView
        flex={1}
        bg="#000000"
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}>
        {/* Logo区域 */}
        <VStack alignItems="center" pt="$4" pb="$4">
          <Image
            source={require('../../assets/image_1024x1024_sharp.png')}
            style={{width: 112, height: 112, marginBottom: 8}}
            resizeMode="contain"
          />
        </VStack>

        {/* 登录表单 */}
        <VStack px="$6" pb="$5" space="md">
          {/* 登录方式切换 - 滑块按钮 */}
          <Box position="relative" bg="$backgroundDark800" borderRadius="$md" p="$1" h={48}>
            {/* 滑动的白色背景块 */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                height: 40,
                width: (SCREEN_WIDTH - 56) / 2,
                backgroundColor: '#FFFFFF',
                borderRadius: 6,
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (SCREEN_WIDTH - 56) / 2],
                    }),
                  },
                ],
              }}
            />
            
            {/* 按钮文字层 */}
            <HStack flex={1}>
              <Button
                flex={1}
                variant="link"
                bg="transparent"
                onPress={() => switchLoginMethod('sms')}
                h="$full">
                <ButtonText color={loginMethod === 'sms' ? '$black' : '$textDark400'} textDecorationLine="none">
                  验证码登录
                </ButtonText>
              </Button>
              <Button
                flex={1}
                variant="link"
                bg="transparent"
                onPress={() => switchLoginMethod('password')}
                h="$full">
                <ButtonText color={loginMethod === 'password' ? '$black' : '$textDark400'} textDecorationLine="none">
                  密码登录
                </ButtonText>
              </Button>
            </HStack>
          </Box>

          {/* 手机号输入 */}
          <Animated.View style={{opacity: fadeAnim}}>
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
                  borderColor: '$white',
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
                  style={{fontSize: 15}}
                  placeholderTextColor="#666666"
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
          </Animated.View>

          {/* 验证码登录 */}
          {loginMethod === 'sms' && (
            <Animated.View style={{opacity: fadeAnim}}>
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
                        borderColor: '$white',
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
                        style={{fontSize: 15}}
                        placeholderTextColor="#666666"
                      />
                    </Input>
                  </Box>
                  <Button
                    variant="solid"
                    size="lg"
                    bg="$backgroundDark700"
                    borderWidth={1}
                    borderColor="$borderDark700"
                    onPress={handleSendSMSCode}
                    isDisabled={countdown > 0 || smsSending}
                    px="$4">
                    <ButtonText color="$textDark50" fontSize={14}>
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
              
              {/* 提示区域 - 与密码模式保持一致的高度 */}
              <Box mt="$2" minHeight={40}>
                {smsSent && countdown > 0 ? (
                  <Text color="$textDark50" size="sm">
                    ✓ 验证码已发送，请查收短信
                  </Text>
                ) : (
                  <Text color="$textDark400" size="sm">
                    新用户将进入注册流程
                  </Text>
                )}
              </Box>
            </Animated.View>
          )}

          {/* 密码登录 */}
          {loginMethod === 'password' && (
            <Animated.View style={{opacity: fadeAnim}}>
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
                    borderColor: '$white',
                  }}>
                  <InputField
                    placeholder="请输入密码"
                    type="password"
                    value={password}
                    onChangeText={(text: string) => {
                      setPassword(text);
                      clearError('password');
                    }}
                    style={{fontSize: 15}}
                    placeholderTextColor="#666666"
                  />
                </Input>
                {errors.password && (
                  <FormControlError>
                    <FormControlErrorText>{errors.password}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
              
              {/* 密码提示和忘记密码 - 与验证码模式保持一致的高度 */}
              <Box mt="$2" minHeight={40} justifyContent="flex-start">
                {!errors.password && (
                  <HStack justifyContent="space-between" alignItems="flex-start">
                    <Text color="$textDark400" size="sm" flex={1}>
                      密码长度至少8位，需包含字母和数字
                    </Text>
                    <Button
                      variant="link"
                      onPress={handleForgotPassword}
                      px="$0"
                      h="auto"
                      minHeight="auto">
                      <ButtonText color="$textDark400" size="sm" textDecorationLine="none">
                        忘记密码？
                      </ButtonText>
                    </Button>
                  </HStack>
                )}
              </Box>
            </Animated.View>
          )}

          {/* 登录按钮 */}
          <Button
            variant="solid"
            bg="$white"
            size="lg"
            onPress={handleLogin}
            isDisabled={loading}
            mt="$2">
            {loading && <ButtonSpinner mr="$2" color="$black" />}
            <ButtonText color="$black">{loading ? '登录中...' : '登录'}</ButtonText>
          </Button>
        </VStack>

        {/* 底部说明 */}
        {/* 底部说明 */}
        <VStack py="$6" px="$6" alignItems="center">
          <HStack alignItems="center" flexWrap="wrap" justifyContent="center">
            <Text size="sm" color="$textDark400">
              登录即表示同意
            </Text>
            <Text
              size="sm"
              color="$textDark200"
              onPress={() =>
                (navigation as any).navigate('LegalDoc', {
                  docType: 'userAgreement',
                })
              }>
              《用户协议》
            </Text>
            <Text size="sm" color="$textDark400">
              和
            </Text>
            <Text
              size="sm"
              color="$textDark200"
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
