# UEssential 基础生存插件

**发行日期：** 2026/11/06
**当前版本：** v1.2.9
**开发版本：** v0.9.13
**适配加载器：** LeviLamina / LLBDS（LegacyScriptEngine-QuickJS）
**发行协议：** CASAL v1.0（Cloud-Aware Source-Available License）

---

## 简介

UEssential 是一套面向基岩版服务器的综合基础插件，把服务器日常运营所需的常用功能集中在一起：随机传送、传送请求、家园、公开家园、地标、返回死亡点、自杀、TPS 查询、经济菜单、封禁、公告、敏感词、MOTD、自定义命令、玩家管理与玩家数据库。

插件同时提供**网页面板**：服务器网站可以展示公开家园、服务价目表、玩家档案与公告，管理员还可以在网页上处理封禁、检索玩家、查看审计日志、编辑公告与管理敏感词。网页部分依赖 WebHub（网页平台）；未安装 WebHub 时插件照常运行，仅网页功能不启用。

---

## 安装

1. 服务端需已安装 LeviLamina（或 LLBDS）与 LegacyScriptEngine-QuickJS。
2. 将本目录下的 `UEssential` 文件夹整体放入服务端 `plugins/` 目录，形成：

```
plugins/UEssential/
├── UEssential.js
├── manifest.json
├── LICENSE
├── README.md
├── CHANGELOG.md
├── config.json          # 首次启动自动生成
├── lang/                # 首次启动自动生成
├── data.json
├── homes.json / pubhomes.json / warps.json / bans.json …
└── player_data_kv/      # 玩家档案
```

文件夹名必须为 `UEssential`，与 `manifest.json` 中的 `name` 保持一致，否则服务端会提示名称与文件夹不匹配。

3. 启动服务器。控制台出现下列信息即表示加载成功：

```
[UEssential] UEssential <当前版本号> 加载成功！…
```

若同时安装并启用了 WebHub，还会出现：

```
[WebHub] 已接入网页平台（5 个页面，管理动作已开启）
```

**升级：** 覆盖 `UEssential.js` 与 `manifest.json` 即可。配置文件采用「只补缺失项」的方式回填，原有设置与玩家数据不受影响。

**经济前置：** 默认使用 `llmoney`（经济前置插件）计费。若服务器使用计分板经济，请在 `config.json` 的 `economy.sbName` 中填写计分板目标名称。

---

## 游戏内功能与命令

### 面向玩家的命令

| 命令 | 说明 |
|---|---|
| `/tpr` | 随机传送。按配置的维度范围与最大高度寻找落点，费用随当日使用次数递增。 |
| `/tpa` | 打开传送请求菜单，向在线玩家发送传送申请。 |
| `/ac`、`/de` | 同意、拒绝收到的传送请求。 |
| `/tpacancel` | 取消自己发出的传送请求。 |
| `/tpaset` | 开启或关闭接收传送请求。 |
| `/home` | 打开家园菜单；`/home add <名称>`、`/home delete <名称>`、`/home go <名称>` 可直接操作；`/home publish` 打开公开家园发布界面。 |
| `/homewarp` | 浏览并前往其他玩家公开的家园。 |
| `/warp` | 打开地标列表并传送；`/warp go <名称>` 可直接前往。 |
| `/back` | 返回上一次死亡点，可查询近期多条死亡记录。 |
| `/suicide` | 自杀并返回重生点。 |
| `/tps` | 查询服务器当前 TPS，按配置收取查询费。 |
| `/notice` | 再次查看服务器公告。 |
| `/moneysystem` | 打开经济系统菜单（余额、转账等）。 |
| `/languagesue` | 切换界面语言。 |

### 面向管理员的命令

| 命令 | 说明 |
|---|---|
| `/ban` | 打开封禁菜单；可直接封禁在线或离线玩家，支持本地封禁与云端黑名单。 |
| `/unban [玩家]` | 解除封禁；不带参数时打开解封菜单。 |
| `/tpsadmin` | 查看 TPS 详细状态（多时段平均与波动图）。 |
| `/warpset` | 打开地标管理菜单，创建、修改、删除地标。 |
| `/homewarpadmin` | 管理玩家发布的公开家园。 |
| `/customcommand` | 管理自定义命令，可为常用指令设置别名。 |
| `/playermanage` | 玩家管理：查询在线玩家、执行管理操作。 |
| `/playerdatabase` | 玩家数据库：按名称或历史名称检索玩家记录。 |

