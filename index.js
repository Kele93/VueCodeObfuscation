#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
// 移除CommonJS导入，准备在主函数中动态导入
// const chalk = require('chalk');

// 混淆配置 - 根据需要调整
const obfuscatorConfig = {
	compact: true,                  // 代码压缩
	controlFlowFlattening: false,   // 控制流扁平化 (设置为true可能导致性能问题)
	deadCodeInjection: false,       // 注入死代码 (设置为true可能导致性能问题)
	debugProtection: false,         // 调试保护
	disableConsoleOutput: false,    // 禁用console输出
	identifierNamesGenerator: 'hexadecimal', // 标识符命名方式
	log: false,
	numbersToExpressions: false,    // 数字转表达式
	renameGlobals: false,           // 是否重命名全局变量
	selfDefending: false,           // 自我保护 (设置为true可能导致开发问题)
	simplify: true,                 // 简化代码
	splitStrings: false,            // 拆分字符串
	stringArray: true,              // 字符串转数组
	stringArrayEncoding: ['none'],  // 字符串数组编码
	stringArrayThreshold: 0.75,     // 字符串数组阈值
	unicodeEscapeSequence: false    // Unicode转义
};

// 主函数
async function main() {
	// 动态导入chalk (ESM模块)
	const chalk = (await import('chalk')).default;

	// 处理命令行参数
	const args = process.argv.slice(2);
	if (args.length < 1) {
		console.log(chalk.red('请指定要混淆的文件夹路径'));
		console.log(chalk.yellow('用法: zjcodetime <文件夹路径> [--backup]'));
		process.exit(1);
	}

	const folderPath = path.resolve(args[0]);
	const shouldBackup = args.includes('--backup');
	const backupFolder = path.join(path.dirname(folderPath), `${path.basename(folderPath)}_backup_${Date.now()}`);

	// 创建备份
	if (shouldBackup) {
		console.log(chalk.blue(`正在创建备份到: ${backupFolder}`));
		copyFolderSync(folderPath, backupFolder);
	}

	// 统计信息
	let stats = {
		jsFiles: 0,
		vueFiles: 0,
		errors: 0
	};

	// 检查目录是否存在
	if (!fs.existsSync(folderPath)) {
		console.log(chalk.red(`错误: 目录 ${folderPath} 不存在!`));
		process.exit(1);
	}

	// 显示绝对路径
	console.log(chalk.blue(`使用绝对路径: ${folderPath}`));

	// 查找所有JS和Vue文件
	console.log(chalk.blue(`正在扫描文件夹: ${folderPath}`));

	// 输出目录内容以便调试
	console.log(chalk.yellow('目录内容:'));
	let hasSubdirectories = false;
	try {
		const dirFiles = fs.readdirSync(folderPath);
		if (dirFiles.length === 0) {
			console.log(chalk.yellow(`- 目录为空`));
		} else {
			dirFiles.forEach(file => {
				const filePath = path.join(folderPath, file);
				const isDir = fs.statSync(filePath).isDirectory();
				console.log(chalk.yellow(`- ${file}${isDir ? ' (目录)' : ''}`));

				if (isDir) {
					hasSubdirectories = true;
					// 展示子目录内容
					try {
						const subDirFiles = fs.readdirSync(filePath);
						subDirFiles.slice(0, 5).forEach(subFile => {
							console.log(chalk.yellow(`  └─ ${subFile}`));
						});
						if (subDirFiles.length > 5) {
							console.log(chalk.yellow(`  └─ ... 等${subDirFiles.length - 5}个文件`));
						}
					} catch (e) {
						console.log(chalk.yellow(`  └─ (无法读取子目录)`));
					}
				}
			});
		}
	} catch (error) {
		console.log(chalk.red(`读取目录内容失败: ${error.message}`));
	}

	let jsFiles = [];
	let vueFiles = [];

	// 改进文件搜索逻辑
	console.log(chalk.blue(`开始深度搜索文件...`));

	// 使用更可靠的文件查找方法
	const findAllFiles = (dir, ext) => {
		let results = [];
		try {
			const files = fs.readdirSync(dir);
			for (const file of files) {
				const fullPath = path.join(dir, file);
				try {
					const stat = fs.statSync(fullPath);
					if (stat.isDirectory()) {
						const nestedFiles = findAllFiles(fullPath, ext);
						results = results.concat(nestedFiles);
					} else if (path.extname(file).toLowerCase() === ext.toLowerCase()) {
						results.push(fullPath);
					}
				} catch (statErr) {
					console.log(chalk.yellow(`无法访问文件 ${fullPath}: ${statErr.message}`));
				}
			}
		} catch (err) {
			console.log(chalk.yellow(`无法读取目录 ${dir}: ${err.message}`));
		}
		return results;
	};

	// 直接使用改进的查找方法
	jsFiles = findAllFiles(folderPath, '.js');
	vueFiles = findAllFiles(folderPath, '.vue');

	console.log(chalk.green(`找到 ${jsFiles.length} 个JS文件和 ${vueFiles.length} 个Vue文件`));

	if (jsFiles.length === 0 && vueFiles.length === 0) {
		console.log(chalk.red(`警告: 没有找到任何可混淆的文件!`));
		if (hasSubdirectories) {
			console.log(chalk.yellow(`提示: 目录下有子目录，可能需要分别处理子目录或检查文件权限`));
		}
	}

	if (vueFiles.length > 0) {
		console.log(chalk.cyan(`找到的Vue文件(显示前10个):`));
		vueFiles.slice(0, 10).forEach(file => {
			console.log(chalk.cyan(`- ${path.relative(folderPath, file)}`));
		});
		if (vueFiles.length > 10) {
			console.log(chalk.cyan(`- ... 等${vueFiles.length - 10}个文件`));
		}
	}

	// 处理JS文件
	jsFiles.forEach(file => {
		try {
			console.log(chalk.cyan(`处理JS文件: ${path.relative(folderPath, file)}`));
			const code = fs.readFileSync(file, 'utf8');
			const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, obfuscatorConfig).getObfuscatedCode();
			fs.writeFileSync(file, obfuscatedCode);
			stats.jsFiles++;
		} catch (error) {
			console.log(chalk.red(`混淆JS文件失败: ${file}`));
			console.error(error);
			stats.errors++;
		}
	});

	// 处理Vue文件
	vueFiles.forEach(file => {
		try {
			console.log(chalk.cyan(`处理Vue文件: ${path.relative(folderPath, file)}`));
			const content = fs.readFileSync(file, 'utf8');

			// 改进正则表达式，使用更强大的匹配方式处理script标签
			const scriptRegex = /(<script(?:\s[^>]*)?>\s*)([\s\S]*?)(\s*<\/script>)/gi;
			let scriptMatch = scriptRegex.exec(content);

			if (scriptMatch) {
				// 提取script标签的三个部分：开始标签、内容和结束标签
				const scriptOpenTag = scriptMatch[1];  // <script ...>
				const scriptContent = scriptMatch[2];  // 实际JS代码
				const scriptCloseTag = scriptMatch[3]; // </script>

				console.log(chalk.yellow(`找到script标签，长度: ${scriptMatch[0].length}`));

				// 增强JSX检测逻辑，采用更准确的方式识别JSX
				const complexSyntaxCheck = scriptContent.includes('render(h)') ||
					scriptContent.includes('render: function(h)') ||
					scriptContent.includes('functional:') ||
					(scriptContent.includes('return') &&
						scriptContent.includes('(') &&
						scriptContent.includes('<') &&
						scriptContent.includes('/>'));

				if (complexSyntaxCheck) {
					console.log(chalk.yellow(`检测到复杂语法结构，使用安全模式混淆...`));
					// 对于复杂结构，使用更安全的混淆配置
					const safeConfig = {
						...obfuscatorConfig,
						controlFlowFlattening: false,
						deadCodeInjection: false,
						stringArray: false,
						splitStrings: false,
						stringArrayThreshold: 0
					};

					try {
						// 尝试使用安全配置混淆
						const obfuscatedScript = JavaScriptObfuscator.obfuscate(
							scriptContent,
							safeConfig
						).getObfuscatedCode();

						// 构建新的script标签块，保留原始的开始和结束标签格式
						const newScriptBlock = scriptOpenTag + obfuscatedScript + scriptCloseTag;

						// 替换整个script标签块
						const newContent = content.replace(scriptMatch[0], newScriptBlock);

						fs.writeFileSync(file, newContent);
						stats.vueFiles++;
						console.log(chalk.green(`成功处理Vue文件(安全模式): ${path.relative(folderPath, file)}`));
					} catch (safeObfuscateError) {
						console.log(chalk.red(`即使使用安全模式也无法混淆: ${safeObfuscateError.message}`));
						stats.errors++;
					}
				} else {
					try {
						// 混淆JS内容
						const obfuscatedScript = JavaScriptObfuscator.obfuscate(
							scriptContent,
							obfuscatorConfig
						).getObfuscatedCode();

						// 构建新的script标签块，保留原始的开始和结束标签格式
						const newScriptBlock = scriptOpenTag + obfuscatedScript + scriptCloseTag;

						// 替换整个script标签块 - 使用更可靠的替换方法
						let newContent = content.substring(0, scriptMatch.index) +
							newScriptBlock +
							content.substring(scriptMatch.index + scriptMatch[0].length);

						fs.writeFileSync(file, newContent);
						stats.vueFiles++;
						console.log(chalk.green(`成功处理Vue文件: ${path.relative(folderPath, file)}`));
					} catch (obfuscateError) {
						// 特定处理混淆失败的情况，记录错误但继续处理其他文件
						console.log(chalk.red(`混淆脚本内容失败: ${obfuscateError.message}`));
						console.log(chalk.yellow(`跳过此文件并保持原样: ${path.relative(folderPath, file)}`));
						stats.errors++;
					}
				}
			} else {
				console.log(chalk.red(`未找到script标签: ${file}`));
				// 输出文件前100个字符以便调试
				console.log(chalk.yellow(`文件内容预览: ${content.substring(0, 100)}...`));
				stats.errors++;
			}
		} catch (error) {
			console.log(chalk.red(`混淆Vue文件失败: ${file}`));
			console.error(error);
			stats.errors++;
		}
	});

	// 输出统计信息
	console.log(chalk.green('\n混淆完成!'));
	console.log(chalk.white(`已处理 ${stats.jsFiles} 个JS文件`));
	console.log(chalk.white(`已处理 ${stats.vueFiles} 个Vue文件`));
	if (stats.errors > 0) {
		console.log(chalk.red(`处理失败: ${stats.errors} 个文件`));
	}
}

// 递归复制文件夹函数（用于备份）
function copyFolderSync(source, target) {
	if (!fs.existsSync(target)) {
		fs.mkdirSync(target, { recursive: true });
	}

	const files = fs.readdirSync(source);
	files.forEach(file => {
		const sourcePath = path.join(source, file);
		const targetPath = path.join(target, file);

		const stat = fs.statSync(sourcePath);
		if (stat.isDirectory()) {
			copyFolderSync(sourcePath, targetPath);
		} else {
			fs.copyFileSync(sourcePath, targetPath);
		}
	});
}

// 递归查找指定扩展名的文件
function findFilesByExtension(directory, extension) {
	let results = [];

	const files = fs.readdirSync(directory);
	for (const file of files) {
		const fullPath = path.join(directory, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			// 递归查找子目录
			const subResults = findFilesByExtension(fullPath, extension);
			results = results.concat(subResults);
		} else if (path.extname(file).toLowerCase() === extension.toLowerCase()) {
			// 找到匹配扩展名的文件
			results.push(fullPath);
		}
	}

	return results;
}

// 调用主函数
main().catch(error => {
	console.error('运行过程中发生错误:', error);
	process.exit(1);
});