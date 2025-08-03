// eslint.config.js
import js from "@eslint/js";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";
import babelParser from "@babel/eslint-parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.jsx"],  // 明确匹配 JSX 文件
    languageOptions: {
      parser: babelParser,  // 关键修复点！
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"]
        },
        ecmaFeatures: {
          jsx: true
        }
      },
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        React: "readonly",
        process: "readonly",
        document: "readonly",
        setTimeout: "readonly",
        console: "readonly"
      }
    },
    plugins: {
      "react": eslintPluginReact,
      "react-hooks": eslintPluginReactHooks,
      "react-refresh": eslintPluginReactRefresh
    },
    rules: {
      // 基础规则
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      
      // React 规则
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/react-in-jsx-scope": "off",  // React 18+ 不需要自动引入
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": "warn"
    },
    settings: {
      react: {
        version: "detect"  // 自动检测 React 版本
      }
    }
  }
];