/**
 * gluestack-ui 组件示例
 *
 * 展示如何使用 AppButton、StatusButton 和 AppInput 组件
 */

import React, {useState} from 'react';
import {ScrollView} from 'react-native';
import {VStack, HStack, Heading, Text} from '@gluestack-ui/themed';
import {AppButton} from './Button';
import {StatusButton} from './StatusButton';
import {AppInput} from './Input';
import {DataCard} from './DataCard';
import {StatusIndicator} from './StatusIndicator';

export const GluestackButtonExamples: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <ScrollView>
      <VStack space="xl" p="$4">
        <Heading size="xl">gluestack-ui 按钮示例</Heading>

        {/* AppButton 不同变体 */}
        <VStack space="md">
          <Heading size="md">AppButton 变体</Heading>
          <HStack space="sm" flexWrap="wrap">
            <AppButton variant="primary">主要按钮</AppButton>
            <AppButton variant="secondary">次要按钮</AppButton>
            <AppButton variant="ghost">幽灵按钮</AppButton>
            <AppButton variant="danger">危险按钮</AppButton>
          </HStack>
        </VStack>

        {/* AppButton 不同尺寸 */}
        <VStack space="md">
          <Heading size="md">AppButton 尺寸</Heading>
          <HStack space="sm" flexWrap="wrap" alignItems="center">
            <AppButton variant="primary" size="xs">
              超小
            </AppButton>
            <AppButton variant="primary" size="sm">
              小
            </AppButton>
            <AppButton variant="primary" size="md">
              中
            </AppButton>
            <AppButton variant="primary" size="lg">
              大
            </AppButton>
            <AppButton variant="primary" size="xl">
              超大
            </AppButton>
          </HStack>
        </VStack>

        {/* AppButton 加载状态 */}
        <VStack space="md">
          <Heading size="md">AppButton 加载状态</Heading>
          <HStack space="sm">
            <AppButton
              variant="primary"
              loading={loading}
              onPress={handleClick}>
              {loading ? '加载中...' : '点击加载'}
            </AppButton>
          </HStack>
        </VStack>

        {/* AppButton 禁用状态 */}
        <VStack space="md">
          <Heading size="md">AppButton 禁用状态</Heading>
          <HStack space="sm">
            <AppButton variant="primary" disabled>
              禁用按钮
            </AppButton>
          </HStack>
        </VStack>

        {/* StatusButton 不同状态 */}
        <VStack space="md">
          <Heading size="md">StatusButton 状态</Heading>
          <HStack space="sm" flexWrap="wrap">
            <StatusButton status="overtime">加班</StatusButton>
            <StatusButton status="ontime">准时下班</StatusButton>
            <StatusButton status="pending">待定</StatusButton>
          </HStack>
        </VStack>

        {/* StatusButton 不同尺寸 */}
        <VStack space="md">
          <Heading size="md">StatusButton 尺寸</Heading>
          <HStack space="sm" flexWrap="wrap" alignItems="center">
            <StatusButton status="ontime" size="sm">
              小
            </StatusButton>
            <StatusButton status="ontime" size="md">
              中
            </StatusButton>
            <StatusButton status="ontime" size="lg">
              大
            </StatusButton>
          </HStack>
        </VStack>

        {/* StatusButton 禁用状态 */}
        <VStack space="md">
          <Heading size="md">StatusButton 禁用状态</Heading>
          <HStack space="sm">
            <StatusButton status="pending" isDisabled>
              禁用待定
            </StatusButton>
          </HStack>
        </VStack>

        {/* 实际使用示例 */}
        <VStack space="md">
          <Heading size="md">实际使用示例</Heading>
          <Text>用户状态选择：</Text>
          <HStack space="sm" flexWrap="wrap">
            <StatusButton
              status="overtime"
              onPress={() => console.log('选择加班')}>
              我在加班
            </StatusButton>
            <StatusButton
              status="ontime"
              onPress={() => console.log('选择准时下班')}>
              我准时下班
            </StatusButton>
          </HStack>
        </VStack>

        <VStack space="md">
          <Text>表单操作：</Text>
          <HStack space="sm">
            <AppButton variant="primary" onPress={() => console.log('提交')}>
              提交
            </AppButton>
            <AppButton variant="secondary" onPress={() => console.log('取消')}>
              取消
            </AppButton>
            <AppButton variant="danger" onPress={() => console.log('删除')}>
              删除
            </AppButton>
          </HStack>
        </VStack>
      </VStack>
    </ScrollView>
  );
};

