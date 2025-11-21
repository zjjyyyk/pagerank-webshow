# PageRank Web - 快速开始指南

## 📦 安装依赖

```powershell
npm install
```

## 🚀 启动开发服务器

```powershell
npm run dev
```

应用将在 http://localhost:5173 启动

## 🔨 编译 WebAssembly（可选）

项目包含预编译的模拟 WASM 文件。要使用真实的 WASM 性能：

### Windows 用户

1. 安装 WSL (Windows Subsystem for Linux):
```powershell
wsl --install
```

2. 在 WSL 中安装 Emscripten:
```bash
# 在 WSL 终端中
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

3. 编译 WASM:
```bash
cd /mnt/c/Users/zjj/Desktop/pagerank-web
npm run compile:wasm
```

### Linux/Mac 用户

```bash
# 安装 Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# 返回项目目录编译
cd /path/to/pagerank-web
npm run compile:wasm
```

## 🧪 运行测试

```powershell
# 运行所有测试
npm test

# 测试覆盖率
npm run test:coverage
```

## 🏗️ 构建生产版本

```powershell
npm run build
npm run preview
```

## 📝 主要功能

1. **加载数据集**: 选择内置数据集或上传自定义文件
2. **选择算法**: Power Iteration 或 Random Walk（JS/WASM 版本）
3. **调整参数**: Alpha、迭代次数、游走次数
4. **计算 PageRank**: 点击"计算 PageRank"按钮
5. **对比结果**: 设置 Ground Truth 并查看误差指标

## ⚠️ 注意事项

- 首次运行时，WASM 算法会提示未编译（需要 Emscripten）
- JavaScript 版本可以直接使用，无需额外配置
- 大型图数据（>1万节点）建议使用 WASM 版本以获得更好性能

## 🐛 常见问题

### Q: WASM 加载失败？
A: 使用 JavaScript 版本算法，或按照上述步骤编译 WASM

### Q: 文件上传失败？
A: 检查文件格式（edge list），大小限制 50MB

### Q: 计算卡住不动？
A: 刷新页面重启 Worker，或减小数据集/迭代次数

## 📞 获取帮助

遇到问题？查看 README.md 获取详细文档。
