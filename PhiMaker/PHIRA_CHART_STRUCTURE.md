# Phira 铺面文件结构

以下结构依据 [Phira 谱面标准](https://teamflos.github.io/phira-docs/chart-standard/index.html) 和 [谱面信息格式](https://teamflos.github.io/phira-docs/chart-standard/chartinfo.html) 整理。它描述的是 Phira 导入用的铺面包，不是 PhiMaker 的临时编辑工程。

```text
Phira 铺面包（压缩包；解压后文件直接位于根目录）
├── info.yml                    # 铺面清单：名称、作者，以及各素材的文件名
├── chart.json                  # 谱图（示例：RPE）
│   └── 也可能是 *.pec / *.pgr / *.pbc
├── song.mp3                    # 音乐
├── background.png              # 选曲界面的铺面插图
├── unlock.mp4                  # 可选：解锁视频
└── 其他可选资源                # 例如谱图引用的扩展资源
```

`info.yml` 是索引，不是谱图本身。它的 `chart`、`music`、`illustration`（以及可选的 `unlockVideo`）字段必须与包内文件名对应。谱面名称、难度、谱师 `charter`、曲师 `composer`、插画作者 `illustrator` 等元数据也写在这里；`tip` 是可选字段。Phira 以 `info.yml` 为准，不建议依赖 RPE 谱图 JSON 内重复保存的元数据。

本项目的新建表单将必需的谱图、音乐和插图一并缓存，并把实际文件名写入对应的清单字段。缓存保存在浏览器 IndexedDB 中，**目前不是可导出的 Phira 压缩包**。

```text
PhiMaker 浏览器本地缓存（IndexedDB: PhiMakerLocalStrange）
└── chartCaches
    └── 一条铺面记录
        ├── info                    # 与 Phira ChartInfo 对应的主要元数据
        ├── files.chart             # 谱图 Blob
        ├── files.music             # 音乐 Blob
        ├── files.illustration      # 插图 Blob
        └── files.unlockVideo       # 可选视频 Blob
```

## 官方参考

- [Phira 谱面标准](https://teamflos.github.io/phira-docs/chart-standard/index.html)：铺面包根目录和组成文件。
- [Phira 谱面信息格式](https://teamflos.github.io/phira-docs/chart-standard/chartinfo.html)：`info.yml` 字段及必需/可选项。
- [Phira 谱图格式说明](https://teamflos.github.io/phira-docs/chart-standard/chart-format/index.html)：RPE、PEC、PBC 等格式。
- [Phira `ChartInfo` 源码](https://github.com/TeamFlos/Phira/blob/main/prpr/src/info.rs)：字段及格式枚举定义。
