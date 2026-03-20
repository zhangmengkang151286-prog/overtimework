import React, {useState, useEffect} from 'react';
import {Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  VStack,
  HStack,
  ScrollView,
  Spinner,
  Text,
  Heading,
  Button,
  ButtonText,
  Input,
  InputField,
  Box,
} from '@gluestack-ui/themed';
import {AuthService} from '../services/enhanced-auth/AuthService';
import {typography} from '../theme/typography';

export const PasswordRecoveryScreen: React.FC = () => {
  const navigation = useNavigation();

  // 步骤状态：1-输入手机号，2-输入验证码，3-设置新密码
  const [step, setStep] = useState(1);

  // 表单数据
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI 状态
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('错误', '请输入手机号');
      return;
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      Alert.alert('错误', '请输入有效的手机号');
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.sendSMSCode(
        phoneNumber,
        'reset_password',
      );

      if (result.success) {
        setCountdown(60);
        setStep(2);
        Alert.alert('成功', '验证码已发送');
      } else {
        Alert.alert('错误', result.error || '发送验证码失败');
      }
    } catch (error: any) {
      console.error('Failed to send SMS code:', error);
      Alert.alert('错误', error.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  // 验证验证码
  const handleVerifyCode = async () => {
    if (!smsCode.trim()) {
      Alert.alert('错误', '请输入验证码');
      return;
    }

    if (smsCode.length !== 6) {
      Alert.alert('错误', '请输入6位验证码');
      return;
    }

    try {
      setLoading(true);
      // 调用后端验证验证码
      const isValid = await AuthService.verifySMSCode(
        phoneNumber,
        smsCode,
        'reset_password',
      );

      if (isValid) {
        // 验证成功，进入下一步设置新密码
        setStep(3);
      } else {
        Alert.alert('错误', '验证码错误或已过期');
      }
    } catch (error: any) {
      console.error('Failed to verify SMS code:', error);
      Alert.alert('错误', error.message || '验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('错误', '请输入新密码');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致');
      return;
    }

    // 验证密码强度
    if (newPassword.length < 8) {
      Alert.alert('错误', '密码长度至少为8位');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      Alert.alert('错误', '密码必须包含字母和数字');
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.resetPassword(
        phoneNumber,
        smsCode,
        newPassword,
      );

      if (result.success) {
        Alert.alert('成功', '密码已重置，请使用新密码登录', [
          {
            text: '确定',
            onPress: () => (navigation as any).navigate('Login'),
          },
        ]);
      } else {
        Alert.alert('错误', result.error || '重置密码失败');
      }
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      Alert.alert('错误', error.message || '重置密码失败');
    } finally {
      setLoading(false);
    }
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    try {
      setLoading(true);
      const result = await AuthService.sendSMSCode(
        phoneNumber,
        'reset_password',
      );

      if (result.success) {
        setCountdown(60);
        Alert.alert('成功', '验证码已重新发送');
      } else {
        Alert.alert('错误', result.error || '发送验证码失败');
      }
    } catch (error: any) {
      console.error('Failed to resend SMS code:', error);
      Alert.alert('错误', error.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染步骤1：输入手机号
  const renderStep1 = () => (
    <VStack space="md">
      <VStack space="xs" mb="$4">
        <Heading size="2xl" color="$textDark50">
          找回密码
        </Heading>
        <Text size="sm" color="$textDark400">
          请输入您的注册手机号
        </Text>
      </VStack>

      <VStack space="sm">
        <Text size="sm" fontWeight="$medium" color="$textDark200">
          手机号
        </Text>
        <Input 
          variant="outline" 
          size="lg" 
          isDisabled={loading}
          $focus={{
            borderColor: '$white',
          }}>
          <InputField
            placeholder="请输入11位手机号"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={11}
            style={{fontSize: typography.fontSize.form}}
            placeholderTextColor="#666666"
          />
        </Input>
      </VStack>

      <Button
        variant="solid"
        bg="$white"
        size="lg"
        onPress={handleSendCode}
        isDisabled={loading}
        mt="$4">
        {loading ? (
          <Spinner color="$black" />
        ) : (
          <ButtonText color="$black">发送验证码</ButtonText>
        )}
      </Button>

      <Button
        variant="link"
        size="lg"
        onPress={() => (navigation as any).goBack()}
        mt="$2">
        <ButtonText color="$textDark400" textDecorationLine="none">返回登录</ButtonText>
      </Button>
    </VStack>
  );

  // 渲染步骤2：输入验证码
  const renderStep2 = () => (
    <VStack space="md">
      <VStack space="xs" mb="$4">
        <Heading size="2xl" color="$textDark50">
          验证手机号
        </Heading>
        <Text size="sm" color="$textDark400">
          验证码已发送至{' '}
          {phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
        </Text>
      </VStack>

      <VStack space="sm">
        <Text size="sm" fontWeight="$medium" color="$textDark200">
          验证码
        </Text>
        <Input 
          variant="outline" 
          size="lg" 
          isDisabled={loading}
          $focus={{
            borderColor: '$white',
          }}>
          <InputField
            placeholder="请输入6位验证码"
            value={smsCode}
            onChangeText={setSmsCode}
            keyboardType="number-pad"
            maxLength={6}
            style={{fontSize: typography.fontSize.form}}
            placeholderTextColor="#666666"
          />
        </Input>
      </VStack>

      <Button
        variant="solid"
        bg="$white"
        size="lg"
        onPress={handleVerifyCode}
        isDisabled={loading}
        mt="$4">
        {loading ? <Spinner color="$black" /> : <ButtonText color="$black">下一步</ButtonText>}
      </Button>

      <VStack alignItems="center" mt="$4">
        {countdown > 0 ? (
          <Text size="sm" color="$textDark400">
            {countdown}秒后可重新发送
          </Text>
        ) : (
          <Button
            variant="link"
            size="sm"
            onPress={handleResendCode}
            isDisabled={loading}>
            <ButtonText fontWeight="$medium" color="$textDark200" textDecorationLine="none">重新发送验证码</ButtonText>
          </Button>
        )}
      </VStack>

      <Button variant="link" size="lg" onPress={() => setStep(1)} mt="$2">
        <ButtonText color="$textDark400" textDecorationLine="none">返回上一步</ButtonText>
      </Button>
    </VStack>
  );

  // 渲染步骤3：设置新密码
  const renderStep3 = () => (
    <VStack space="md">
      <VStack space="xs" mb="$4">
        <Heading size="2xl" color="$textDark50">
          设置新密码
        </Heading>
        <Text size="sm" color="$textDark400">
          请设置您的新密码
        </Text>
      </VStack>

      <VStack space="sm">
        <Text size="sm" fontWeight="$medium" color="$textDark200">
          新密码
        </Text>
        <Input 
          variant="outline" 
          size="lg" 
          isDisabled={loading}
          $focus={{
            borderColor: '$white',
          }}>
          <InputField
            placeholder="至少8位，包含字母和数字"
            value={newPassword}
            onChangeText={setNewPassword}
            type="password"
            style={{fontSize: typography.fontSize.form}}
            placeholderTextColor="#666666"
          />
        </Input>
      </VStack>

      <VStack space="sm">
        <Text size="sm" fontWeight="$medium" color="$textDark200">
          确认密码
        </Text>
        <Input 
          variant="outline" 
          size="lg" 
          isDisabled={loading}
          $focus={{
            borderColor: '$white',
          }}>
          <InputField
            placeholder="请再次输入新密码"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            type="password"
            style={{fontSize: typography.fontSize.form}}
            placeholderTextColor="#666666"
          />
        </Input>
      </VStack>

      <Box bg="$backgroundDark800" p="$3" borderRadius="$md" borderWidth={1} borderColor="$borderDark700">
        <VStack space="xs">
          <Text size="xs" color="$textDark400">
            密码要求：
          </Text>
          <Text size="xs" color="$textDark400">
            • 长度至少8位
          </Text>
          <Text size="xs" color="$textDark400">
            • 必须包含字母和数字
          </Text>
        </VStack>
      </Box>

      <Button
        variant="solid"
        bg="$white"
        size="lg"
        onPress={handleResetPassword}
        isDisabled={loading}
        mt="$4">
        {loading ? <Spinner color="$black" /> : <ButtonText color="$black">完成</ButtonText>}
      </Button>
    </VStack>
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#000000'}} edges={['top']}>
    <ScrollView flex={1} bg="#000000">
      <VStack p="$6" pt="$12" pb="$10">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </VStack>
    </ScrollView>
    </SafeAreaView>
  );
};
