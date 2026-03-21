/**
 * 自定义弹框组件 — 替代系统 Alert.alert
 *
 * 风格与 CalendarView / HistoricalStatusIndicator 弹窗一致：
 * - 黑色半透明遮罩 rgba(0,0,0,0.8)
 * - 居中卡片，圆角 16，纯黑/纯白背景
 * - fade 动画，零延迟
 *
 * 性能要点：
 * - 使用命令式 API（全局单例），不在每个页面挂载 Modal
 * - 通过 EventEmitter 驱动，避免 Context 导致的重渲染
 */

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import {typography} from '../theme/typography';

// ==================== 类型 ====================

interface AlertButton {
  text: string;
  onPress?: () => void;
  /** 'cancel' 显示为次要样式，'destructive' 显示为红色 */
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

// ==================== 事件总线（轻量，零依赖）====================

type Listener = (config: AlertConfig) => void;
let _listener: Listener | null = null;

const alertBus = {
  on(fn: Listener) { _listener = fn; },
  off() { _listener = null; },
  emit(config: AlertConfig) { _listener?.(config); },
};

// ==================== 命令式 API ====================

/**
 * 全局调用，签名与 Alert.alert 一致
 * customAlert('标题', '内容', [{text:'确定'}])
 */
export const customAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  alertBus.emit({title, message, buttons});
};

// ==================== 组件 ====================

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = Math.min(300, SCREEN_WIDTH - 60);

/**
 * 挂载在 App 根节点，全局唯一
 */
export const CustomAlertProvider: React.FC = React.memo(() => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const theme = useSelector((state: any) => state?.ui?.theme || 'dark');
  const isDark = theme === 'dark';

  // 缓存 config ref，关闭动画期间仍能读取
  const configRef = useRef<AlertConfig | null>(null);

  useEffect(() => {
    alertBus.on((cfg) => {
      configRef.current = cfg;
      setConfig(cfg);
      setVisible(true);
    });
    return () => alertBus.off();
  }, []);

  const handlePress = useCallback((btn?: AlertButton) => {
    setVisible(false);
    // 延迟执行回调，等 Modal 关闭动画结束，避免卡顿
    if (btn?.onPress) {
      const cb = btn.onPress;
      setTimeout(cb, 200);
    }
  }, []);

  const handleBackdropPress = useCallback(() => {
    // 如果只有一个按钮或没有按钮，点击遮罩关闭
    const buttons = configRef.current?.buttons;
    if (!buttons || buttons.length <= 1) {
      handlePress(buttons?.[0]);
    }
  }, [handlePress]);

  // 主题色
  const cardBg = isDark ? '#000000' : '#FFFFFF';
  const titleColor = isDark ? '#E8EAED' : '#000000';
  const messageColor = isDark ? '#A0A0A0' : '#666666';
  const btnBg = isDark ? '#27272A' : '#E5E7EB';
  const btnTextColor = isDark ? '#E8EAED' : '#000000';
  const cancelTextColor = isDark ? '#888888' : '#999999';
  const destructiveColor = '#FF4444';
  const dividerColor = isDark ? 'rgba(128,128,128,0.15)' : 'rgba(0,0,0,0.08)';

  if (!config) return null;

  const buttons = config.buttons && config.buttons.length > 0
    ? config.buttons
    : [{text: '确定'}];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => handlePress(buttons.find(b => b.style === 'cancel') || buttons[0])}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <View
          style={[styles.card, {backgroundColor: cardBg}]}
          // 阻止卡片内的点击穿透到遮罩
          onStartShouldSetResponder={() => true}
        >
          {/* 标题 */}
          <Text style={[styles.title, {color: titleColor}]}>
            {config.title}
          </Text>

          {/* 内容 */}
          {config.message ? (
            <Text style={[styles.message, {color: messageColor}]}>
              {config.message}
            </Text>
          ) : null}

          {/* 按钮区域 */}
          {buttons.length === 1 ? (
            /* 单按钮 — 全宽 */
            <TouchableOpacity
              style={[styles.singleBtn, {backgroundColor: btnBg}]}
              onPress={() => handlePress(buttons[0])}
              activeOpacity={0.6}
            >
              <Text style={[
                styles.btnText,
                {color: buttons[0].style === 'destructive' ? destructiveColor : btnTextColor},
              ]}>
                {buttons[0].text}
              </Text>
            </TouchableOpacity>
          ) : (
            /* 多按钮 — 横排 */
            <View style={[styles.btnRow, {borderTopColor: dividerColor}]}>
              {buttons.map((btn, idx) => {
                const isLast = idx === buttons.length - 1;
                let color = btnTextColor;
                if (btn.style === 'cancel') color = cancelTextColor;
                if (btn.style === 'destructive') color = destructiveColor;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.rowBtn,
                      !isLast && {borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: dividerColor},
                    ]}
                    onPress={() => handlePress(btn)}
                    activeOpacity={0.6}
                  >
                    <Text style={[
                      styles.btnText,
                      {color},
                      btn.style === 'cancel' && {fontWeight: '400'},
                    ]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
});
CustomAlertProvider.displayName = 'CustomAlertProvider';

// ==================== 样式 ====================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  // 单按钮
  singleBtn: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  // 多按钮横排
  btnRow: {
    flexDirection: 'row',
    marginTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: typography.fontSize.form,
    fontWeight: '600',
  },
});
