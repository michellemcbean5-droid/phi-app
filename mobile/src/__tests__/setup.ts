import '@testing-library/jest-native/extend-expect';
import { jest } from '@jest/globals';

// Mock React Native components
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Animated: {
    Value: jest.fn().mockImplementation(() => ({
      setValue: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
    spring: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    stagger: jest.fn().mockImplementation((delay, animations) => ({
      start: jest.fn(() => {
        animations.forEach((anim: any) => anim.start && anim.start());
      }),
      stop: jest.fn(),
    })),
    timing: jest.fn(),
    decay: jest.fn(),
    sequence: jest.fn(),
    parallel: jest.fn(),
    delay: jest.fn(),
    loop: jest.fn(),
    event: jest.fn(),
    createAnimatedComponent: jest.fn().mockImplementation((component: any) => component),
  },
  StyleSheet: {
    create: jest.fn().mockImplementation((styles: any) => styles),
    flatten: jest.fn().mockImplementation((style: any) => style),
    hairlineWidth: 0.5,
    absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  },
  Platform: {
    OS: 'ios',
    select: jest.fn().mockImplementation((objs: any) => objs.ios || objs.default),
    isTesting: true,
  },
  Dimensions: {
    get: jest.fn().mockImplementation(() => ({
      window: { width: 375, height: 812, scale: 2 },
      screen: { width: 375, height: 812, scale: 2 },
    })),
  },
  PixelRatio: {
    get: jest.fn(),
    getFontScale: jest.fn().mockReturnValue(1),
    getPixelSizeForLayoutSize: jest.fn().mockImplementation((size: number) => size),
    roundToNearestPixel: jest.fn().mockImplementation((size: number) => size),
  },
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
    isFocused: jest.fn().mockReturnValue(true),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
    name: 'TestScreen',
    key: 'test-key',
  }),
  useFocusEffect: jest.fn(),
  useIsFocused: () => true,
  useScrollToTop: jest.fn(),
}));

jest.mock('@react-navigation/native-stack', () => ({
  ...jest.requireActual('@react-navigation/native-stack'),
  useNativeStackNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  ...jest.requireActual('@react-navigation/bottom-tabs'),
  useBottomTabBarHeight: () => 0,
}));

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: {
    setStyle: jest.fn(),
    setBackgroundColor: jest.fn(),
    setTranslucent: jest.fn(),
    setHidden: jest.fn(),
    currentHeight: 0,
  },
}));

jest.mock('expo-notifications', () => ({
  Notifications: {
    setNotificationHandler: jest.fn(),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    scheduleNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
    addPushTokenListener: jest.fn(),
    removePushTokenListener: jest.fn(),
  },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-location', () => ({
  Location: {
    requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getCurrentPositionAsync: jest.fn().mockResolvedValue({
      coords: {
        latitude: 0,
        longitude: 0,
        altitude: 0,
        accuracy: 0,
        altitudeAccuracy: 0,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    }),
    watchPositionAsync: jest.fn(),
    stopLocationUpdatesAsync: jest.fn(),
  },
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.fn().mockImplementation(() => null),
  MaterialIcons: jest.fn().mockImplementation(() => null),
  FontAwesome: jest.fn().mockImplementation(() => null),
  // Add other icon sets as needed
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.fn().mockImplementation(({ children }: any) => children),
  SafeAreaProvider: jest.fn().mockImplementation(({ children }: any) => children),
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
