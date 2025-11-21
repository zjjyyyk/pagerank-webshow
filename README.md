# PageRank 算法性能对比工具

[English](./README.zh.md) | 简体中文

🚀 **[在线演示](https://zjjyyyk.github.io/pagerank-webshow/)**

## 💡 这是什么？

一个基于 Web 的工具，用于**实时可视化和对比不同 PageRank 算法实现的性能**。

### 🎯 核心理念

**将 C++ 算法编译成 WebAssembly，直接在浏览器中运行高性能算法！**

通过 Emscripten 将 C++ 代码转换为 WASM，我们让网页端也能享受接近原生的计算速度。不需要后端服务器，全部计算在你的浏览器中完成！

- **JavaScript vs WebAssembly (C++)** - 亲眼见证速度差异
- **多种算法实现** - 目前支持幂迭代法和随机游走法，更多算法即将加入
- **真实数据集** - 在实际网络上测试（DBLP、Enron、天体物理引用网络）
- **交互式参数** - 调整阻尼因子、迭代次数等

## 🎯 快速开始

1. 访问[在线网站](https://zjjyyyk.github.io/pagerank-webshow/)
2. 选择一个数据集（或上传自己的）
3. 选择一个算法
4. 点击"Compute PageRank"
5. 对比执行时间和结果！

## 📊 功能特性

- ⚡ **性能指标** - 执行时间追踪
- 📈 **误差分析** - L1、L2 和最大相对误差
- 🎨 **可视化对比** - 并排显示结果
- 📤 **自定义数据集** - 上传你自己的图（边列表格式）
- 🔄 **支持两种图类型** - 有向图和无向图

## 🛠️ 技术栈

- React + TypeScript + Vite
- WebAssembly (Emscripten)
- Web Workers（非阻塞计算）
- Tailwind CSS

---

为在浏览器中探索算法性能而生 🚀
