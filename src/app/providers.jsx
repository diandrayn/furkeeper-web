'use client';

import { Suspense } from 'react';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { PetProvider } from '@/context/PetContext';
import { AddressProvider } from '@/context/AddressContext';
import { HistoryProvider } from '@/context/HistoryContext';
import { ChatProvider } from '@/context/ChatContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { DashboardProvider } from '@/context/DashboardContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ToastContainer from '@/components/ToastContainer';

export default function Providers({ children }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <PetProvider>
            <AddressProvider>
              <HistoryProvider>
                <NotificationProvider>
                  <ChatProvider>
                    <DashboardProvider>
                      <ErrorBoundary>
                        <Suspense fallback={null}>{children}</Suspense>
                      </ErrorBoundary>
                      <ToastContainer />
                    </DashboardProvider>
                  </ChatProvider>
                </NotificationProvider>
              </HistoryProvider>
            </AddressProvider>
          </PetProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