> 命令权限由引擎判定：标注为管理员的命令仅限游戏管理员（GameMasters）执行；控制台可执行其中支持无玩家来源的命令。

### 其他机制

- **敏感词过滤**：拦截聊天与界面输入中的违禁词，词表可在 `config.json` 与网页管理面板中维护。
- **公告与 MOTD**：进服弹窗公告；MOTD 可按间隔循环播报，支持 `{online}`（在线人数）与 `{tps}` 占位符。
- **玩家档案**：记录注册时间、累计在线时长、最后上线时间、历史名称等，供网页档案页与管理员检索使用。
- **审计日志**：游戏侧操作写入 `logs/UEssential/` 下的按日 CSV 文件；网页侧管理操作同时写入 WebHub 自身的审计日志。

---

## 网页面板

网页功能由 WebHub 提供站点与账号体系，UEssential 在站点顶部注册一个「基础生存」入口，内含五个页签。

| 页签 | 可见角色 | 内容 |
|---|---|---|
| 公开家园 | 所有人 | 玩家公开发布的家园：名称、发布者、维度、坐标、剩余天数；过期条目自动隐藏，按剩余天数排序，支持按维度筛选与搜索。 |
| 价目表 | 所有人 | 九项服务的下一次费用：随机传送、传送请求、地标传送、自杀、返回死亡点、新建家园、返回家园、发布公开家园、查询 TPS。价格与游戏内扣费使用同一套公式与同一份「今日已用次数」。 |
| 我的档案 | 已登录 | 注册时间、累计在线时长、最后上线、家园数量、公开中的家园数、当前余额、历史名称。 |
| 公告 | 所有人 | 当前服务器公告，展示时去除颜色代码。 |
| 管理面板 | 管理员 | 封禁管理、玩家检索、审计日志、公告编辑、敏感词管理。 |

### 管理面板说明

- **封禁 / 解封**：填写玩家名与天数后提交；为防止误操作，按钮采用「二次点击确认」，需在 3 秒内再次点击才会真正执行。被封禁的在线玩家会立即下线。
- **玩家检索**：至少输入 3 个字符，最多返回 20 条结果，按累计在线时长排序；名称与历史名称均可检索。
- **审计日志**：可按日期、事件类型、关键词筛选；事件类型下拉框按当天实际记录动态生成。日志按固定间隔写入磁盘，最近几秒的操作可能尚未出现。
- **公告**：编辑框内为带颜色代码的原文，保存后颜色代码不会丢失；玩家侧展示时自动去除。
- **敏感词**：在词条后点击删除，或在输入框中添加新词。

网页上的管理操作会同时记录到 WebHub 审计日志与 UEssential 自身的 CSV 日志。

---

## 配置文件

`plugins/UEssential/config.json` 在首次启动时自动生成，缺失的键会在启动时自动补齐。修改配置后需重启服务器生效。

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `language` | `"zh_CN"` | 默认语言。 |
| `economy` | `type`/`sbName`/`transferTaxRate` | 经济类型与计分板目标名称、转账税率。 |
| `wordFilter` | `enabled`、`words` | 敏感词开关与词表。 |
| `tps` | `enabled`、`playerEnabled`、`costFormula` | TPS 查询开关、玩家查询开关与计费公式。 |
| `ban` | `enabled`、`cloudBlackBE`、`cloudUniteBan`、`cloudRecordToLocal` | 封禁开关与云端黑名单相关选项。 |
| `tpa` | `enabled`、`timeoutSeconds`、`refundRate`、`costFormula`、`conditions` | 传送请求的开关、超时、退款比例、计费公式与余额门槛。 |
| `tpr` | `enabled`、`cooldownSeconds`、`maxAttempts`、`costFormula`、`dimensions` | 随机传送的冷却、尝试次数、计费公式与各维度的坐标范围。 |
| `home` | `enabled`、`addCostFormula`、`goCostFormula`、`publish` | 家园开关、新建与回家计费、公开家园上限（全局 20、每人 2、最长 30 天）与发布费用。 |
| `warp` | `enabled`、`costFormula` | 地标传送开关与计费。 |
| `suicide` | `enabled`、`costFormula` | 自杀功能开关与计费。 |
| `back` | `enabled`、`maxDeathRecords`、`costFormula` | 返回死亡点的记录条数与计费。 |
| `notice` | `enabled`、`content` | 公告开关与内容，支持 `§` 颜色代码与换行。 |
| `motd` | `enabled`、`intervalSeconds`、`list` | 轮播消息的开关、间隔与内容。 |
| `customCommands` | `enabled`、`superAdmins` | 自定义命令开关与超级管理员 XUID 列表。 |
| `playerManage` | `enabled` | 玩家管理功能开关。 |
| `playerDatabase` | `enabled`、`autoBackup`、`backupIntervalDays`、`queryMinLength` | 玩家数据库开关、自动备份与检索最小长度。 |
| `webhub` | `enabled`、`allowAdminActions`、`cacheTtlMs`、`auditTailDays` | 网页面板总开关、管理动作开关、数据缓存毫秒数、审计日志可查天数（1–7）。 |

