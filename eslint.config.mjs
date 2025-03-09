// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  {
    files: ["**/*.{js,ts,vue}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "all", argsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-member-accessibility": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/parameter-properties": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/ban-ts-ignore": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      // Vue Test Utilsのwrapper.vmアクセスでの型エラーを抑制
      "vue/no-setup-props-destructure": "off",
      // 末尾のカンマを許容
      "comma-dangle": ["error", "always-multiline"],
      // 余分なセミコロンを許容
      semi: ["error", "always"],
      // 文字列はシングルクォートで統一
      quotes: ["error", "single"],
    },
  },
  {
    // テストファイル向けのルール
    files: ["test/**/*.{js,ts,vue}"],
    rules: {
      // テスト内でのany型の使用を許容
      "@typescript-eslint/no-explicit-any": "off",
      // テスト内でのwrapper.vm型エラーを抑制
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
);
