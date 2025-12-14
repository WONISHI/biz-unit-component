import { build, InlineConfig } from 'vite';
import path from 'path';
import fs from 'fs-extra';
import vue3 from '@vitejs/plugin-vue';
import { createVuePlugin as vue2 } from 'vite-plugin-vue2';

// 1. 定义包的路径
const packagesDir = path.resolve(__dirname, '../packages');

// 2. 获取所有的包文件夹
const dirs = fs.readdirSync(packagesDir).filter((dir) => {
    return fs.statSync(path.resolve(packagesDir, dir)).isDirectory();
});

// 3. 构建函数
const buildPackage = async (name: string) => {
    const pkgRoot = path.resolve(packagesDir, name);
    const pkgJson = require(path.resolve(pkgRoot, 'package.json'));

    // 这里的逻辑很关键：通过包名或目录名判断是用 Vue 2 还是 Vue 3 插件
    // 假设我们约定：目录名包含 'v2' 用 Vue 2，否则用 Vue 3
    const isVue2 = name.includes('v2');
    const plugins = isVue2 ? [vue2()] : [vue3()];

    // 基础配置
    const config: InlineConfig = {
        root: pkgRoot,
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            lib: {
                entry: path.resolve(pkgRoot, 'src/index.ts'),
                name: pkgJson.name, // 使用 package.json 里的 name 作为全局变量名
                fileName: (format) => `index.${format}.js`,
                formats: ['es', 'umd'],
            },
            rollupOptions: {
                // 确保外部化处理那些你不想打包进库的依赖
                external: ['vue'],
                output: {
                    globals: {
                        vue: 'Vue',
                    },
                },
            },
        },
        plugins, // 动态注入插件
    };

    try {
        console.log(`\n🔨 开始构建: ${name} (${isVue2 ? 'Vue 2' : 'Vue 3'})...`);
        await build(config); // 调用 Vite 的编程式 API
        console.log(`✅ 构建成功: ${name}`);
    } catch (e) {
        console.error(`❌ 构建失败: ${name}`, e);
        process.exit(1);
    }
};

// 4. 并行或串行执行构建
const run = async () => {
    for (const dir of dirs) {
        await buildPackage(dir);
    }
};

run();