计费公式字段接受 JavaScript 表达式，变量 `count` 表示「今日已用次数」或已有数量，可按需调整数值。

若只需要展示页面、不允许网页端修改数据，将 `webhub.allowAdminActions` 设为 `false` 即可；若完全不使用网页功能，将 `webhub.enabled` 设为 `false`。

---

## 隐私

网页接口在返回数据前即完成脱敏，并非仅在前端隐藏：

| 字段 | 玩家 | 管理员 |
|---|---|---|
| XUID | 不下发 | 仅前 4 位加掩码 |
| IP 地址 | 不下发 | 网段掩码形式 |
| 客户端标识 | 不下发 | 前 4 位加省略号 |
| 家园坐标 | 仅公开家园可见 | 可见 |

玩家档案中的 IP 与设备标识仅保存在服务端数据库，任何角色的网页接口均不返回。

---

## 常见问题

**网站顶部没有「基础生存」入口？**
确认 WebHub 已安装、已启用，且 `config.json` 中 `webhub.enabled` 为 `true`。WebHub 加载晚于本插件时，插件会每 3 秒重试注册，最多 10 次。

**网页管理面板打不开？**
网页账号角色必须为 `admin`（`player`、`helper` 无法进入），角色在 WebHub 管理台设置。同时确认 `webhub.allowAdminActions` 为 `true`。

**修改公告后玩家看到的是旧内容？**
公告接口不缓存，刷新页面即可。已在游戏中的玩家不会收到新公告弹窗，下次进服时生效。

**保存公告后颜色代码丢失？**
不会。管理面板编辑的是原文，玩家侧展示时才去除颜色代码。

**服务器重启后需要重新注册网页入口吗？**
不需要。插件会在服务器启动完成时自动重新注册。

**TPS 显示与服务器实际状态不一致？**
TPS 由插件按固定间隔采样计算，短时间波动属正常现象，可参考 `/tpsadmin` 中的多时段平均值。

---

## 授权与反馈

本插件采用 **CASAL v1.0（Cloud-Aware Source-Available License）** 授权，协议全文见本目录 `LICENSE` 文件与 `UEssential.js` 开头声明。要点如下：

- 仅限服务端运行；未经书面许可，不得将本体或衍生作品分发至客户端设备。
- 允许二次开发；修改版用于面向公众的服务器时，必须公开完整源码并继续沿用 CASAL v1.0。
- 允许在商业服务器上部署使用；禁止售卖插件文件、将文件置于付费门槛之后，或把插件功能改为付费解锁。
- 官方发布渠道仅限 GitHub、KLPBBS、MineBBS，禁止未经许可的转载。

项目地址：<https://github.com/wuw111/UEssential>
作者：wuw111　反馈群：1097933637

---

## 文件说明

| 文件 | 内容 |
|---|---|
| `UEssential.js` | 插件本体 |
| `manifest.json` | 插件清单 |
| `LICENSE` | 发行协议原文（CASAL v1.0） |
| `README.md` | 本文档 |
| `CHANGELOG.md` | 各发行版本的改动记录 |
