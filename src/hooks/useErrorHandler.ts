import {useCallback} from 'react';
import {useAppDispatch} from './redux';
import {addNotification} from '../store/slices/uiSlice';
import {handleError, StandardError} from '../utils/errorHandler';

/**
 * 错误处理Hook
 * 提供统一的错误处理和用户通知
 * 需求: 网络错误的友好提示
 */
export const useErrorHandler = () => {
  const dispatch = useAppDispatch();

  /**
   * 处理错误并显示通知
   */
  const handleErrorWithNotification = useCallback(
    (error: any, customMessage?: string): StandardError => {
      const standardError = handleError(error);

      // 显示错误通知
      dispatch(
        addNotification({
          type: 'error',
          message: customMessage || standardError.message,
          duration: 4000,
        }),
      );

      return standardError;
    },
    [dispatch],
  );

  /**
   * 显示成功通知
   */
  const showSuccess = useCallback(
    (message: string, duration: number = 3000) => {
      dispatch(
        addNotification({
          type: 'success',
          message,
          duration,
        }),
      );
    },
    [dispatch],
  );

  /**
   * 显示警告通知
   */
  const showWarning = useCallback(
    (message: string, duration: number = 3000) => {
      dispatch(
        addNotification({
          type: 'warning',
          message,
          duration,
        }),
      );
    },
    [dispatch],
  );

  /**
   * 显示信息通知
   */
  const showInfo = useCallback(
    (message: string, duration: number = 3000) => {
      dispatch(
        addNotification({
          type: 'info',
          message,
          duration,
        }),
      );
    },
    [dispatch],
  );

  return {
    handleError: handleErrorWithNotification,
    showSuccess,
    showWarning,
    showInfo,
  };
};
