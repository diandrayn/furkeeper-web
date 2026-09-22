import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { PetProvider } from './context/PetContext';
import { AddressProvider } from './context/AddressContext';
import { HistoryProvider } from './context/HistoryContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';
import { DashboardProvider } from './context/DashboardContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileLayout from './components/ProfileLayout';
import ToastContainer from './components/ToastContainer';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardRoute from './components/dashboard/DashboardRoute';
import DashboardOverviewPage from './pages/dashboard/DashboardOverviewPage';
import DashboardProductsPage from './pages/dashboard/DashboardProductsPage';
import DashboardServicesPage from './pages/dashboard/DashboardServicesPage';
import DashboardOrdersPage from './pages/dashboard/DashboardOrdersPage';
import DashboardBookingsPage from './pages/dashboard/DashboardBookingsPage';
import DashboardChatPage from './pages/dashboard/DashboardChatPage';
import DashboardReviewsPage from './pages/dashboard/DashboardReviewsPage';
import DashboardProfilePage from './pages/dashboard/DashboardProfilePage';
import DashboardWithdrawalsPage from './pages/dashboard/DashboardWithdrawalsPage';
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminPartnersPage from './pages/admin/AdminPartnersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminStoresPage from './pages/admin/AdminStoresPage';
import AdminStoreDetailPage from './pages/admin/AdminStoreDetailPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminHelpMessagesPage from './pages/admin/AdminHelpMessagesPage';
import AdminFaqPage from './pages/admin/AdminFaqPage';
import AdminFinancePage from './pages/admin/AdminFinancePage';
import AdminRolesPage from './pages/admin/AdminRolesPage';
import AdminActivityLogPage from './pages/admin/AdminActivityLogPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegisterPage from './pages/RegisterPage';
import BuyerRegisterPage from './pages/BuyerRegisterPage';
import PartnerRegisterPage from './pages/PartnerRegisterPage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ServiceListingPage from './pages/ServiceListingPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import StorePage from './pages/StorePage';
import StoreListPage from './pages/StoreListPage';
import ApplicationStatusPage from './pages/ApplicationStatusPage';
import ResubmitApplicationPage from './pages/ResubmitApplicationPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailedPage from './pages/PaymentFailedPage';
import PaymentPendingPage from './pages/PaymentPendingPage';
import ProfilePage from './pages/ProfilePage';
import PetsPage from './pages/PetsPage';
import HistoryPage from './pages/HistoryPage';
import AddressesPage from './pages/AddressesPage';
import OrderStatusPage from './pages/OrderStatusPage';
import BookingStatusPage from './pages/BookingStatusPage';
import ChatPage from './pages/ChatPage';
import NotificationCenterPage from './pages/NotificationCenterPage';
import AboutUsPage from './pages/AboutUsPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ContactPage from './pages/ContactPage';
import BantuanSayaPage from './pages/BantuanSayaPage';
import LegalPage from './pages/LegalPage';

