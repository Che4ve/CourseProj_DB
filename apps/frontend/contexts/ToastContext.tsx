'use client';

import { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

interface ToastContextValue {
  startOperation: () => void;
  finishOperation: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  // Счетчик активных операций
  const operationCountRef = useRef(0);
  // ID текущего toast
  const currentToastIdRef = useRef<string | number | null>(null);
  // Таймер для отложенного показа успеха
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      if (currentToastIdRef.current) {
        toast.dismiss(currentToastIdRef.current);
      }
    };
  }, []);

  const startOperation = useCallback(() => {
    operationCountRef.current += 1;

    // Отменяем отложенный показ успеха, если он был запланирован
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }

    // Показываем loading toast только если еще не показан
    if (!currentToastIdRef.current) {
      currentToastIdRef.current = toast.loading('Сохранение...', {
        duration: Number.POSITIVE_INFINITY,
      });
    }
  }, []);

  const finishOperation = useCallback(() => {
    operationCountRef.current = Math.max(0, operationCountRef.current - 1);

    // Если все операции завершены, показываем успех с задержкой
    if (operationCountRef.current === 0) {
      // Даем небольшую задержку на случай, если следующий клик уже в пути
      successTimerRef.current = setTimeout(() => {
        if (operationCountRef.current === 0 && currentToastIdRef.current) {
          toast.success('Сохранено!', {
            id: currentToastIdRef.current,
            duration: 2000,
          });
          currentToastIdRef.current = null;
        }
      }, 100);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ startOperation, finishOperation }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
