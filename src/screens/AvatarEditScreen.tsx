/**
 * 头像修改页面
 * 从设置页面点击头像进入，独立的全屏页面
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useAppSelector, useAppDispatch} from '../hooks/redux';
import {updateUserInfo} from '../store/slices/userSlice';
import {ProfileService} from '../services/enhanced-auth/ProfileService';
import {AvatarPicker} from '../components/AvatarPicker';
import {Avatar} from '../data/builtInAvatars';

export const AvatarEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const user = useAppSelector(state => state.user.currentUser);
  const dispatch = useAppDispatch();

  const [selectedAvatarId, setSelectedAvatarId] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);

  // 判断是否有改动
  const hasChanged = selectedAvatarId !== (user?.avatar || '');

  // 保存头像
  const handleSave = async () => {
    if (!user?.id || !selectedAvatarId) return;
    try {
      setLoading(true);
      const profileService = ProfileService.getInstance();
      await profileService.updateProfile(user.id, {avatar: selectedAvatarId});
      dispatch(updateUserInfo({avatar: selectedAvatarId}));
      Alert.alert('成功', '头像已更新', [
        {text: '好的', onPress: () => navigation.goBack()},
      ]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '更新失败';
      Alert.alert('错误', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* 顶部导航栏 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>修改头像</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || !hasChanged}
            style={[
              styles.headerBtn,
              {opacity: loading || !hasChanged ? 0.4 : 1},
            ]}>
            <Text style={styles.headerBtnText}>
              {loading ? '保存中...' : '保存'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 当前头像预览 */}
        <View style={styles.previewSection}>
          <Avatar avatarId={selectedAvatarId} size={80} />
          <Text style={styles.previewHint}>点击下方头像进行选择</Text>
        </View>

        {/* 头像网格 */}
        <View style={styles.pickerSection}>
          <AvatarPicker
            selectedId={selectedAvatarId}
            onSelect={setSelectedAvatarId}
            columns={4}
            avatarSize={56}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2F3336',
  },
  headerBtn: {
    padding: 4,
    minWidth: 50,
  },
  headerBtnText: {
    color: '#E7E9EA',
    fontSize: 17,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#E7E9EA',
    fontSize: 17,
    fontWeight: '700',
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  previewHint: {
    color: '#71767B',
    fontSize: 14,
  },
  pickerSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
