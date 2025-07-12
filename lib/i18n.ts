import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      'nav.home': 'Home',
      'nav.vendors': 'Vendors',
      'nav.favorites': 'Favorites',
      'nav.profile': 'Profile',
      'nav.admin': 'Admin',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.clear': 'Clear',
      'common.submit': 'Submit',
      'common.close': 'Close',
      
      // Auth
      'auth.signIn': 'Sign In',
      'auth.signOut': 'Sign Out',
      'auth.signInWithGoogle': 'Sign in with Google',
      
      // Vendor
      'vendor.status.open': 'Open',
      'vendor.status.closing': 'Closing Soon',
      'vendor.status.offline': 'Offline',
      'vendor.goLive': 'Go Live',
      'vendor.endSession': 'End Session',
      'vendor.rating': 'Rating',
      'vendor.reviews': 'Reviews',
      'vendor.onTheWay': 'On The Way',
      
      // Search
      'search.placeholder': 'Search vendors, cuisine, or items...',
      'search.noResults': 'No vendors found',
      'search.filters': 'Filters',
      
      // Reviews
      'reviews.writeReview': 'Write a Review',
      'reviews.rating': 'Rating',
      'reviews.comment': 'Comment (optional)',
      'reviews.submit': 'Submit Review',
      
      // Admin
      'admin.dashboard': 'Admin Dashboard',
      'admin.vendors': 'Manage Vendors',
      'admin.users': 'Manage Users',
      'admin.reports': 'Reports',
      'admin.analytics': 'Analytics',
    }
  },
  es: {
    translation: {
      // Navigation
      'nav.home': 'Inicio',
      'nav.vendors': 'Vendedores',
      'nav.favorites': 'Favoritos',
      'nav.profile': 'Perfil',
      'nav.admin': 'Admin',
      
      // Common
      'common.loading': 'Cargando...',
      'common.error': 'Error',
      'common.success': 'Éxito',
      'common.cancel': 'Cancelar',
      'common.save': 'Guardar',
      'common.delete': 'Eliminar',
      'common.edit': 'Editar',
      'common.search': 'Buscar',
      'common.filter': 'Filtrar',
      'common.clear': 'Limpiar',
      'common.submit': 'Enviar',
      'common.close': 'Cerrar',
      
      // Auth
      'auth.signIn': 'Iniciar Sesión',
      'auth.signOut': 'Cerrar Sesión',
      'auth.signInWithGoogle': 'Iniciar sesión con Google',
      
      // Vendor
      'vendor.status.open': 'Abierto',
      'vendor.status.closing': 'Cerrando Pronto',
      'vendor.status.offline': 'Cerrado',
      'vendor.goLive': 'Ir en Vivo',
      'vendor.endSession': 'Terminar Sesión',
      'vendor.rating': 'Calificación',
      'vendor.reviews': 'Reseñas',
      'vendor.onTheWay': 'En Camino',
      
      // Search
      'search.placeholder': 'Buscar vendedores, cocina o artículos...',
      'search.noResults': 'No se encontraron vendedores',
      'search.filters': 'Filtros',
      
      // Reviews
      'reviews.writeReview': 'Escribir Reseña',
      'reviews.rating': 'Calificación',
      'reviews.comment': 'Comentario (opcional)',
      'reviews.submit': 'Enviar Reseña',
      
      // Admin
      'admin.dashboard': 'Panel de Admin',
      'admin.vendors': 'Gestionar Vendedores',
      'admin.users': 'Gestionar Usuarios',
      'admin.reports': 'Reportes',
      'admin.analytics': 'Analíticas',
    }
  },
  // Add more languages as needed
  tl: {
    translation: {
      'nav.home': 'Tahanan',
      'nav.vendors': 'Mga Vendor',
      'nav.favorites': 'Mga Paborito',
      'nav.profile': 'Profile',
      'common.loading': 'Naglo-load...',
      'common.search': 'Maghanap',
      'vendor.status.open': 'Bukas',
      'vendor.status.closing': 'Malapit nang Magsara',
      'vendor.status.offline': 'Sarado',
    }
  },
  vi: {
    translation: {
      'nav.home': 'Trang chủ',
      'nav.vendors': 'Người bán',
      'nav.favorites': 'Yêu thích',
      'nav.profile': 'Hồ sơ',
      'common.loading': 'Đang tải...',
      'common.search': 'Tìm kiếm',
      'vendor.status.open': 'Mở',
      'vendor.status.closing': 'Sắp đóng',
      'vendor.status.offline': 'Đóng',
    }
  },
  zh: {
    translation: {
      'nav.home': '首页',
      'nav.vendors': '商家',
      'nav.favorites': '收藏',
      'nav.profile': '个人资料',
      'common.loading': '加载中...',
      'common.search': '搜索',
      'vendor.status.open': '营业中',
      'vendor.status.closing': '即将关闭',
      'vendor.status.offline': '已关闭',
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

export default i18n