export const GluestackInputExamples: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (text: string) => {
    setEmail(text);
    if (text && !text.includes('@')) {
      setErrors({...errors, email: '请输入有效的邮箱地址'});
    } else {
      const {email, ...rest} = errors;
      setErrors(rest);
    }
  };

  return (
    <ScrollView>
      <VStack space="xl" p="$4">
        <Heading size="xl">gluestack-ui 输入框示例</Heading>

        {/* 基础输入框 */}
        <VStack space="md">
          <Heading size="md">基础输入框</Heading>
          <AppInput
            placeholder="请输入内容"
            value={username}
            onChangeText={setUsername}
          />
        </VStack>

        {/* 带标签的输入框 */}
        <VStack space="md">
          <Heading size="md">带标签的输入框</Heading>
          <AppInput
            label="用户名"
            placeholder="请输入用户名"
            value={username}
            onChangeText={setUsername}
          />
        </VStack>

        {/* 错误状态 */}
        <VStack space="md">
          <Heading size="md">错误状态</Heading>
          <AppInput
            label="邮箱"
            placeholder="请输入邮箱"
            value={email}
            onChangeText={validateEmail}
            error={!!errors.email}
            errorMessage={errors.email}
          />
        </VStack>

        {/* 密码输入框 */}
        <VStack space="md">
          <Heading size="md">密码输入框</Heading>
          <AppInput
            label="密码"
            placeholder="请输入密码"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </VStack>

        {/* 不同变体 */}
        <VStack space="md">
          <Heading size="md">不同变体</Heading>
          <AppInput variant="outline" placeholder="outline 变体" />
          <AppInput variant="underlined" placeholder="underlined 变体" />
          <AppInput variant="rounded" placeholder="rounded 变体" />
        </VStack>

        {/* 不同尺寸 */}
        <VStack space="md">
          <Heading size="md">不同尺寸</Heading>
          <AppInput size="sm" placeholder="小尺寸" />
          <AppInput size="md" placeholder="中尺寸" />
          <AppInput size="lg" placeholder="大尺寸" />
          <AppInput size="xl" placeholder="超大尺寸" />
        </VStack>

        {/* 禁用状态 */}
        <VStack space="md">
          <Heading size="md">禁用状态</Heading>
          <AppInput isDisabled placeholder="禁用的输入框" value="不可编辑" />
        </VStack>

        {/* 只读状态 */}
        <VStack space="md">
          <Heading size="md">只读状态</Heading>
          <AppInput isReadOnly placeholder="只读输入框" value="只读内容" />
        </VStack>

        {/* 必填字段 */}
        <VStack space="md">
          <Heading size="md">必填字段</Heading>
          <AppInput isRequired label="必填字段" placeholder="请输入内容" />
        </VStack>

        {/* 手机号输入 */}
        <VStack space="md">
          <Heading size="md">手机号输入</Heading>
          <AppInput
            label="手机号"
            placeholder="请输入手机号"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </VStack>

        {/* 完整表单示例 */}
        <VStack space="md">
          <Heading size="md">完整表单示例</Heading>
          <AppInput
            label="用户名"
            placeholder="请输入用户名"
            value={username}
            onChangeText={setUsername}
            isRequired
          />
          <AppInput
            label="邮箱"
            placeholder="请输入邮箱"
            value={email}
            onChangeText={validateEmail}
            error={!!errors.email}
            errorMessage={errors.email}
            keyboardType="email-address"
            isRequired
          />
          <AppInput
            label="密码"
            placeholder="请输入密码（至少6位）"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            isRequired
          />
          <AppButton variant="primary" onPress={() => console.log('提交表单')}>
            提交
          </AppButton>
        </VStack>
      </VStack>
    </ScrollView>
  );
};

