module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.spec.ts',
    '**/__tests__/**/*.spec.tsx',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__mocks__/react-native.ts',
    '^@expo/vector-icons$': '<rootDir>/src/__mocks__/expo-vector-icons.ts',
    '^@expo/vector-icons/(.*)$': '<rootDir>/src/__mocks__/expo-vector-icons.ts',
    '^expo-constants$': '<rootDir>/src/__mocks__/expo-constants.ts',
    '^expo-haptics$': '<rootDir>/src/__mocks__/expo-haptics.ts',
    '^react-native-safe-area-context$': '<rootDir>/src/__mocks__/react-native-safe-area-context.ts',
    '^react-native-reanimated$': '<rootDir>/src/__mocks__/react-native-reanimated.ts',
    '^react-native-gesture-handler$': '<rootDir>/src/__mocks__/react-native-gesture-handler.ts',
    '^@shopify/flash-list$': '<rootDir>/src/__mocks__/flash-list.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          jsx: 'react-jsx',
          esModuleInterop: true,
          skipLibCheck: true,
        },
      },
    ],
  },
};
