import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

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

      // Explore View Toggles
      'explore.mapView': 'Map View',
      'explore.listView': 'List View',
    }
  },
  es: {
    translation: {
      'nav.home': 'Inicio',
      'nav.vendors': 'Vendedores',
      'nav.favorites': 'Favoritos',
      'nav.profile': 'Perfil',
      'nav.admin': 'Admin',

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

      'auth.signIn': 'Iniciar Sesión',
      'auth.signOut': 'Cerrar Sesión',
      'auth.signInWithGoogle': 'Iniciar sesión con Google',

      'vendor.status.open': 'Abierto',
      'vendor.status.closing': 'Cerrando Pronto',
      'vendor.status.offline': 'Cerrado',
      'vendor.goLive': 'Ir en Vivo',
      'vendor.endSession': 'Terminar Sesión',
      'vendor.rating': 'Calificación',
      'vendor.reviews': 'Reseñas',
      'vendor.onTheWay': 'En Camino',

      'search.placeholder': 'Buscar vendedores, cocina o artículos...',
      'search.noResults': 'No se encontraron vendedores',
      'search.filters': 'Filtros',

      'reviews.writeReview': 'Escribir Reseña',
      'reviews.rating': 'Calificación',
      'reviews.comment': 'Comentario (opcional)',
      'reviews.submit': 'Enviar Reseña',

      'admin.dashboard': 'Panel de Admin',
      'admin.vendors': 'Gestionar Vendedores',
      'admin.users': 'Gestionar Usuarios',
      'admin.reports': 'Reportes',
      'admin.analytics': 'Analíticas',

      'explore.mapView': 'Mapa',
      'explore.listView': 'Lista',
    }
  },

  tl: {
    translation: {
      'nav.home': 'Tahanan',
      'nav.vendors': 'Mga Vendor',
      'nav.favorites': 'Mga Paborito',
      'nav.profile': 'Profile',
      'nav.admin': 'Admin',

      'common.loading': 'Naglo-load...',
      'common.error': 'Error',
      'common.success': 'Tagumpay',
      'common.cancel': 'Kanselahin',
      'common.save': 'I-save',
      'common.delete': 'Tanggalin',
      'common.edit': 'I-edit',
      'common.search': 'Maghanap',
      'common.filter': 'Filter',
      'common.clear': 'Linisin',
      'common.submit': 'Ipasa',
      'common.close': 'Isara',

      'auth.signIn': 'Mag-sign In',
      'auth.signOut': 'Mag-sign Out',
      'auth.signInWithGoogle': 'Mag-sign in gamit ang Google',

      'vendor.status.open': 'Bukas',
      'vendor.status.closing': 'Malapit nang Magsara',
      'vendor.status.offline': 'Sarado',
      'vendor.goLive': 'Mag-Live',
      'vendor.endSession': 'Tapusin ang Session',
      'vendor.rating': 'Rating',
      'vendor.reviews': 'Mga Review',
      'vendor.onTheWay': 'Paparating',

      'search.placeholder': 'Maghanap ng mga vendor, pagkain, o items...',
      'search.noResults': 'Walang nahanap na vendor',
      'search.filters': 'Mga Filter',

      'reviews.writeReview': 'Sumulat ng Review',
      'reviews.rating': 'Rating',
      'reviews.comment': 'Komento (opsyonal)',
      'reviews.submit': 'Ipasa ang Review',

      'admin.dashboard': 'Admin Dashboard',
      'admin.vendors': 'Pamahalaan ang mga Vendor',
      'admin.users': 'Pamahalaan ang mga User',
      'admin.reports': 'Mga Ulat',
      'admin.analytics': 'Analytics',

      'explore.mapView': 'Mapa',
      'explore.listView': 'Listahan',
    }
  },

  vi: {
    translation: {
      'nav.home': 'Trang chủ',
      'nav.vendors': 'Người bán',
      'nav.favorites': 'Yêu thích',
      'nav.profile': 'Hồ sơ',
      'nav.admin': 'Quản trị',

      'common.loading': 'Đang tải...',
      'common.error': 'Lỗi',
      'common.success': 'Thành công',
      'common.cancel': 'Hủy',
      'common.save': 'Lưu',
      'common.delete': 'Xóa',
      'common.edit': 'Chỉnh sửa',
      'common.search': 'Tìm kiếm',
      'common.filter': 'Lọc',
      'common.clear': 'Xóa',
      'common.submit': 'Gửi',
      'common.close': 'Đóng',

      'auth.signIn': 'Đăng nhập',
      'auth.signOut': 'Đăng xuất',
      'auth.signInWithGoogle': 'Đăng nhập bằng Google',

      'vendor.status.open': 'Mở',
      'vendor.status.closing': 'Sắp đóng',
      'vendor.status.offline': 'Đóng',
      'vendor.goLive': 'Phát trực tiếp',
      'vendor.endSession': 'Kết thúc phiên',
      'vendor.rating': 'Đánh giá',
      'vendor.reviews': 'Nhận xét',
      'vendor.onTheWay': 'Đang trên đường',

      'search.placeholder': 'Tìm kiếm người bán, món ăn hoặc sản phẩm...',
      'search.noResults': 'Không tìm thấy người bán nào',
      'search.filters': 'Bộ lọc',

      'reviews.writeReview': 'Viết đánh giá',
      'reviews.rating': 'Đánh giá',
      'reviews.comment': 'Bình luận (tùy chọn)',
      'reviews.submit': 'Gửi đánh giá',

      'admin.dashboard': 'Bảng điều khiển quản trị',
      'admin.vendors': 'Quản lý người bán',
      'admin.users': 'Quản lý người dùng',
      'admin.reports': 'Báo cáo',
      'admin.analytics': 'Phân tích',

      'explore.mapView': 'Bản đồ',
      'explore.listView': 'Danh sách',
    }
  },

  zh: {
    translation: {
      'nav.home': '首页',
      'nav.vendors': '商家',
      'nav.favorites': '收藏',
      'nav.profile': '个人资料',
      'nav.admin': '管理员',

      'common.loading': '加载中...',
      'common.error': '错误',
      'common.success': '成功',
      'common.cancel': '取消',
      'common.save': '保存',
      'common.delete': '删除',
      'common.edit': '编辑',
      'common.search': '搜索',
      'common.filter': '筛选',
      'common.clear': '清除',
      'common.submit': '提交',
      'common.close': '关闭',

      'auth.signIn': '登录',
      'auth.signOut': '退出',
      'auth.signInWithGoogle': '使用Google登录',

      'vendor.status.open': '营业中',
      'vendor.status.closing': '即将关闭',
      'vendor.status.offline': '已关闭',
      'vendor.goLive': '开始直播',
      'vendor.endSession': '结束会话',
      'vendor.rating': '评分',
      'vendor.reviews': '评价',
      'vendor.onTheWay': '在路上',

      'search.placeholder': '搜索商家、美食或商品...',
      'search.noResults': '未找到商家',
      'search.filters': '筛选器',

      'reviews.writeReview': '写评价',
      'reviews.rating': '评分',
      'reviews.comment': '评论（可选）',
      'reviews.submit': '提交评价',

      'admin.dashboard': '管理员仪表板',
      'admin.vendors': '管理商家',
      'admin.users': '管理用户',
      'admin.reports': '报告',
      'admin.analytics': '分析',

      'explore.mapView': '地图',
      'explore.listView': '列表',
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
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

export default i18n