export const GluestackDataCardExamples: React.FC = () => {
  const [count, setCount] = useState(1234);

  const handleCardPress = () => {
    console.log('卡片被点击');
    setCount(count + 1);
  };

  return (
    <ScrollView>
      <VStack space="xl" p="$4">
        <Heading size="xl">gluestack-ui DataCard 示例</Heading>

        {/* 基础 DataCard */}
        <VStack space="md">
          <Heading size="md">基础 DataCard</Heading>
          <DataCard title="参与人数" value="1,234" />
        </VStack>

        {/* 带副标题的 DataCard */}
        <VStack space="md">
          <Heading size="md">带副标题的 DataCard</Heading>
          <DataCard title="参与人数" value="1,234" subtitle="较昨日 +12%" />
        </VStack>

        {/* 带图标的 DataCard */}
        <VStack space="md">
          <Heading size="md">带图标的 DataCard</Heading>
          <DataCard
            title="参与人数"
            value="1,234"
            subtitle="较昨日 +12%"
            icon={<Text>👥</Text>}
          />
        </VStack>

        {/* 无边框的 DataCard */}
        <VStack space="md">
          <Heading size="md">无边框的 DataCard</Heading>
          <DataCard title="参与人数" value="1,234" bordered={false} />
        </VStack>

        {/* 带阴影的 DataCard */}
        <VStack space="md">
          <Heading size="md">带阴影的 DataCard</Heading>
          <DataCard
            title="参与人数"
            value="1,234"
            subtitle="较昨日 +12%"
            elevate
          />
        </VStack>

        {/* 可点击的 DataCard */}
        <VStack space="md">
          <Heading size="md">可点击的 DataCard</Heading>
          <DataCard
            title="点击计数"
            value={count}
            subtitle="点击卡片增加计数"
            onPress={handleCardPress}
            elevate
          />
        </VStack>

        {/* 数字类型的 value */}
        <VStack space="md">
          <Heading size="md">数字类型的 value</Heading>
          <DataCard title="加班人数" value={567} />
        </VStack>

        {/* 完整配置的 DataCard */}
        <VStack space="md">
          <Heading size="md">完整配置的 DataCard</Heading>
          <DataCard
            title="下班指数"
            value="85.6"
            subtitle="今日平均下班时间 18:30"
            icon={<Text>📊</Text>}
            bordered
            elevate
            onPress={() => console.log('查看详情')}
          />
        </VStack>

        {/* 实际使用示例 - 数据仪表板 */}
        <VStack space="md">
          <Heading size="md">实际使用示例 - 数据仪表板</Heading>
          <VStack space="sm">
            <HStack space="sm">
              <DataCard
                title="总参与人数"
                value="2,456"
                subtitle="今日新增 +123"
                icon={<Text>👥</Text>}
                elevate
              />
              <DataCard
                title="加班人数"
                value="1,234"
                subtitle="占比 50.2%"
                icon={<Text>⏰</Text>}
                elevate
              />
            </HStack>
            <HStack space="sm">
              <DataCard
                title="准时下班"
                value="1,222"
                subtitle="占比 49.8%"
                icon={<Text>✅</Text>}
                elevate
              />
              <DataCard
                title="平均下班时间"
                value="18:45"
                subtitle="较昨日晚 15 分钟"
                icon={<Text>🕐</Text>}
                elevate
              />
            </HStack>
          </VStack>
        </VStack>

        {/* 不同数据类型展示 */}
        <VStack space="md">
          <Heading size="md">不同数据类型展示</Heading>
          <VStack space="sm">
            <DataCard title="百分比" value="85.6%" subtitle="下班指数" />
            <DataCard title="时间" value="18:30" subtitle="平均下班时间" />
            <DataCard title="金额" value="¥12,345" subtitle="本月加班费" />
            <DataCard title="比率" value="3:2" subtitle="加班 vs 准时" />
          </VStack>
        </VStack>
      </VStack>
    </ScrollView>
  );
};

