/**
 * 头像选择页面 - 注册流程第一步
 * 纯黑金融终端风格
 */

import React, {useState} from 'react';
import {customAlert} from '../components/CustomAlert';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  VStack,
  ScrollView,
  Text,
  Heading,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AvatarPicker} from '../components/AvatarPicker';
import {Avatar, BUILT_IN_AVATARS} from '../data/builtInAvatars';
import {useTheme} from '../hooks/useTheme';

interface RouteParams {
  userId: string;
  phoneNumber: string;
}

export const AvatarSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  const theme = useTheme();
  const tc = theme.colors;

  // 默认选中第一个头像
  const [selectedAvatar, setSelectedAvatar] = useState(
    BUILT_IN_AVATARS[0].id,
  );

  // 下一步
  const handleNext = () => {
    if (!selectedAvatar) {
      customAlert('提示', '请选择一个头像');
      return;
    }

    // 跳转到完善个人信息页面
    (navigation as any).navigate('CompleteProfile', {
      userId: params.userId,
      phoneNumber: params.phoneNumber,
      avatar: selectedAvatar,
    });
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: tc.background}} edges={['top']}>
    <ScrollView
      flex={1}
      bg={tc.background}
      contentContainerStyle={{flexGrow: 1}}
      keyboardShouldPersistTaps="handled">
      <VStack px="$6" pt="$6" pb="$10">
        {/* 头部 */}
        <VStack mb="$10">
          <Heading size="2xl" fontWeight="$bold" mb="$2" color={tc.text}>
            选择头像
          </Heading>
          <Text size="md" color={tc.textTertiary}>
            选择一个喜欢的头像代表你
          </Text>
        </VStack>

        {/* 当前选中的头像预览 - 始终显示 */}
        <VStack alignItems="center" mb="$4">
          <Avatar avatarId={selectedAvatar} size={100} />
          <Text size="sm" color={tc.textTertiary} mt="$2">
            当前选择
          </Text>
        </VStack>

        {/* 头像选择器 */}
        <VStack mb="$4">
          <AvatarPicker
            selectedId={selectedAvatar}
            onSelect={setSelectedAvatar}
            columns={4}
            avatarSize={58}
          />
        </VStack>

        {/* 下一步按钮 */}
        <Button variant="solid" bg={tc.text} size="lg" onPress={handleNext}>
          <ButtonText color={tc.background} fontWeight="$semibold">
            下一步
          </ButtonText>
        </Button>
      </VStack>
    </ScrollView>
    </SafeAreaView>
  );
};
