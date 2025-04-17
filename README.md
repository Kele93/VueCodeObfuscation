# VueCodeObfuscation

Vue 源码混淆工具 - 保护你的 Vue 应用免受逆向工程的威胁

## 项目简介

VueCodeObfuscation 是一个专为 Vue.js 应用设计的代码混淆工具，通过多种混淆技术使您的源代码难以被理解和逆向工程，同时保持应用的正常功能。

## 功能特点

- **变量重命名**：将有意义的变量名替换为无意义的短名称
- **死代码注入**：插入永远不会执行的代码片段迷惑分析者
- **字符串加密**：对字符串进行加密处理，运行时解密
- **控制流扁平化**：重构代码的控制流使其难以理解
- **自定义混淆规则**：根据需求自定义混淆级别和规则
- **支持 Vue2 和 Vue3**：兼容不同版本的 Vue 框架
- **webpack 插件支持**：无缝集成到 webpack 构建流程

## 安装

```bash
npm install vue-code-obfuscation --save-dev
# 或使用 yarn
yarn add vue-code-obfuscation --dev
```

## 基本使用

### 在 Vue CLI 项目中使用

在`vue.config.js`中配置：

```js
const VueObfuscator = require("vue-code-obfuscation");

module.exports = {
  configureWebpack: {
    plugins: [
      new VueObfuscator({
        // 混淆配置选项
        compact: true,
        controlFlowFlattening: true,
        // 更多配置...
      }),
    ],
  },
};
```

### 在 Webpack 中使用

```js
const VueObfuscator = require("vue-code-obfuscation");

module.exports = {
  // webpack配置
  plugins: [
    new VueObfuscator({
      // 混淆配置选项
    }),
  ],
};
```

## 配置选项

| 选项                           | 类型    | 默认值 | 描述                         |
| ------------------------------ | ------- | ------ | ---------------------------- |
| compact                        | Boolean | true   | 压缩代码，移除空白字符和注释 |
| controlFlowFlattening          | Boolean | false  | 控制流扁平化                 |
| controlFlowFlatteningThreshold | Number  | 0.75   | 控制流扁平化应用比例         |
| stringArray                    | Boolean | true   | 将字符串提取到单独的数组中   |
| stringArrayEncoding            | String  | false  | 字符串数组编码方式           |
| ...                            | ...     | ...    | ...                          |

## 最佳实践

- 仅在生产环境启用混淆，开发环境保持代码可读性
- 根据应用性能要求调整混淆级别
- 混淆后测试应用各项功能确保无误

## 常见问题

**Q: 混淆后应用性能会下降吗？**

A: 取决于混淆配置，强度越高可能对性能影响越大。建议进行性能测试。

**Q: 能 100%防止代码被逆向工程吗？**

A: 混淆只能增加逆向工程的难度，无法完全防止。它是安全策略的补充而非替代。

## 许可证

MIT License
