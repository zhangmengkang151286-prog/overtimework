/**
 * 薪资配置 Modal
 * 用户输入月薪，上下班时间为只读展示（修改需到个人资料页）
 * 使用 react-native-modal，遵循既有金融终端视觉风格
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5, 1.7
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import {useTheme} from '../../hooks/useTheme';
import {useAppDispatch} from '../../hooks/redux';
import {addNotification} from '../../store/slices/uiSlice';
import {typography} from '../../theme/typography';
import {spacing} from '../../theme/spacing';
import {layout} from '../../theme/layout';
import {WageConfigError} from '../../types/hourly-wage';

interface SalaryConfigModalProps {
  /** 是否可见 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 保存回调，传入月薪数值 */
  onSave: (monthlySalary: number) => Promise<void>;
  /** 当前月薪（编辑模式下回填） */
  currentSalary?: number | null;
  /** 用户上班时间（只读展示） */
  workStartTime?: string;
  /** 用户下班时间（只读展示） */
  workEndTime?: string;
}

/** 错误码 → 用户可读文案 */
const ERROR_MESSAGES: Record<WageConfigError, string> = {
  INVALID_SALARY: '请输入有效的月薪金额（正数）',
  INVALID_TIME_ORDER: '下班时间必须晚于上班时间，请到个人资料页修改',
  INSUFFICIENT_WORK_HOURS: '扣除午休后工作时长不足1小时，请到个人资料页修改上下班时间',
};

export const SalaryConfigModal: React.FC<SalaryConfigModalProps> = ({
  visible,
  onClose,
  onSave,
  currentSalary,
  workStartTime,
  workEndTime,
}) => {
  const theme = useTheme();
  const tc = theme.colors;
  const dispatch = useAppDispatch();

  const [salaryInput, setSalaryInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 打开时回填当前月薪
  useEffect(() => {
    if (visible) {
      setSalaryInput(currentSalary ? String(currentSalary) : '');
    }
  }, [visible, currentSalary]);

  // 提交处理
  const handleSave = useCallback(async () => {
    const value = parseFloat(salaryInput.trim());

    // 前端快速校验：非数字或非正数
    if (!salaryInput.trim() || isNaN(value) || value <= 0) {
      dispatch(
        addNotification({type: 'error', message: ERROR_MESSAGES.INVALID_SALARY}),
      );
      return;
    }

    setIsSaving(true);
    try {
      await onSave(value);
      onClose();
    } catch (err) {
      // onSave 内部 validateWageConfig 校验失败会抛出 WageConfigError 字符串
      const errorCode = err as WageConfigError;
      const message = ERROR_MESSAGES[errorCode] || '保存失败，请重试';
      dispatch(addNotification({type: 'error', message}));
    } finally {
      setIsSaving(false);
    }
  }, [salaryInput, onSave, onClose, dispatch]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.7}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={200}
      animationOutTiming={150}
      useNativeDriverForBackdrop
      avoidKeyboard
      style={styles.modal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, {backgroundColor: tc.surface, borderColor: tc.border}]}>
          {/* 标题 */}
          <Text style={[styles.title, {color: tc.text}]}>
            {currentSalary ? '修改薪资配置' : '配置月薪'}
          </Text>

          {/* 月薪输入 */}
          <View style={styles.field}>
            <Text style={[styles.label, {color: tc.textSecondary}]}>月薪（元）</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: tc.text,
                  backgroundColor: tc.input,
                  borderColor: tc.inputBorder,
                },
              ]}
              value={salaryInput}
              onChangeText={setSalaryInput}
              placeholder="请输入税前月薪"
              placeholderTextColor={tc.inputPlaceholder}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleSave}
              testID="salary-input"
            />
          </View>

          {/* 上下班时间（只读） */}
          <View style={styles.field}>
            <Text style={[styles.label, {color: tc.textSecondary}]}>工作时间</Text>
            <View style={[styles.timeRow]}>
              <View style={[styles.timeBox, {backgroundColor: tc.input, borderColor: tc.inputBorder}]}>
                <Text style={[styles.timeText, {color: tc.text}]}>
                  {workStartTime || '09:00'}
                </Text>
              </View>
              <Text style={[styles.timeSeparator, {color: tc.textTertiary}]}>至</Text>
              <View style={[styles.timeBox, {backgroundColor: tc.input, borderColor: tc.inputBorder}]}>
                <Text style={[styles.timeText, {color: tc.text}]}>
                  {workEndTime || '18:00'}
                </Text>
              </View>
            </View>
            <Text style={[styles.hint, {color: tc.textTertiary}]}>
              如需修改，请到个人资料页编辑
            </Text>
          </View>

          {/* 按钮区 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, {borderColor: tc.border}]}
              onPress={onClose}
              activeOpacity={0.7}
              testID="cancel-button"
            >
              <Text style={[styles.buttonText, {color: tc.textSecondary}]}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                {borderColor: tc.primary, opacity: isSaving ? 0.5 : 1},
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.7}
              testID="save-button"
            >
              <Text style={[styles.buttonText, {color: tc.primary}]}>
                {isSaving ? '保存中...' : '保存'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.base,
  },
  container: {
    width: '100%',
    borderRadius: layout.borderRadius.lg,
    borderWidth: layout.borderWidth.thin,
    padding: spacing.xl,
  },
  title: {
    ...typography.styles.h5,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  field: {
    marginBottom: spacing.base,
  },
  label: {
    ...typography.styles.caption,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  input: {
    height: layout.inputHeight.lg,
    borderWidth: layout.borderWidth.thin,
    borderRadius: layout.borderRadius.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.form,
    fontFamily: typography.fontFamily.monospace,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeBox: {
    flex: 1,
    height: layout.inputHeight.lg,
    borderWidth: layout.borderWidth.thin,
    borderRadius: layout.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: typography.fontSize.form,
    fontFamily: typography.fontFamily.monospace,
  },
  timeSeparator: {
    fontSize: typography.fontSize.sm,
  },
  hint: {
    ...typography.styles.caption,
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    height: layout.buttonHeight.md,
    borderRadius: layout.borderRadius.sm,
    borderWidth: layout.borderWidth.thin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {},
  saveButton: {},
  buttonText: {
    ...typography.styles.button,
  },
});
