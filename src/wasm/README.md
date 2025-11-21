# WebAssembly PageRank Implementation

此目录包含 PageRank 算法的 C++ 实现，可编译为 WebAssembly。

## 文件说明

- `pagerank.cpp` - C++ 源代码
- `compile.sh` - Emscripten 编译脚本

## 编译要求

### 1. 安装 Emscripten SDK

```bash
# 下载 Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# 安装最新版本
./emsdk install latest
./emsdk activate latest

# 激活环境变量（每次新终端都需要运行）
source ./emsdk_env.sh  # Linux/Mac
emsdk_env.bat          # Windows
```

### 2. 编译 WASM

```bash
cd src/wasm
bash compile.sh
```

或在 Windows PowerShell 中：

```powershell
cd src/wasm
bash compile.sh  # 如果安装了 Git Bash
# 或
wsl bash compile.sh  # 如果使用 WSL
```

## 编译输出

编译成功后会在 `public/` 目录生成：

- `pagerank.js` - JavaScript 加载器和接口
- `pagerank.wasm` - 编译后的 WebAssembly 二进制文件

## 导出的函数

### `powerIteration`

```cpp
void powerIteration(
    int nodes,           // 节点数量
    int edgeCount,       // 边数量
    int* edgeSources,    // 源节点数组
    int* edgeTargets,    // 目标节点数组
    double alpha,        // 阻尼因子
    int iterations,      // 迭代次数
    double* resultPtr    // 结果数组指针
)
```

### `randomWalk`

```cpp
void randomWalk(
    int nodes,           // 节点数量
    int edgeCount,       // 边数量
    int* edgeSources,    // 源节点数组
    int* edgeTargets,    // 目标节点数组
    double alpha,        // 阻尼因子
    int walksPerNode,    // 每节点游走次数
    double* resultPtr,   // 结果数组指针
    unsigned int seed    // 随机种子
)
```

## 使用示例

参见 `src/workers/pagerank.worker.ts` 中的 WASM 调用实现。

## 性能优化

编译时使用的优化选项：

- `-O3` - 最高级别优化
- `ALLOW_MEMORY_GROWTH` - 允许动态内存增长
- `MAXIMUM_MEMORY=2GB` - 最大内存限制

## 故障排除

### 编译错误

1. **emcc not found**: 确保已激活 Emscripten 环境
2. **内存不足**: 减小测试数据集大小
3. **权限错误**: 确保脚本有执行权限 (`chmod +x compile.sh`)

### 运行时错误

1. **WASM 加载失败**: 检查浏览器控制台，确保文件路径正确
2. **内存溢出**: 增加 `MAXIMUM_MEMORY` 或减小输入数据
3. **结果不一致**: 检查随机种子设置（Random Walk 算法）

## 预编译的 WASM

为了方便使用，项目包含预编译的 WASM 文件。如果不需要修改 C++ 代码，可以直接使用预编译版本。
