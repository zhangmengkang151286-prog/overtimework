import React, {useState, useEffect} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView as RNScrollView,
  Image,
} from 'react-native';
import {customAlert} from '../components/CustomAlert';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Input,
  InputField,
  Button,
  ButtonText,
  ButtonSpinner,
} from '@gluestack-ui/themed';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {setUser} from '../store/slices/userSlice';
import {AuthService} from '../services/enhanced-auth/AuthService';

export const PhoneRegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // 表单字段
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');

  // UI状态
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

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

  // 发送短信验证码
  const handleSendSMSCode = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.sendSMSCode(phoneNumber, 'register');

      if (result.success) {
        setCountdown(60);
        customAlert('成功', '验证码已发送到您的手机，请查收');
      } else {
        customAlert('发送失败', result.error || '验证码发送失败');
      }
    } catch (error: any) {
      customAlert('发送失败', error.message || '验证码发送失败');
    } finally {
      setLoading(false);
    }
  };

  // 手机号注册
  const handlePhoneRegister = async () => {
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

      // 普通手机号注册
      const result = await AuthService.registerWithPhone(phoneNumber, smsCode);

      if (result.success && result.user) {
        dispatch(setUser(result.user));

        // 跳转到档案完善
        customAlert('注册成功', '请完善您的个人信息', [
          {
            text: '确定',
            onPress: () =>
              (navigation as any).navigate('CompleteProfile', {
                userId: result.user!.id,
              }),
          },
        ]);
      } else {
        customAlert('注册失败', result.error || '注册失败，请重试');
      }
    } catch (error: any) {
      customAlert('注册失败', error.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#000000'}} edges={['top']}>
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <RNScrollView style={{flex: 1}} contentContainerStyle={{flexGrow: 1}}>
        <Box flex={1} bg="#000000">
          {/* Logo区域 */}
          <VStack alignItems="center" pt="$4" pb="$4">
            <Image
              source={require('../../assets/image_1024x1024_sharp.png')}
              style={{width: 160, height: 160, marginBottom: 8}}
              resizeMode="contain"
            />
            <Heading size="2xl" mb="$2">
              打工人加班指数
            </Heading>
            <Text color="$textLight600" size="md">
              新用户注册
            </Text>
          </VStack>

          {/* 注册表单 */}
          <VStack px="$6" pb="$5" space="md">
            {/* 手机号输入 */}
            <VStack space="xs">
              <Text size="md" fontWeight="$semibold" color="$textLight900">
                手机号
              </Text>
              <Input
                variant="outline"
                size="lg"
                isDisabled={loading}
                isInvalid={!!errors.phoneNumber}>
                <InputField
                  placeholder="请输入手机号"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={phoneNumber}
                  onChangeText={(text: string) => {
                    setPhoneNumber(text);
                    clearError('phoneNumber');
                  }}
                />
              </Input>
              {errors.phoneNumber && (
                <Text size="sm" color="$error500">
                  {errors.phoneNumber}
                </Text>
              )}
            </VStack>

            {/* 验证码输入 */}
            <VStack space="xs">
              <Text size="md" fontWeight="$semibold" color="$textLight900">
                验证码
              </Text>
              <HStack space="sm" alignItems="flex-start">
                <Box flex={1}>
                  <Input
                    variant="outline"
                    size="lg"
                    isDisabled={loading}
                    isInvalid={!!errors.smsCode}>
                    <InputField
                      placeholder="请输入验证码"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={smsCode}
                      onChangeText={(text: string) => {
                        setSmsCode(text);
                        clearError('smsCode');
                      }}
                    />
                  </Input>
                </Box>
                <Button
                  variant="outline"
                  action="secondary"
                  size="lg"
                  onPress={handleSendSMSCode}
                  isDisabled={countdown > 0 || loading}
                  px="$4"
                  minWidth={110}>
                  <ButtonText>
                    {countdown > 0 ? `${countdown}秒` : '获取验证码'}
                  </ButtonText>
                </Button>
              </HStack>
              {errors.smsCode && (
                <Text size="sm" color="$error500">
                  {errors.smsCode}
                </Text>
              )}
            </VStack>

            {/* 注册按钮 */}
            <Button
              variant="solid"
              action="primary"
              size="lg"
              onPress={handlePhoneRegister}
              isDisabled={loading}
              mt="$2">
              {loading && <ButtonSpinner mr="$2" />}
              <ButtonText>{loading ? '注册中...' : '注册'}</ButtonText>
            </Button>

            {/* 提示信息 */}
            <Text size="sm" color="$textLight600" textAlign="center">
              💡 注册即表示同意用户协议和隐私政策
            </Text>

            {/* 返回登录 */}
            <Button
              variant="link"
              action="secondary"
              mt="$6"
              onPress={() => (navigation as any).navigate('Login')}>
              <ButtonText color="$textLight600" size="sm" textDecorationLine="none">
                已有账号？
                <Text color="$primary500" fontWeight="$semibold">
                  立即登录
                </Text>
              </ButtonText>
            </Button>
          </VStack>
        </Box>
      </RNScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