export default function App() {
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
                  <BrowserRouter>
                    <ErrorBoundary>
                      <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/produk" element={<ProductListingPage />} />
                      <Route path="/produk/:id" element={<ProductDetailPage />} />
                      <Route path="/jasa" element={<ServiceListingPage />} />
                      <Route path="/jasa/:id" element={<ServiceDetailPage />} />
                      <Route path="/toko" element={<StoreListPage />} />
                      <Route path="/toko/:storeId" element={<StorePage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/booking/:serviceId" element={<BookingPage />} />
                      <Route path="/pembayaran/sukses" element={<PaymentSuccessPage />} />
                      <Route path="/pembayaran/gagal" element={<PaymentFailedPage />} />
                      <Route path="/pembayaran/pending" element={<PaymentPendingPage />} />
                      <Route path="/pembayaran/:orderId" element={<PaymentPage />} />
                      <Route path="/tentang-kami" element={<AboutUsPage />} />
                      <Route path="/bantuan" element={<HelpCenterPage />} />
                      <Route path="/kontak" element={<ContactPage />} />
                      <Route path="/syarat-ketentuan" element={<LegalPage type="terms" />} />
                      <Route path="/kebijakan-privasi" element={<LegalPage type="privacy" />} />
                      <Route path="/kebijakan-pembatalan" element={<LegalPage type="cancellation" />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/register/buyer" element={<BuyerRegisterPage />} />
                      <Route path="/register/partner" element={<PartnerRegisterPage />} />
                      <Route path="/status-pengajuan" element={<ApplicationStatusPage />} />
                      <Route path="/pengajuan-ulang" element={<ResubmitApplicationPage />} />

                      <Route element={<ProtectedRoute />}>
                        <Route path="/keranjang" element={<CartPage />} />
                        <Route element={<ProfileLayout />}>
                          <Route path="/profil" element={<ProfilePage />} />
                          <Route path="/profil/hewan" element={<PetsPage />} />
                          <Route path="/profil/riwayat" element={<HistoryPage />} />
                          <Route path="/profil/alamat" element={<AddressesPage />} />
                        </Route>
                        <Route path="/pesanan/:orderId" element={<OrderStatusPage />} />
                        <Route path="/booking/:bookingId/status" element={<BookingStatusPage />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/chat/:conversationId" element={<ChatPage />} />
                        <Route path="/notifikasi" element={<NotificationCenterPage />} />
                        <Route path="/bantuan-saya" element={<BantuanSayaPage />} />

                        <Route path="/dashboard/toko" element={<DashboardRoute statusField="sellerStatus" />}>
                          <Route element={<DashboardLayout mode="toko" />}>
                            <Route index element={<DashboardOverviewPage mode="toko" />} />
                            <Route path="produk" element={<DashboardProductsPage />} />
                            <Route path="pesanan" element={<DashboardOrdersPage />} />
                            <Route path="pesan" element={<DashboardChatPage mode="toko" />} />
                            <Route path="ulasan" element={<DashboardReviewsPage mode="toko" />} />
                            <Route path="profil" element={<DashboardProfilePage mode="toko" />} />
                            <Route path="penarikan" element={<DashboardWithdrawalsPage mode="toko" />} />
                          </Route>
                        </Route>

                        <Route path="/dashboard/jasa" element={<DashboardRoute statusField="providerStatus" />}>
                          <Route element={<DashboardLayout mode="jasa" />}>
                            <Route index element={<DashboardOverviewPage mode="jasa" />} />
                            <Route path="layanan" element={<DashboardServicesPage />} />
                            <Route path="booking" element={<DashboardBookingsPage />} />
                            <Route path="pesan" element={<DashboardChatPage mode="jasa" />} />
                            <Route path="ulasan" element={<DashboardReviewsPage mode="jasa" />} />
                            <Route path="profil" element={<DashboardProfilePage mode="jasa" />} />
                            <Route path="penarikan" element={<DashboardWithdrawalsPage mode="jasa" />} />
                          </Route>
                        </Route>

                        <Route path="/admin" element={<AdminRoute />}>
                          <Route element={<AdminLayout />}>
                            <Route index element={<AdminOverviewPage />} />
                            <Route path="mitra" element={<AdminPartnersPage />} />
                            <Route path="pengguna" element={<AdminUsersPage />} />
                            <Route path="toko" element={<AdminStoresPage />} />
                            <Route path="toko/:storeId" element={<AdminStoreDetailPage />} />
                            <Route path="produk" element={<AdminProductsPage />} />
                            <Route path="jasa" element={<AdminServicesPage />} />
                            <Route path="transaksi" element={<AdminOrdersPage />} />
                            <Route path="laporan" element={<AdminReportsPage />} />
                            <Route path="kategori" element={<AdminCategoriesPage />} />
                            <Route path="ulasan" element={<AdminReviewsPage />} />
                            <Route path="pesan" element={<AdminHelpMessagesPage />} />
                            <Route path="faq" element={<AdminFaqPage />} />
                            <Route path="keuangan" element={<AdminFinancePage />} />
                            <Route path="role-admin" element={<AdminRolesPage />} />
                            <Route path="log-aktivitas" element={<AdminActivityLogPage />} />
                            <Route path="pengaturan" element={<AdminSettingsPage />} />
                          </Route>
                        </Route>
                      </Route>
                    </Routes>
                    </ErrorBoundary>
                    <ToastContainer />
                  </BrowserRouter>
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