export const GluestackStatusIndicatorExamples: React.FC = () => {
  return (
    <ScrollView>
      <VStack space="xl" p="$4">
        <Heading size="xl">gluestack-ui StatusIndicator 示例</Heading>

        {/* 基础状态指示器（不带标签） */}
        <VStack space="md">
          <Heading size="md">基础状态指示器（圆点）</Heading>
          <HStack space="md" alignItems="center">
            <StatusIndicator status="overtime" />
            <Text>加班</Text>
          </HStack>
          <HStack space="md" alignItems="center">
            <StatusIndicator status="ontime" />
            <Text>准时下班</Text>
          </HStack>
          <HStack space="md" alignItems="center">
            <StatusIndicator status="pending" />
            <Text>待定</Text>
          </HStack>
        </VStack>

        {/* 带标签的状态指示器 */}
        <VStack space="md">
          <Heading size="md">带标签的状态指示器</Heading>
          <VStack space="sm">
            <StatusIndicator status="overtime" showLabel />
            <StatusIndicator status="ontime" showLabel />
            <StatusIndicator status="pending" showLabel />
          </VStack>
        </VStack>

        {/* 自定义标签 */}
        <VStack space="md">
          <Heading size="md">自定义标签</Heading>
          <VStack space="sm">
            <StatusIndicator status="overtime" showLabel label="正在加班中" />
            <StatusIndicator status="ontime" showLabel label="已准时下班" />
            <StatusIndicator status="pending" showLabel label="状态未知" />
          </VStack>
        </VStack>

        {/* 不同尺寸 */}
        <VStack space="md">
          <Heading size="md">不同尺寸（不带标签）</Heading>
          <HStack space="md" alignItems="center">
            <VStack space="xs" alignItems="center">
              <StatusIndicator status="ontime" size="sm" />
              <Text size="xs">小</Text>
            </VStack>
            <VStack space="xs" alignItems="center">
              <StatusIndicator status="ontime" size="md" />
              <Text size="xs">中</Text>
            </VStack>
            <VStack space="xs" alignItems="center">
              <StatusIndicator status="ontime" size="lg" />
              <Text size="xs">大</Text>
            </VStack>
          </HStack>
        </VStack>

        {/* 不同尺寸（带标签） */}
        <VStack space="md">
          <Heading size="md">不同尺寸（带标签）</Heading>
          <VStack space="sm">
            <StatusIndicator status="ontime" size="sm" showLabel />
            <StatusIndicator status="ontime" size="md" showLabel />
            <StatusIndicator status="ontime" size="lg" showLabel />
          </VStack>
        </VStack>

        {/* 所有状态和尺寸组合 */}
        <VStack space="md">
          <Heading size="md">所有状态和尺寸组合</Heading>
          <VStack space="sm">
            <HStack space="sm" flexWrap="wrap">
              <StatusIndicator status="overtime" size="sm" showLabel />
              <StatusIndicator status="overtime" size="md" showLabel />
              <StatusIndicator status="overtime" size="lg" showLabel />
            </HStack>
            <HStack space="sm" flexWrap="wrap">
              <StatusIndicator status="ontime" size="sm" showLabel />
              <StatusIndicator status="ontime" size="md" showLabel />
              <StatusIndicator status="ontime" size="lg" showLabel />
            </HStack>
            <HStack space="sm" flexWrap="wrap">
              <StatusIndicator status="pending" size="sm" showLabel />
              <StatusIndicator status="pending" size="md" showLabel />
              <StatusIndicator status="pending" size="lg" showLabel />
            </HStack>
          </VStack>
        </VStack>

        {/* 实际使用示例 - 用户列表 */}
        <VStack space="md">
          <Heading size="md">实际使用示例 - 用户列表</Heading>
          <VStack space="sm">
            <HStack
              space="md"
              alignItems="center"
              p="$3"
              bg="$backgroundLight50"
              borderRadius="$md">
              <StatusIndicator status="overtime" size="md" />
              <VStack flex={1}>
                <Text fontWeight="$bold">张三</Text>
                <Text size="sm" color="$textLight600">
                  正在加班
                </Text>
              </VStack>
            </HStack>
            <HStack
              space="md"
              alignItems="center"
              p="$3"
              bg="$backgroundLight50"
              borderRadius="$md">
              <StatusIndicator status="ontime" size="md" />
              <VStack flex={1}>
                <Text fontWeight="$bold">李四</Text>
                <Text size="sm" color="$textLight600">
                  准时下班
                </Text>
              </VStack>
            </HStack>
            <HStack
              space="md"
              alignItems="center"
              p="$3"
              bg="$backgroundLight50"
              borderRadius="$md">
              <StatusIndicator status="pending" size="md" />
              <VStack flex={1}>
                <Text fontWeight="$bold">王五</Text>
                <Text size="sm" color="$textLight600">
                  状态待定
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </VStack>

        {/* 实际使用示例 - 统计卡片 */}
        <VStack space="md">
          <Heading size="md">实际使用示例 - 统计卡片</Heading>
          <VStack space="sm">
            <DataCard
              title="加班人数"
              value="1,234"
              subtitle={
                <HStack space="xs" alignItems="center">
                  <StatusIndicator status="overtime" size="sm" />
                  <Text size="sm" color="$textLight600">
                    占比 50.2%
                  </Text>
                </HStack>
              }
            />
            <DataCard
              title="准时下班人数"
              value="1,222"
              subtitle={
                <HStack space="xs" alignItems="center">
                  <StatusIndicator status="ontime" size="sm" />
                  <Text size="sm" color="$textLight600">
                    占比 49.8%
                  </Text>
                </HStack>
              }
            />
          </VStack>
        </VStack>

        {/* 实际使用示例 - 图例 */}
        <VStack space="md">
          <Heading size="md">实际使用示例 - 图例</Heading>
          <HStack
            space="lg"
            justifyContent="center"
            p="$4"
            bg="$backgroundLight50"
            borderRadius="$md">
            <HStack space="xs" alignItems="center">
              <StatusIndicator status="overtime" size="sm" />
              <Text size="sm">加班</Text>
            </HStack>
            <HStack space="xs" alignItems="center">
              <StatusIndicator status="ontime" size="sm" />
              <Text size="sm">准时</Text>
            </HStack>
            <HStack space="xs" alignItems="center">
              <StatusIndicator status="pending" size="sm" />
              <Text size="sm">待定</Text>
            </HStack>
          </HStack>
        </VStack>

        {/* 实际使用示例 - 时间轴 */}
        <VStack space="md">
          <Heading size="md">实际使用示例 - 时间轴</Heading>
          <VStack space="sm">
            <HStack space="md" alignItems="center">
              <Text size="sm" color="$textLight600" w="$16">
                09:00
              </Text>
              <StatusIndicator status="ontime" size="sm" />
              <Text size="sm">准时上班</Text>
            </HStack>
            <HStack space="md" alignItems="center">
              <Text size="sm" color="$textLight600" w="$16">
                18:00
              </Text>
              <StatusIndicator status="pending" size="sm" />
              <Text size="sm">下班时间</Text>
            </HStack>
            <HStack space="md" alignItems="center">
              <Text size="sm" color="$textLight600" w="$16">
                19:30
              </Text>
              <StatusIndicator status="overtime" size="sm" />
              <Text size="sm">实际下班</Text>
            </HStack>
          </VStack>
        </VStack>
      </VStack>
    </ScrollView>
  );
};
