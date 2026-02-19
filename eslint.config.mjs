import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'flutter_app/build/**',
      'flutter_app/.dart_tool/**',
      'out/**',
      'build/**',
    ],
  },
  ...nextVitals,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;
