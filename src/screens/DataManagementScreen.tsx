import React, {useState, useEffect, useCallback} from 'react';
import {Alert} from 'react-native';
import {
  VStack,
  HStack,
  Text,
  ScrollView,
  Spinner,
  Button,
  ButtonText,
  Input,
  InputField,
  Box,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Heading,
} from '@gluestack-ui/themed';
import {supabaseService} from '../services/supabaseService';
import {Tag} from '../types';

type DataType = 'industry' | 'company' | 'position';

interface DataManagementScreenProps {
  navigation?: any;
}

export const DataManagementScreen: React.FC<DataManagementScreenProps> = ({
  navigation,
}) => {
  const [selectedType, setSelectedType] = useState<DataType>('industry');
  const [data, setData] = useState<Tag[]>([]);
  const [filteredData, setFilteredData] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Tag | null>(null);
  const [formName, setFormName] = useState('');

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supabaseService.getTags(selectedType);
      setData(result);
      setFilteredData(result);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('错误', '加载数据失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  // 初始加载和类型切换时重新加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 实时搜索过滤
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredData(data);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = data.filter(item =>
        item.name.toLowerCase().includes(query),
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  // 打开添加/编辑模态框
  const openModal = (item?: Tag) => {
    if (item) {
      setEditingItem(item);
      setFormName(item.name);
    } else {
      setEditingItem(null);
      setFormName('');
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    setFormName('');
  };

  // 保存数据（创建或更新）
  const handleSave = async () => {
    if (formName.trim() === '') {
      Alert.alert('错误', '名称不能为空');
      return;
    }

    setLoading(true);
    try {
      if (editingItem) {
        // 更新
        await supabaseService.updateTag(editingItem.id, {name: formName});
        Alert.alert('成功', '更新成功');
      } else {
        // 创建
        await supabaseService.createTag({
          name: formName,
          type: selectedType,
          is_active: true,
        });
        Alert.alert('成功', '创建成功');
      }
      closeModal();
      // 立即刷新数据
      await loadData();
    } catch (error) {
      console.error('Failed to save:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除数据
  const handleDelete = (item: Tag) => {
    Alert.alert('确认删除', `确定要删除"${item.name}"吗？`, [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await supabaseService.deleteTag(item.id);
            Alert.alert('成功', '删除成功');
            // 立即刷新数据
            await loadData();
          } catch (error) {
            console.error('Failed to delete:', error);
            Alert.alert('错误', '删除失败，请重试');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // 渲染数据项
  const renderItem = (item: Tag) => (
    <Box
      key={item.id}
      bg="$backgroundDark800"
      p="$4"
      borderRadius="$md"
      borderWidth={1}
      borderColor="$borderLight200"
      mb="$3">
      <HStack alignItems="center" justifyContent="space-between">
        <VStack flex={1} space="xs">
          <Text size="md" fontWeight="$semibold">
            {item.name}
          </Text>
          <Text size="xs" color="$textLight600">
            创建于: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </VStack>
        <HStack space="xs">
          <Button action="primary" size="sm" onPress={() => openModal(item)}>
            <ButtonText size="xs">编辑</ButtonText>
          </Button>
          <Button
            action="negative"
            size="sm"
            onPress={() => handleDelete(item)}>
            <ButtonText size="xs">删除</ButtonText>
          </Button>
        </HStack>
      </HStack>
    </Box>
  );

  return (
    <VStack flex={1} bg="#000000">
      {/* 标题栏 */}
      <VStack
        bg="$backgroundDark800"
        py="$4"
        px="$5"
        borderBottomWidth={1}
        borderBottomColor="$borderLight200">
        <Heading size="xl" fontWeight="$bold">
          数据管理
        </Heading>
      </VStack>

      {/* 类型选择器 */}
      <HStack
        bg="$backgroundDark800"
        px="$5"
        py="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderLight200"
        space="xs">
        <Button
          action={selectedType === 'industry' ? 'primary' : 'secondary'}
          size="sm"
          flex={1}
          onPress={() => setSelectedType('industry')}>
          <ButtonText>行业</ButtonText>
        </Button>
        <Button
          action={selectedType === 'company' ? 'primary' : 'secondary'}
          size="sm"
          flex={1}
          onPress={() => setSelectedType('company')}>
          <ButtonText>公司</ButtonText>
        </Button>
        <Button
          action={selectedType === 'position' ? 'primary' : 'secondary'}
          size="sm"
          flex={1}
          onPress={() => setSelectedType('position')}>
          <ButtonText>职位</ButtonText>
        </Button>
      </HStack>

      {/* 搜索栏 */}
      <HStack
        bg="$backgroundDark800"
        px="$5"
        py="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderLight200"
        space="sm"
        alignItems="center">
        <Input flex={1} variant="outline" size="md">
          <InputField
            placeholder="搜索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Input>
        <Button action="primary" size="sm" onPress={() => openModal()}>
          <ButtonText>+ 添加</ButtonText>
        </Button>
      </HStack>

      {/* 数据列表 */}
      {loading ? (
        <VStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" />
        </VStack>
      ) : (
        <ScrollView flex={1} p="$5">
          {filteredData.length === 0 ? (
            <VStack py="$10" alignItems="center">
              <Text size="sm" color="$textLight600">
                暂无数据
              </Text>
            </VStack>
          ) : (
            filteredData.map(item => renderItem(item))
          )}
        </ScrollView>
      )}

      {/* 添加/编辑模态框 */}
      <Modal isOpen={modalVisible} onClose={closeModal}>
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">
              {editingItem ? '编辑' : '添加'}
              {selectedType === 'industry'
                ? '行业'
                : selectedType === 'company'
                  ? '公司'
                  : '职位'}
            </Heading>
          </ModalHeader>
          <ModalBody>
            <Input variant="outline" size="md">
              <InputField
                placeholder="请输入名称"
                value={formName}
                onChangeText={setFormName}
                autoFocus
              />
            </Input>
          </ModalBody>
          <ModalFooter>
            <HStack space="sm" justifyContent="flex-end">
              <Button variant="outline" size="md" onPress={closeModal}>
                <ButtonText>取消</ButtonText>
              </Button>
              <Button action="primary" size="md" onPress={handleSave}>
                <ButtonText>保存</ButtonText>
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
