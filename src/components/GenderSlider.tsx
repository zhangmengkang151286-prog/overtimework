import React, {useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  StyleSheet,
} from 'react-native';

interface GenderSliderProps {
  value: 'male' | 'female' | undefined;
  onChange: (gender: 'male' | 'female') => void;
}

const TRACK_WIDTH = 260;
const THUMB_WIDTH = 126;
const TRACK_PADDING = 2;
const TRACK_BORDER = 1;
// 轨道内部可用宽度 = 总宽度 - 两侧border - 两侧padding
const MAX_TRANSLATE = TRACK_WIDTH - THUMB_WIDTH - (TRACK_PADDING + TRACK_BORDER) * 2;

// 性别滑块组件
const GenderSlider: React.FC<GenderSliderProps> = ({value, onChange}) => {
  const slideAnim = useRef(new Animated.Value(value === 'female' ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: value === 'female' ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [value, slideAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 20) {
          onChange(gestureState.dx > 0 ? 'female' : 'male');
        }
      },
    }),
  ).current;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MAX_TRANSLATE],
  });

  const handleMale = useCallback(() => onChange('male'), [onChange]);
  const handleFemale = useCallback(() => onChange('female'), [onChange]);

  // 男选中时：黑色滑块，无边框（和轨道融合）
  // 女选中时：白色滑块，白色边框（和滑块融合）
  const isMale = value === 'male';
  const thumbBorderColor = isMale ? '#1A1A1A' : '#FFFFFF';
  const thumbBgColor = isMale ? '#000000' : '#FFFFFF';

  return (
    <View style={sliderStyles.track} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          sliderStyles.thumb,
          {
            backgroundColor: thumbBgColor,
            borderColor: thumbBorderColor,
            transform: [{translateX}],
          },
        ]}
      />
      <TouchableOpacity
        style={sliderStyles.option}
        onPress={handleMale}
        activeOpacity={0.8}>
        <Text
          style={[
            sliderStyles.optionText,
            {
              color: isMale ? '#FFFFFF' : '#71717A',
              fontWeight: isMale ? '600' : '400',
            },
          ]}>
          ♂ 男
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={sliderStyles.option}
        onPress={handleFemale}
        activeOpacity={0.8}>
        <Text
          style={[
            sliderStyles.optionText,
            {
              color: !isMale ? '#000000' : '#71717A',
              fontWeight: !isMale ? '600' : '400',
            },
          ]}>
          ♀ 女
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    padding: TRACK_PADDING,
  },
  thumb: {
    position: 'absolute',
    left: TRACK_PADDING,
    width: THUMB_WIDTH,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    zIndex: 1,
  },
  optionText: {
    fontSize: 15,
  },
});

export default React.memo(GenderSlider);
