/**
 * 设置密码页面 - 注册流程最后一步
 * 纯黑金融终端风格
 */

import React, {useState} from 'react';
import {Pressable} from 'react-native';
import {customAlert} from '../components/CustomAlert';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
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
import {Ionicons} from '@expo/vector-icons';
import {AuthService} from '../services/enhanced-auth/AuthService';
import {ValidationService} from '../services/enhanced-auth/ValidationService';
import {typography} from '../theme/typography';

interface RouteParams {
  userId: string;
  phoneNumber: string;
}

export const SetPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 密码强度提示
  const getPasswordStrength = (
    pwd: string,
  ): {
    strength: 'weak' | 'medium' | 'strong';
    color: string;
    text: string;
  } => {
    if (pwd.length === 0) {
      return {strength: 'weak', color: '#71717A', text: ''};
    }
    if (pwd.length < 6) {
      return {strength: 'weak', color: '#FF5000', text: '弱'};
    }
    if (pwd.length < 8) {
      return {strength: 'medium', color: '#FFB020', text: '中'};
    }
    return {strength: 'strong', color: '#00C805', text: '强'};
  };

  const passwordStrength = getPasswordStrength(password);

  // 设置密码
  const handleSetPassword = async () => {
    // 验证密码
    const passwordValidation = ValidationService.validatePassword(password);
    if (!passwordValidation.isValid) {
      customAlert('提示', passwordValidation.error);
      return;
    }

    // 验证两次密码是否一致
    if (password !== confirmPassword) {
      customAlert('提示', '两次输入的密码不一致');
      return;
    }

    try {
      setLoading(true);

      // 调用 AuthService 设置密码
      const result = await AuthService.setPassword(params.userId, password);

      if (!result.success) {
        throw new Error(result.error || '设置密码失败');
      }

      customAlert('成功', '密码设置成功', [
        {
          text: '确定',
          onPress: () => (navigation as any).navigate('Trend'),
        },
      ]);
    } catch (error: any) {
      console.error('设置密码失败:', error);
      customAlert('设置失败', error.message || '设置密码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 跳过设置密码
  const handleSkip = () => {
    customAlert(
      '确认跳过',
      '跳过后您只能使用验证码登录，确定要跳过吗？\n\n您可以随时在设置中添加密码。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定跳过',
          onPress: () => (navigation as any).navigate('Trend'),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#000000'}} edges={['top']}>
    <ScrollView
      flex={1}
      bg="#000000"
      contentContainerStyle={{flexGrow: 1}}
      keyboardShouldPersistTaps="handled">
      <VStack px="$6" pt="$6" pb="$10">
        {/* 头部 */}
        <VStack mb="$8">
          <Heading size="2xl" fontWeight="$bold" mb="$2" color="$textDark50">
            设置登录密码
          </Heading>
          <Text size="md" color="$textDark400">
            设置密码后可使用密码快速登录
          </Text>
        </VStack>

        {/* 密码输入 */}
        <VStack space="sm" mb="$6">
          <Text size="md" fontWeight="$medium" color="$textDark50">
            登录密码
          </Text>
          <Input
            variant="outline"
            size="md"
            bg="#09090B"
            borderColor="#27272A"
            $focus={{borderColor: '$white'}}>
            <InputField
              placeholder="请输入密码"
              placeholderTextColor="#71717A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              maxLength={20}
              autoCapitalize="none"
              style={{color: '#E8EAED', fontSize: typography.fontSize.form}}
              flex={1}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={{justifyContent: 'center', paddingHorizontal: 12}}>
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#71717A"
              />
            </Pressable>
          </Input>
          <Text size="xs" color="#71717A" style={{fontSize: typography.fontSize.form}}>
            至少8位，需包含字母和数字
          </Text>
          {password.length > 0 && (
            <HStack alignItems="center" space="xs">
              <Text size="xs" color="#B8BBBE">
                密码强度：
              </Text>
              <Box w={40} h={4} borderRadius="$sm" bg={passwordStrength.color} />
              <Text size="xs" fontWeight="$medium" color={passwordStrength.color}>
                {passwordStrength.text}
              </Text>
            </HStack>
          )}
        </VStack>

        {/* 确认密码 */}
        <VStack space="sm" mb="$8">
          <Text size="md" fontWeight="$medium" color="$textDark50">
            确认密码
          </Text>
          <Input
            variant="outline"
            size="md"
            bg="#09090B"
            borderColor="#27272A"
            $focus={{borderColor: '$white'}}>
            <InputField
              placeholder="请再次输入密码"
              placeholderTextColor="#71717A"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              maxLength={20}
              autoCapitalize="none"
              style={{color: '#E8EAED', fontSize: typography.fontSize.form}}
              flex={1}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{justifyContent: 'center', paddingHorizontal: 12}}>
              <Ionicons
                name={showConfirmPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#71717A"
              />
            </Pressable>
          </Input>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <Text size="xs" color="#FF5000">
              两次输入的密码不一致
            </Text>
          )}
        </VStack>

        {/* 按钮组 */}
        <VStack space="md">
          <Button
            variant="solid"
            bg="$white"
            size="lg"
            onPress={handleSetPassword}
            isDisabled={loading}>
            {loading ? (
              <Spinner color="$black" />
            ) : (
              <ButtonText fontWeight="$semibold" color="$black">
                设置密码
              </ButtonText>
            )}
          </Button>

          <Button
            size="lg"
            variant="link"
            onPress={handleSkip}
            isDisabled={loading}>
            <ButtonText color="#71717A" textDecorationLine="none">跳过，稍后设置</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </ScrollView>
    </SafeAreaView>
  );
};
