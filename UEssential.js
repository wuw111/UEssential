/*-----------------------------------------------------------------------
 * UEssential 基础生存插件 - v1.1.0
 * Copyright (c) 2024-2026 wuw111. All rights reserved.
 * 
 * [授权声明 - CASAL v1.0]
 * 1. 本项目基于 CASAL v1.0 协议授权。官方发布渠道仅限 GitHub、KLPBBS、MineBBS，禁止未经许可的转载。
 * 2. 运行环境：本插件仅限服务端运行，严禁将本体代码或逻辑分发至客户端（如JS源码内容等）。
 * 3. 允许二次开发，但在公网服务器运行修改版时，必须公开完整源码并沿用 CASAL 协议。
 * 4. 商业：允许商业服务器部署使用。但【严禁】直接售卖插件、将其加入付费整合包，或在商业服务器内将插件内功能设为“付费解锁”。
 * 5. 欺诈警告：本插件永久免费。若您为获取插件文件或解锁其内部功能而付费，说明您已被骗，请立即举报。
 * 
 * 详细条款、例外情况及授权定义请参阅项目根目录下的 LICENSE 文件。
 *-----------------------------------------------------------------------*/

const PLUGIN_NAME = "UEssential";
const VERSION = [1, 1, 0];
const PREFIX = "§b§l[UEssential]§r ";
const DIR_PATH = "plugins/" + PLUGIN_NAME;
const LANG_PATH = DIR_PATH + "/lang";
const LOG_PATH = "logs/" + PLUGIN_NAME;

if (!File.exists(DIR_PATH)) File.mkdir(DIR_PATH);
if (!File.exists(LANG_PATH)) File.mkdir(LANG_PATH);
if (!File.exists(LOG_PATH)) File.mkdir(LOG_PATH);

const DEFAULT_CONFIG = {
    language: "zh_CN",
    economy: { type: "llmoney", sbName: "money", transferTaxRate: 0.05 },
    wordFilter: { enabled: true, words: ["傻逼", "sb", "死了"] },
    tps: { enabled: true, playerEnabled: true, costFormula: "200 * Math.pow(1.01, count)" },
    ban: { enabled: true, cloudBlackBE: true, cloudUniteBan: false, cloudRecordToLocal: false },
    tpa: {
        enabled: true, timeoutSeconds: 60, refundRate: 0.8,
        costFormula: "10 * Math.pow(1.001, count)", 
        conditions: { enableLimits: true, targetMinMoney: 10000, senderMinMoney: 20000, sbName: "" }
    },
    tpr: {
        enabled: true, cooldownSeconds: 30, maxAttempts: 5, loadDelayMs: 1500,
        costFormula: "50 * Math.pow(1.05, count)",
        dimensions: {
            "0": { enabled: true, rangeX: [-10000, 10000], rangeZ: [-10000, 10000], maxY: 300 },
            "1": { enabled: false, rangeX: [-10000, 10000], rangeZ: [-10000, 10000], maxY: 121 },
            "2": { enabled: false, rangeX: [-10000, 10000], rangeZ: [-10000, 10000], maxY: 250 }
        }
    },
    home: {
        enabled: true,
        addCostFormula: "200 * count + count * Math.pow(10, 1.2 + 0.005 * count)",
        goCostFormula: "10 * Math.pow(1.01, count)",
        publish: { enabled: true, maxGlobal: 20, maxPerPlayer: 2, maxDays: 30, costFormula: "3000 * days" }
    },
    warp: { enabled: true, costFormula: "10 * Math.pow(1.01, count) * (count / (count + 0.01))" },
    suicide: { enabled: true, costFormula: "5 * Math.pow(1.001, count)" },
    back: { enabled: true, maxDeathRecords: 5, costFormula: "10 * Math.pow(1.001, count) * Math.pow(index, 0.5)" },
    notice: { enabled: true, content: "§l§e欢迎来到服务器！§r\n这里是基础生存服务器，请和谐游戏。\n输入 §a/notice§r 可以再次查看此公告。" },
    motd: { enabled: false, intervalSeconds: 5, list: ["§b欢迎来到服务器", "§a当前在线: {online}", "§e当前TPS: {tps}"] },
    customCommands: { enabled: true, superAdmins: ["9999999999999999"] },
    playerManage: { enabled: true },
    playerDatabase: { enabled: true }
};

const configPath = DIR_PATH + "/config.json";
if (File.exists(configPath)) {
    let rawContent = File.readFrom(configPath);
    try {
        JSON.parse(rawContent);
    } catch (e) {
        logger.error("检测到 config.json 存在致命语法错误！已重置。");
        File.writeTo(DIR_PATH + "/config_error_backup.json", rawContent || "");
        File.writeTo(configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
    }
}

const config = new JsonConfigFile(configPath, JSON.stringify(DEFAULT_CONFIG));

function deepMerge(target, source) {
    let modified = false;
    for (let key in source) {
        if (target[key] === undefined) {
            target[key] = source[key];
            modified = true;
        } else if (typeof source[key] === "object" && !Array.isArray(source[key]) && source[key] !== null) {
            if (typeof target[key] !== "object") {
                target[key] = {};
                modified = true;
            }
            if (deepMerge(target[key], source[key])) modified = true;
        }
    }
    return modified;
}

for (let key in DEFAULT_CONFIG) {
    let val = config.get(key);
    if (val === null || val === undefined) {
        config.set(key, DEFAULT_CONFIG[key]);
    } else if (typeof val === "object" && !Array.isArray(val)) {
        if (deepMerge(val, DEFAULT_CONFIG[key])) config.set(key, val);
    }
}

const defaultLangData = {
    "zh_CN": {
        "lang.switched": "已切换语言至 {lang} / Language switched to {lang}",
        "lang.title": "切换语言 / Switch Language",
        "lang.desc": "请选择您的偏好语言：\nPlease select your preferred language:",
        "error.player_only": "仅限玩家执行此命令。",
        "error.deduct": "扣款失败！",
        
        "wordfilter.blocked": "操作失败：名称包含违禁词汇！",

        "tps.admin.title": "§l§6=== 服务器 TPS 状态 ===§r\n",
        "tps.admin.current": "当前TPS: §a{tps}§r\n",
        "tps.admin.30s": "30秒平均: §e{tps}§r\n",
        "tps.admin.2m": "2分钟平均: §e{tps}§r\n",
        "tps.admin.5m": "5分钟平均: §6{tps}§r\n",
        "tps.admin.10m": "10分钟平均: §6{tps}§r\n",
        "tps.admin.graph": "10分钟波动图 (10s/点，远→近):\n",
        "tps.player.success": "当前服务器TPS: §a{tps}§r\n扣除查询费: {cost} 金币",
        "tps.player.nomoney": "余额不足以支付查询费 (需 {cost} 金币)",

        "ban.reason.default": "违反服务器规则，如需申诉请联系服务器官方",
        "ban.kick.local": "您已被封禁: {reason}",
        "ban.kick.cloud": "云端黑名单拦截: {reason}",
        "ban.form.title": "封禁系统",
        "ban.form.dropdown": "选择在线玩家",
        "ban.form.dropdown.empty": "(不选择)",
        "ban.form.input_name": "或手动输入玩家名称/XUID",
        "ban.form.input_days": "封禁时长 (天)",
        "ban.form.days_ph": "留空为永久",
        "ban.form.input_reason": "封禁理由",
        "ban.form.reason_ph": "...",
        "ban.success": "封禁操作已生效。",
        "unban.form.title": "解封系统",
        "unban.none": "无封禁记录。",
        "unban.success": "已解封: {name}",
        "unban.not_found": "未找到该玩家的封禁记录。",
        "unban.console_err": "控制台必须提供目标参数。",

        "tpr.disabled": "随机传送功能目前已关闭。",
        "tpr.dim_disabled": "当前维度不允许使用随机传送。",
        "tpr.cooldown": "随机传送冷却中，还需等待 {left} 秒。",
        "tpr.nomoney": "余额不足以支付随机传送费 (需 {cost} 金币)。",
        "tpr.searching": "正在寻找安全着陆点... (第 {attempt}/{max} 次尝试)",
        "tpr.success": "随机传送成功！已抵达 {x}, {y}, {z}。扣除费用：{cost} 金币。",
        "tpr.failed": "未能找到安全的随机传送点，已将您传回原处并全额退款。",

        "tpa.disabled": "您已关闭TPA功能，无法发起请求。请先使用 /tpaset 开启。",
        "tpa.pending": "您有一个尚未处理的TPA请求，请等待过期或被处理后再发起！",
        "tpa.no_players": "当前没有其他在线玩家！",
        "tpa.form.title": "§l§5传送请求 (TPA)",
        "tpa.form.desc": "请选择您要传送的玩家及传送方式。",
        "tpa.form.target": "选择目标玩家",
        "tpa.form.type": "传送方式",
        "tpa.form.type.tpa": "传送到该玩家身边 (TPA)",
        "tpa.form.type.tpahere": "把该玩家传送过来 (TPA Here)",
        "tpa.target_offline": "目标玩家已离线。",
        "tpa.target_disabled": "玩家 {name} 已关闭了 TPA 接收功能。",
        "tpa.limit.target": "请求失败：对方余额未达到接收标准。",
        "tpa.limit.sender": "请求失败：您的余额未达到发起标准。",
        "tpa.fee.insufficient": "您的余额不足以支付本次TPA手续费 ({cost} 金币)。",
        "tpa.confirm.title": "TPA 请求确认",
        "tpa.confirm.desc": "您确认要发起请求吗？\n\n操作: {type}\n费用: §c{cost} 金币§r",
        "tpa.confirm.btn.yes": "确认提交",
        "tpa.confirm.btn.no": "取消",
        "tpa.type.to_target": "传送到 §a{name}§r 身边",
        "tpa.type.to_me": "将 §a{name}§r 传送到您身边",
        "tpa.sent": "请求已发送，等待对方处理... (扣除 {cost} 金币)",
        "tpa.receive.title": "\n§6========================§r",
        "tpa.receive.msg1": "§e {name} 请求 {type}！§r",
        "tpa.receive.msg2": "§e 请输入 §a/ac§e 同意，或 §c/de§e 拒绝。§r",
        "tpa.receive.footer": "§6========================§r\n",
        "tpa.receive.type.tpa": "传送到您的身边",
        "tpa.receive.type.tpahere": "将您传送到他的位置",
        "tpa.no_pending": "您当前没有任何待处理的TPA请求！",
        "tpa.not_found": "找不到来自 {name} 的请求。",
        "tpa.rejected.target": "您拒绝了 {name} 的TPA请求。",
        "tpa.rejected.sender": "{name} 拒绝了您的TPA请求。",
        "tpa.accepted.target": "您同意了 {name} 的TPA请求！",
        "tpa.accepted.sender": "{name} 同意了您的TPA请求！正在传送...",
        "tpa.expired.target": "来自 {name} 的TPA请求已过期。",
        "tpa.expired.sender.refund": "对 {name} 的TPA请求已过期，已退还 {refund} 金币。",
        "tpa.expired.sender.norefund": "对 {name} 的TPA请求已过期。",
        "tpa.set.on": "您的 TPA 功能已开启。",
        "tpa.set.off": "您的 TPA 功能已关闭。",
        "tpa.canceled": "已取消 {count} 个待处理的 TPA 请求，退还 {refund} 金币。",
        "tpa.cancel.none": "你没有待处理的 TPA 请求。",
        
        "eco.main.title": "§l§6经济系统",
        "eco.main.desc": "您当前的余额为：§a{balance}§r\n请选择您要进行的操作：",
        "eco.main.btn.transfer": "发起转账",
        "eco.main.btn.close": "关闭菜单",
        "eco.transfer.no_players": "当前没有其他可转账的在线玩家！",
        "eco.transfer.title": "转账中心",
        "eco.transfer.desc": "请选择收款人并输入金额。\n系统将收取 §c{tax}%§r 的转账税。",
        "eco.transfer.target": "收款玩家",
        "eco.transfer.amount": "转账金额 (整数)",
        "eco.transfer.invalid": "金额输入有误，请输入有效的正整数！",
        "eco.transfer.insufficient": "转账失败：您的余额不足。本次需包含税费共 {cost} 金币",
        "eco.transfer.success.sender": "转账成功！向 {name} 转账 {amount} 金币 (已支付税金 {tax})。",
        "eco.transfer.success.target": "您收到了来自 {name} 的 {amount} 金币转账！",
        "eco.transfer.rollback": "系统错误：向对方加款失败，已退还您的转账与税金！",
        "eco.transfer.fail": "系统错误：扣款失败！",

        "home.disabled": "家园系统目前已关闭。",
        "home.not_found": "找不到名为 {name} 的家园传送点。",
        "home.add.exist": "名为 {name} 的家园已存在！",
        "home.add.nomoney": "余额不足以添加家园 (需 {cost} 金币)。",
        "home.add.success": "成功添加家园 [{name}]！扣除费用：{cost} 金币。",
        "home.delete.success": "成功删除家园 [{name}]。",
        "home.go.nomoney": "余额不足以传送至家园 (需 {cost} 金币)。",
        "home.go.success": "已传送到家园 [{name}]。扣除传送费：{cost} 金币。",
        "home.main.title": "§l§2家园系统",
        "home.main.desc": "请选择你要进行的操作：",
        "home.main.btn.go": "前往家园",
        "home.main.btn.add": "添加家园 (当前坐标)",
        "home.main.btn.delete": "删除家园",
        "home.main.btn.publish": "管理公开家园",
        "home.add.title": "添加家园",
        "home.add.name": "输入家园名称",
        "home.delete.title": "删除家园",
        "home.go.title": "前往家园",
        "home.none": "你没有任何家园传送点。",
        "home.pub.title": "公开家园管理",
        "home.pub.btn.create": "公开发布家园传送点",
        "home.pub.btn.remove": "下架已发布的家园",
        "home.pub.disabled": "公开家园系统已关闭。",
        "home.pub.full_global": "全服公开家园数量已达上限！",
        "home.pub.full_player": "你发布的公开家园数量已达上限！",
        "home.pub.no_available": "你没有可公开的家园 (可能已全部发布)。",
        "home.pub.create.title": "发布公开家园",
        "home.pub.create.desc": "公开发布后，所有玩家均可传送。最长可公开 {max} 天。",
        "home.pub.create.select": "选择要发布的家园",
        "home.pub.create.days": "公开天数 (整数)",
        "home.pub.invalid_days": "输入的公开天数无效。",
        "home.pub.failed": "发布失败：可能由于容量限制或该家园已发布。",
        "home.pub.nomoney": "余额不足以支付发布费用 (需 {cost} 金币)。",
        "home.pub.success": "成功发布家园 [{name}] {days} 天！扣除费用：{cost} 金币。",
        "home.pub.remove.title": "下架公开家园",
        "home.pub.remove.desc": "注意：下架为一次性操作，剩余时间和费用概不退还！\n请选择你要下架的家园：",
        "home.pub.remove.none": "你没有任何正在公开的家园。",
        "home.pub.remove.success": "成功下架公开家园 [{name}]。",
        "home.pub.list.title": "公开家园列表",
        "home.pub.list.desc": "选择一个公开家园进行传送：",
        "home.pub.list.none": "当前没有任何公开的家园。",
        "home.pub.admin.title": "§c管理公开家园",
        "home.pub.admin.desc": "点击强制删除公开传送点：",
        "home.pub.admin.removed": "已强制删除公开家园 [{name}]。",

        "warp.manage.title": "管理 Warp",
        "warp.manage.content": "请选择操作：",
        "warp.manage.add_current": "以当前坐标新增 Warp",
        "warp.manage.add_custom": "自定义坐标新增 Warp",
        "warp.manage.edit": "编辑 Warp",
        "warp.manage.delete": "删除 Warp",
        "warp.add.title": "新增 Warp",
        "warp.add.name": "Warp 名称",
        "warp.add.icon": "Warp 图标路径 (可选)",
        "warp.add.dim": "维度",
        "warp.add.success": "Warp [{name}] 添加成功！",
        "warp.add.exist": "同名 Warp 已存在！",
        "warp.del.title": "删除 Warp",
        "warp.del.content": "请选择要删除的 Warp：",
        "warp.del.success": "Warp [{name}] 已删除。",
        "warp.edit.title": "编辑 Warp",
        "warp.edit.success": "Warp [{name}] 修改成功！",
        "warp.none": "当前没有任何 Warp 传送点。",
        "warp.title": "Warp 传送点",
        "warp.nomoney": "余额不足以支付 Warp 传送费 (需 {cost} 金币)",
        "warp.success": "已传送到地标 {name}。扣除传送费：{cost} 金币",
        "warp.invalid": "选择的坐标数据无效。",
        "warp.not_found": "找不到名为 {name} 的地标传送点。",

        "suicide.success": "您已结束了自己的生命。扣除手续费：{cost} 金币",
        "suicide.nomoney": "余额不足以支付自杀手续费 (需 {cost} 金币)",
        
        "back.success": "已返回死亡点。扣除手续费：{cost} 金币",
        "back.nomoney": "余额不足以支付返回手续费 (需 {cost} 金币)",
        "back.none": "尚未找到您的死亡记录。",
        "back.title": "选择要返回的死亡点",
        "back.dim_0": "主世界",
        "back.dim_1": "下界",
        "back.dim_2": "末地",
        "back.btn": "时间: {time}\n地点: [{dim}] {x}, {y}, {z} (需 {cost} 金币)",

        "notice.title": "§l服务器公告",
        "notice.btn.ok": "确定",
        "notice.btn.never": "收到且不再展示",
        "notice.set_never": "已设置不再自动弹出此公告。"
    }
};

i18n.load(LANG_PATH, config.get("language"), defaultLangData);

const dataDb = new JsonConfigFile(DIR_PATH + "/data.json", JSON.stringify({
    tprCounts: {}, tpaCounts: {}, warpCounts: {}, suicideCounts: {}, backCounts: {}, homeGoCounts: {}, tpaSettings: {}, playerLangs: {}, tpsCounts: {}, noticeReads: {}
}));
const warpDb = new JsonConfigFile(DIR_PATH + "/warps.json", "{}");
const deathDb = new JsonConfigFile(DIR_PATH + "/DeathPort.json", "{}");
const homeDb = new JsonConfigFile(DIR_PATH + "/homes.json", "{}");
const pubHomeDb = new JsonConfigFile(DIR_PATH + "/pubhomes.json", "{}");
const banDb = new JsonConfigFile(DIR_PATH + "/bans.json", JSON.stringify({ list: [] }));

const cusCmdDb = new JsonConfigFile(DIR_PATH + "/cuscmds.json", JSON.stringify({
    list: {
        "hub": {
            alias: "",
            targetCmd: "warp go 主城",
            desc: "快速传送回主城地标",
            runAsConsole: false,
            hasArgs: false
        }
    }
}));

const pdbDb = new JsonConfigFile(DIR_PATH + "/playerdatabase.json", "{}");
const regDb = new JsonConfigFile(DIR_PATH + "/regplayer.json", JSON.stringify({ total: 0, records: {} }));

let csvLogQueue = [];

function csvLog(event, playerStr, dataStr) {
    let tm = system.getTimeObj();
    let today = `${tm.Y}-${String(tm.M).padStart(2,'0')}-${String(tm.D).padStart(2,'0')}`;
    let time = `${String(tm.h).padStart(2,'0')}:${String(tm.m).padStart(2,'0')}:${String(tm.s).padStart(2,'0')}`;
    
    let escape = (str) => {
        if (str == null) return '""';
        str = String(str).replace(/"/g, '""');
        return `"${str}"`;
    };
    
    csvLogQueue.push({
        today: today,
        line: `${escape(time)},${escape(playerStr)},${escape(event)},${escape(dataStr)}`
    });
}

let currentTick = 0;
let tpaQueue = {}; 
let tprCooldowns = {};

const TPS_HISTORY_SIZE = 12000;
let tickTimestamps = new Array(TPS_HISTORY_SIZE);
let tickIndex = 0;
let tickTotalCount = 0;

function safeFormula(formulaStr, allowedVars, defaultFormula, configGroup, subKey) {
    if (typeof formulaStr !== "string" || formulaStr.trim() === "") return defaultFormula;
    let stripped = formulaStr.replace(/Math\.(pow|sqrt|abs|floor|ceil|min|max|E|PI)/g, "");
    for (let v of allowedVars) {
        stripped = stripped.replace(new RegExp("\\b" + v + "\\b", "g"), "");
    }
    stripped = stripped.replace(/[\d\s\+\-\*\/\%\(\)\.,]/g, ""); 
    
    if (stripped.length > 0) {
        logger.warn(`安全沙盒：拦截到注入或无法识别的内容！(归属: ${configGroup}) 将纠正为默认值。`);
        let cfgObj = config.get(configGroup);
        if (cfgObj) {
            if (subKey && cfgObj[subKey]) cfgObj[subKey].costFormula = defaultFormula;
            else cfgObj.costFormula = defaultFormula;
            config.set(configGroup, cfgObj);
        }
        return defaultFormula;
    }
    return formulaStr;
}

const Formulas = {
    tprCost: null, tpaCost: null, warpCost: null, suicideCost: null, backCost: null,
    homeAddCost: null, homeGoCost: null, homePublishCost: null, tpsCost: null,
    update: function() {
        const tprF = safeFormula(config.get("tpr").costFormula, ["count"], DEFAULT_CONFIG.tpr.costFormula, "tpr");
        const tpaF = safeFormula(config.get("tpa").costFormula, ["count"], DEFAULT_CONFIG.tpa.costFormula, "tpa");
        const warpF = safeFormula(config.get("warp").costFormula, ["count"], DEFAULT_CONFIG.warp.costFormula, "warp");
        const suicideF = safeFormula(config.get("suicide").costFormula, ["count"], DEFAULT_CONFIG.suicide.costFormula, "suicide");
        const backF = safeFormula(config.get("back").costFormula, ["count", "index"], DEFAULT_CONFIG.back.costFormula, "back");
        const tpsF = safeFormula(config.get("tps").costFormula, ["count"], DEFAULT_CONFIG.tps.costFormula, "tps");
        
        const homeAddF = safeFormula(config.get("home").addCostFormula, ["count"], DEFAULT_CONFIG.home.addCostFormula, "home");
        const homeGoF = safeFormula(config.get("home").goCostFormula, ["count"], DEFAULT_CONFIG.home.goCostFormula, "home");
        const homePubF = safeFormula(config.get("home").publish.costFormula, ["days"], DEFAULT_CONFIG.home.publish.costFormula, "home", "publish");

        this.tprCost = this._buildFunc(["count"], tprF);
        this.tpaCost = this._buildFunc(["count"], tpaF);
        this.warpCost = this._buildFunc(["count"], warpF);
        this.suicideCost = this._buildFunc(["count"], suicideF);
        this.backCost = this._buildFunc(["count", "index"], backF);
        this.tpsCost = this._buildFunc(["count"], tpsF);
        
        this.homeAddCost = this._buildFunc(["count"], homeAddF);
        this.homeGoCost = this._buildFunc(["count"], homeGoF);
        this.homePublishCost = this._buildFunc(["days"], homePubF);
    },
    _buildFunc: function(args, formulaStr) {
        try { return new Function(...args, "return (" + formulaStr + ");"); } 
        catch (e) { return function() { return 0; }; }
    }
};
Formulas.update();

function tr(player, key, obj) {
    let langs = dataDb.init("playerLangs", {});
    let locale = (player && player.xuid) ? (langs[player.xuid] || config.get("language")) : config.get("language");
    return obj ? i18n.trl(locale, key, obj) : i18n.trl(locale, key);
}

function sendMsg(player, key, obj) {
    let msg = PREFIX + tr(player, key, obj);
    if (player && player.tell) player.tell(msg);
    else logger.info(msg.replace(/§[0-9a-fk-or]/g, ""));
}

const Util = {
    getTodayStr: function() {
        let tm = system.getTimeObj();
        return `${tm.Y}-${tm.M}-${tm.D}`;
    },
    getCount: function(dbKey, xuid) {
        let today = this.getTodayStr();
        let dbObj = dataDb.init(dbKey, {});
        let record = dbObj[xuid];
        if (!record || record.date !== today) return 0;
        return record.count;
    },
    addCount: function(dbKey, xuid) {
        let today = this.getTodayStr();
        let counts = dataDb.init(dbKey, {});
        counts[xuid] = { date: today, count: this.getCount(dbKey, xuid) + 1 };
        dataDb.set(dbKey, counts);
    },
    acceptsTpa: function(xuid) {
        let settings = dataDb.init("tpaSettings", {});
        return settings[xuid] !== false;
    },
    hasPendingRequest: function(senderXuid) {
        for (let target in tpaQueue) {
            for (let req of tpaQueue[target]) {
                if (req.senderXuid === senderXuid) return true;
            }
        }
        return false;
    }
};

const Eco = {
    cfg: config.get("economy"),
    getSpecific: function(player, sbName) {
        if (sbName === "llmoney") return money.get(player.xuid) || 0;
        let s = player.getScore(sbName);
        return (typeof s === 'number' && !isNaN(s)) ? s : 0;
    },
    get: function(player) {
        return this.getSpecific(player, this.cfg.type === "llmoney" ? "llmoney" : this.cfg.sbName);
    },
    reduce: function(player, amount) {
        amount = Math.floor(amount);
        if (amount <= 0) return true;
        let current = this.get(player);
        if (current < amount) return false;
        if (this.cfg.type === "llmoney") return money.reduce(player.xuid, amount);
        else return player.setScore(this.cfg.sbName, current - amount) !== null;
    },
    add: function(player, amount) {
        amount = Math.floor(amount);
        if (amount <= 0) return true;
        if (this.cfg.type === "llmoney") return money.add(player.xuid, amount);
        else return player.setScore(this.cfg.sbName, this.get(player) + amount) !== null;
    }
};

function checkWordFilter(text) {
    let wfConfig = config.get("wordFilter");
    if (!wfConfig || !wfConfig.enabled) return true;
    let words = wfConfig.words || [];
    let lowerText = text.toLowerCase();
    for (let word of words) {
        if (lowerText.includes(word.toLowerCase())) return false; 
    }
    return true; 
}

mc.listen("onTick", () => {
    currentTick++;
    
    tickTimestamps[tickIndex] = Date.now();
    tickIndex = (tickIndex + 1) % TPS_HISTORY_SIZE;
    tickTotalCount++;

    if (currentTick % 100 === 0 && csvLogQueue.length > 0) {
        let grouped = {};
        while(csvLogQueue.length > 0) {
            let item = csvLogQueue.shift();
            if (!grouped[item.today]) grouped[item.today] = [];
            grouped[item.today].push(item.line);
        }
        for (let date in grouped) {
            let path = LOG_PATH + `/${date}.csv`;
            if (!File.exists(path)) {
                File.writeLine(path, "Time,Player,Event,Data");
            }
            File.writeLine(path, grouped[date].join("\n"));
        }
    }

    if (currentTick % 20 === 0) { 
        for (let targetXuid in tpaQueue) {
            let queue = tpaQueue[targetXuid];
            for (let i = queue.length - 1; i >= 0; i--) {
                let req = queue[i];
                if (currentTick >= req.expireTick) {
                    let senderPlayer = mc.getPlayer(req.senderXuid);
                    let targetPlayer = mc.getPlayer(targetXuid);
                    if (targetPlayer) sendMsg(targetPlayer, "tpa.expired.target", { name: req.senderName });
                    if (senderPlayer) {
                        let currentCount = Util.getCount("tpaCounts", req.senderXuid);
                        let countForRefund = currentCount > 0 ? currentCount - 1 : 0;
                        let baseCost = Formulas.tpaCost(countForRefund);
                        let refund = Math.floor(baseCost * config.get("tpa").refundRate);
                        
                        if (refund > 0) {
                            Eco.add(senderPlayer, refund);
                            sendMsg(senderPlayer, "tpa.expired.sender.refund", { name: req.targetName, refund: refund });
                        } else {
                            sendMsg(senderPlayer, "tpa.expired.sender.norefund", { name: req.targetName });
                        }
                    }
                    queue.splice(i, 1);
                }
            }
        }
    }

    if (currentTick % 1200 === 0) {
        let pubContent = pubHomeDb.read();
        if (pubContent) {
            let pubObj = JSON.parse(pubContent);
            let modified = false;
            let currentMs = Date.now();
            for (let pubId in pubObj) {
                if (currentMs >= pubObj[pubId].expireTime) {
                    delete pubObj[pubId];
                    modified = true;
                }
            }
            if (modified) pubHomeDb.write(JSON.stringify(pubObj, null, 4));
        }

        if (config.get("playerDatabase") && config.get("playerDatabase").enabled) {
            let inc = 0.95;
            let tpsCfg = config.get("tps");
            if (tpsCfg && tpsCfg.enabled) {
                let tpsStr = getAvgTps(60); 
                let tps = parseFloat(tpsStr);
                if (!isNaN(tps) && tps > 0) inc = 20 / tps;
                else inc = 1.0;
            }
            let players = mc.getOnlinePlayers();
            for (let pl of players) {
                if (pl.isSimulatedPlayer()) continue;
                let data = pdbDb.get(pl.xuid);
                if (data) {
                    data.OnlineTime = Math.round(((data.OnlineTime || 0) + inc) * 100) / 100;
                    pdbDb.set(pl.xuid, data);
                }
            }
        }
    }
});

mc.listen("onPlayerDie", (player, source) => {
    if (player.isSimulatedPlayer() || !config.get("back").enabled) return;
    let pos = player.pos;
    let records = deathDb.get(player.xuid) || [];
    records.unshift({ x: pos.x, y: pos.y, z: pos.z, dimid: pos.dimid, time: system.getTimeStr() });
    
    let max = config.get("back").maxDeathRecords;
    if (records.length > max) records = records.slice(0, max);
    deathDb.set(player.xuid, records);
});

mc.listen("onPreJoin", (player) => {
    if (config.get("ban").enabled) {
        let res = checkLocalBan(player.xuid, player.name, player.ip, null);
        if (res.banned) {
            logger.warn(`[BanSystem] 本地黑名单拦截: ${player.name} (${player.xuid}) -> 理由: ${res.reason}`);
            player.kick(tr(player, "ban.kick.local", { reason: res.reason }));
            return false;
        }
    }
});

mc.listen("onJoin", (player) => {
    if (player.isSimulatedPlayer()) return;
    
    if (config.get("ban").enabled) {
        let dv = player.getDevice();
        let clientId = dv ? dv.clientId : null;
        let ip = dv ? dv.ip : player.ip;
        
        let res = checkLocalBan(player.xuid, player.realName, ip, clientId);
        if (res.banned) {
            logger.warn(`[BanSystem] 本地黑名单(深度检查)拦截: ${player.realName} -> 理由: ${res.reason}`);
            player.kick(tr(player, "ban.kick.local", { reason: res.reason }));
            return;
        }
        
        checkCloudBan(player.xuid, player.realName, ip, clientId, (banned, reason) => {
            if (banned) {
                logger.warn(`[BanSystem] 云端黑名单拦截: ${player.realName} -> 理由: ${reason}`);
                let p = mc.getPlayer(player.xuid);
                if (p) p.kick(tr(p, "ban.kick.cloud", { reason: reason }));
                
                if (config.get("ban").cloudRecordToLocal) {
                    addLocalBan({xuid: player.xuid, name: player.realName, ip: ip, clientId: clientId}, "Cloud Ban: " + reason, null);
                }
            }
        });
    }

    if (config.get("playerDatabase") && config.get("playerDatabase").enabled) {
        let xuid = player.xuid;
        let pData = pdbDb.get(xuid);
        let dv = player.getDevice();
        let ip = dv ? dv.ip : player.ip;
        let cid = dv ? dv.clientId : null;
        let realName = player.realName;

        let isNew = false;
        if (!pData) {
            isNew = true;
            pData = {
                name: realName,
                historyname: [],
                IPs: [],
                clientIDs: [],
                OnlineTime: 0
            };
        } else {
            if (!pData.historyname) pData.historyname = [];
            if (!pData.IPs) pData.IPs = [];
            if (!pData.clientIDs) pData.clientIDs = [];
            if (pData.OnlineTime == null) pData.OnlineTime = 0;
            
            if (pData.name !== realName) {
                if (!pData.historyname.includes(pData.name)) pData.historyname.push(pData.name);
                pData.name = realName;
            }
        }

        if (ip && !pData.IPs.includes(ip)) pData.IPs.push(ip);
        if (cid && !pData.clientIDs.includes(cid)) pData.clientIDs.push(cid);
        
        pdbDb.set(xuid, pData);

        if (isNew) {
            let regData = JSON.parse(regDb.read() || '{"total":0,"records":{}}');
            regData.total = (regData.total || 0) + 1;
            let tm = system.getTimeObj();
            let dateStr = `${tm.Y}-${String(tm.M).padStart(2,'0')}-${String(tm.D).padStart(2,'0')}`;
            let timeStr = `${String(tm.h).padStart(2,'0')}:${String(tm.m).padStart(2,'0')}:${String(tm.s).padStart(2,'0')}`;
            if (!regData.records) regData.records = {};
            regData.records[xuid] = {
                name: realName,
                date: dateStr,
                time: timeStr,
                ts: Date.now()
            };
            regDb.write(JSON.stringify(regData, null, 4));
        }
    }

    if (config.get("notice").enabled) {
        setTimeout(() => {
            let p = mc.getPlayer(player.xuid);
            if (p) {
                let currentNotice = config.get("notice").content;
                let noticeHash = data.toMD5(currentNotice);
                let reads = dataDb.init("noticeReads", {});
                if (reads[p.xuid] !== noticeHash) {
                    sendNoticeForm(p, currentNotice, noticeHash, false);
                }
            }
        }, 5000); 
    }
});

mc.listen("onServerStarted", () => {
    registerLangCommands();
    registerMoneyCommands();
    if (config.get("tpr").enabled) registerTprCommands();
    if (config.get("tpa").enabled) registerTpaCommands();
    if (config.get("warp").enabled) registerWarpCommands();
    if (config.get("suicide").enabled) registerSuicideCommands();
    if (config.get("back").enabled) registerBackCommands();
    if (config.get("home").enabled) registerHomeCommands();
    if (config.get("tps").enabled) registerTpsCommands();
    if (config.get("ban").enabled) registerBanCommands();
    if (config.get("notice").enabled) registerNoticeCommand();
    
    if (config.get("customCommands") && config.get("customCommands").enabled) {
        registerCusCmdSys();
    }
    if (config.get("playerManage") && config.get("playerManage").enabled) {
        registerPlayerManageCommands();
    }
    if (config.get("playerDatabase") && config.get("playerDatabase").enabled) {
        registerPlayerDatabaseCommand();
    }
    
    startDynamicMotd();
});

function registerTprCommands() {
    let cmdTpr = mc.newCommand("tpr", "随机传送 / Random Teleport", PermType.Any);
    cmdTpr.overload([]);
    cmdTpr.setCallback((cmd, origin) => {
        if (!origin.player || origin.player.isSimulatedPlayer()) return;
        processTpr(origin.player);
    });
    cmdTpr.setup();
}

function processTpr(player) {
    let cfg = config.get("tpr");
    if (!cfg.enabled) { sendMsg(player, "tpr.disabled"); return; }
    
    let dimCfg = cfg.dimensions[player.pos.dimid];
    if (!dimCfg || !dimCfg.enabled) { sendMsg(player, "tpr.dim_disabled"); return; }

    let now = Date.now();
    if (tprCooldowns[player.xuid] && now - tprCooldowns[player.xuid] < cfg.cooldownSeconds * 1000) {
        let left = Math.ceil((cfg.cooldownSeconds * 1000 - (now - tprCooldowns[player.xuid])) / 1000);
        sendMsg(player, "tpr.cooldown", { left: left });
        return;
    }

    let count = Util.getCount("tprCounts", player.xuid);
    let cost = Math.floor(Formulas.tprCost(count));
    if (isNaN(cost) || cost < 0) cost = 0;

    if (Eco.get(player) < cost) { sendMsg(player, "tpr.nomoney", { cost: cost }); return; }
    if (!Eco.reduce(player, cost)) { sendMsg(player, "error.deduct"); return; }

    tprCooldowns[player.xuid] = now;
    Util.addCount("tprCounts", player.xuid);

    startTprSearch(player, cost, dimCfg, 0, player.pos, cfg);
}

function isSafeBodySpace(block) {
    if (!block || typeof block.type !== 'string') return false;
    if (block.isAir) return true;
    let t = block.type;
    const passables = ["tallgrass", "double_plant", "yellow_flower", "red_flower", "snow_layer", "brown_mushroom", "red_mushroom", "deadbush", "fern", "vine", "waterlily", "torch", "sign", "lantern"];
    for (let p of passables) {
        if (t.includes(p)) return true;
    }
    return false;
}

function isDangerousSurface(block) {
    if (!block || typeof block.type !== 'string') return true;
    let t = block.type;
    const dangers = ["lava", "water", "fire", "magma", "powder_snow", "cactus", "sweet_berry_bush", "air", "void", "bedrock"];
    for (let d of dangers) {
        if (t.includes(d)) return true;
    }
    return false;
}

function startTprSearch(player, cost, dimCfg, attempts, originalPos, cfg) {
    if (attempts >= cfg.maxAttempts) {
        player.teleport(originalPos.x, originalPos.y, originalPos.z, originalPos.dimid);
        Eco.add(player, cost);
        
        let counts = dataDb.init("tprCounts", {});
        let today = Util.getTodayStr();
        if (counts[player.xuid] && counts[player.xuid].date === today && counts[player.xuid].count > 0) {
            counts[player.xuid].count--;
            dataDb.set("tprCounts", counts);
        }
        
        sendMsg(player, "tpr.failed");
        csvLog("TPR", player.realName, `TPR failed after ${cfg.maxAttempts} attempts, refunded`);
        return;
    }

    let rx, rz;
    if (attempts === 0) {
        rx = Math.floor(Math.random() * (dimCfg.rangeX[1] - dimCfg.rangeX[0] + 1)) + dimCfg.rangeX[0];
        rz = Math.floor(Math.random() * (dimCfg.rangeZ[1] - dimCfg.rangeZ[0] + 1)) + dimCfg.rangeZ[0];
    } else {
        rx = Math.floor(player.pos.x + (Math.random() * 100 - 50));
        rz = Math.floor(player.pos.z + (Math.random() * 100 - 50));
        rx = Math.max(dimCfg.rangeX[0], Math.min(dimCfg.rangeX[1], rx));
        rz = Math.max(dimCfg.rangeZ[0], Math.min(dimCfg.rangeZ[1], rz));
    }

    let maxY = dimCfg.maxY;
    let targetDim = originalPos.dimid;

    let delayTicks = Math.floor(cfg.loadDelayMs / 1000 * 20);
    player.addEffect(27, delayTicks + 60, 1, false);
    
    player.teleport(rx, maxY, rz, targetDim);
    player.refreshChunks();
    sendMsg(player, "tpr.searching", { attempt: attempts + 1, max: cfg.maxAttempts });

    setTimeout(() => {
        let p = mc.getPlayer(player.xuid);
        if (!p) return;

        let found = false;
        let safeY = maxY;
        
        for (let y = maxY; y > 0; y--) {
            let b1 = mc.getBlock(rx, y - 1, rz, targetDim);
            let b2 = mc.getBlock(rx, y, rz, targetDim);
            let b3 = mc.getBlock(rx, y + 1, rz, targetDim);

            if (!b1 || !b2 || !b3) break; 

            if (!isSafeBodySpace(b1)) {
                if (!isDangerousSurface(b1) && isSafeBodySpace(b2) && isSafeBodySpace(b3)) {
                    found = true;
                    safeY = y;
                    break;
                } else {
                    break;
                }
            }
        }

        if (found) {
            p.addEffect(27, 20 * 10, 1, false); 
            p.teleport(rx, safeY, rz, targetDim);
            sendMsg(p, "tpr.success", { x: rx, y: safeY, z: rz, cost: cost });
            csvLog("TPR", p.realName, `TPR success to ${rx}, ${safeY}, ${rz}`);
        } else {
            startTprSearch(p, cost, dimCfg, attempts + 1, originalPos, cfg);
        }
    }, cfg.loadDelayMs);
}


function getAvgTps(expectedSeconds) {
    if (tickTotalCount < 2) return (20.00).toFixed(2);
    let targetIntervals = expectedSeconds * 20;
    
    let actualIntervals = Math.min(tickTotalCount - 1, targetIntervals, TPS_HISTORY_SIZE - 1);

    let newestIdx = (tickIndex - 1 + TPS_HISTORY_SIZE) % TPS_HISTORY_SIZE;
    let oldestIdx = (tickIndex - 1 - actualIntervals + TPS_HISTORY_SIZE) % TPS_HISTORY_SIZE;

    let dt = (tickTimestamps[newestIdx] - tickTimestamps[oldestIdx]) / 1000.0;
    if (dt <= 0) return (20.00).toFixed(2);

    let tps = actualIntervals / dt;
    return Math.min(20.00, tps).toFixed(2);
}

function getTpsGraph() {
    let graph = "";
    let now = Date.now();
    if (tickTotalCount < 2) return "§8" + "▍".repeat(60);

    let validHistory = Math.min(tickTotalCount, TPS_HISTORY_SIZE);
    let oldestIdx = (tickIndex - validHistory + TPS_HISTORY_SIZE) % TPS_HISTORY_SIZE;
    let oldestTs = tickTimestamps[oldestIdx];

    let currentBucketId = Math.floor(now / 10000);
    let buckets = {};

    let checkLimit = Math.min(tickTotalCount, TPS_HISTORY_SIZE);
    for (let i = 0; i < checkLimit; i++) {
        let idx = (tickIndex - 1 - i + TPS_HISTORY_SIZE) % TPS_HISTORY_SIZE;
        let ts = tickTimestamps[idx];
        if (now - ts > 600000) break;
        let bId = Math.floor(ts / 10000);
        buckets[bId] = (buckets[bId] || 0) + 1;
    }

    for (let i = 0; i < 60; i++) {
        let targetId = (currentBucketId - 60) + i;
        let windowStartTime = targetId * 10000;

        if (oldestTs > windowStartTime || targetId >= currentBucketId) {
            graph += "§8▍";
            continue;
        }

        let tickCount = buckets[targetId] || 0;
        let avg = tickCount / 10;

        if (avg >= 19) graph += "§2▍";       
        else if (avg >= 15) graph += "§a▍";  
        else if (avg >= 10) graph += "§e▍";  
        else if (avg >= 4) graph += "§6▍";   
        else graph += "§4▍";                 
    }
    return graph;
}

function registerTpsCommands() {
    let cfg = config.get("tps");
    
    if (cfg.playerEnabled) {
        let cmdTps = mc.newCommand("tps", "查询服务器TPS", PermType.Any);
        cmdTps.overload([]);
        cmdTps.setCallback((cmd, origin) => {
            if (!origin.player || origin.player.isSimulatedPlayer()) return;
            let pl = origin.player;
            let cost = Math.floor(Formulas.tpsCost(Util.getCount("tpsCounts", pl.xuid)));
            if (isNaN(cost) || cost < 0) cost = 0;
            
            if (Eco.get(pl) < cost) { 
                sendMsg(pl, "tps.player.nomoney", { cost: cost });
                return; 
            }
            if (!Eco.reduce(pl, cost)) {
                sendMsg(pl, "error.deduct");
                return;
            }
            
            Util.addCount("tpsCounts", pl.xuid);
            let currentTps = getAvgTps(1);
            sendMsg(pl, "tps.player.success", { tps: currentTps, cost: cost });
            csvLog("TPS", pl.realName, "Queried TPS");
        });
        cmdTps.setup();
    }

    let cmdTpsAdmin = mc.newCommand("tpsadmin", "管理员查询TPS状态", PermType.GameMasters);
    cmdTpsAdmin.overload([]);
    cmdTpsAdmin.setCallback((cmd, origin) => {
        let p = origin.player;
        let out = tr(p, "tps.admin.title") +
            tr(p, "tps.admin.current", { tps: getAvgTps(1) }) +
            tr(p, "tps.admin.30s", { tps: getAvgTps(30) }) +
            tr(p, "tps.admin.2m", { tps: getAvgTps(120) }) +
            tr(p, "tps.admin.5m", { tps: getAvgTps(300) }) +
            tr(p, "tps.admin.10m", { tps: getAvgTps(600) }) +
            tr(p, "tps.admin.graph") +
            getTpsGraph();
        
        if (p) p.tell(out);
        else logger.info("\n" + out.replace(/§[0-9a-fk-or]/g, ""));
    });
    cmdTpsAdmin.setup();
}

function mergeBans(bans) {
    let merged = true;
    while(merged) {
        merged = false;
        for (let i = 0; i < bans.length; i++) {
            for (let j = i + 1; j < bans.length; j++) {
                let b1 = bans[i], b2 = bans[j];
                let intersect = b1.xuids.some(x=>b2.xuids.includes(x)) || 
                                b1.names.some(n=>b2.names.includes(n)) ||
                                b1.ips.some(ip=>b2.ips.includes(ip)) ||
                                b1.clientIds.some(c=>b2.clientIds.includes(c));
                if (intersect) {
                    b1.xuids = [...new Set([...b1.xuids, ...b2.xuids])];
                    b1.names = [...new Set([...b1.names, ...b2.names])];
                    b1.ips = [...new Set([...b1.ips, ...b2.ips])];
                    b1.clientIds = [...new Set([...b1.clientIds, ...b2.clientIds])];
                    if (!b1.expireTime || !b2.expireTime) b1.expireTime = null; 
                    else b1.expireTime = Math.max(b1.expireTime, b2.expireTime);
                    
                    bans.splice(j, 1);
                    merged = true;
                    break;
                }
            }
            if(merged) break;
        }
    }
    return bans;
}

function checkLocalBan(xuid, name, ip, clientId) {
    let bans = banDb.get("list") || [];
    let isBanned = false;
    let matchedBan = null;
    let now = Date.now();
    let modified = false;

    for (let i = bans.length - 1; i >= 0; i--) {
        let b = bans[i];
        if (b.expireTime && b.expireTime < now) {
            bans.splice(i, 1);
            modified = true;
            continue;
        }
        
        let match = false;
        if (xuid && b.xuids.includes(xuid)) match = true;
        if (name && b.names.includes(name)) match = true;
        if (ip && b.ips.includes(ip)) match = true;
        if (clientId && b.clientIds.includes(clientId)) match = true;
        
        if (match) {
            isBanned = true;
            matchedBan = b;
            if (xuid && !b.xuids.includes(xuid)) { b.xuids.push(xuid); modified = true; }
            if (name && !b.names.includes(name)) { b.names.push(name); modified = true; }
            if (ip && !b.ips.includes(ip)) { b.ips.push(ip); modified = true; }
            if (clientId && !b.clientIds.includes(clientId)) { b.clientIds.push(clientId); modified = true; }
        }
    }
    
    if (modified) {
        bans = mergeBans(bans);
        banDb.set("list", bans);
    }
    
    if (isBanned) return { banned: true, reason: matchedBan.reason };
    return { banned: false };
}

function addLocalBan(info, reason, durationDays) {
    let bans = banDb.get("list") || [];
    let expire = durationDays ? Date.now() + durationDays * 86400000 : null;
    let newBan = {
        id: system.randomGuid(),
        xuids: info.xuid ? [info.xuid] : [],
        names: info.name ? [info.name] : [],
        ips: info.ip ? [info.ip] : [],
        clientIds: info.clientId ? [info.clientId] : [],
        reason: reason || tr(null, "ban.reason.default"),
        expireTime: expire
    };
    bans.push(newBan);
    bans = mergeBans(bans);
    banDb.set("list", bans);
}

function checkCloudBan(xuid, name, ip, clientId, callback) {
    let cfg = config.get("ban");
    let checked = 0;
    let total = (cfg.cloudBlackBE ? 1 : 0) + (cfg.cloudUniteBan ? 1 : 0);
    if (total === 0) {
        callback(false, "");
        return;
    }
    
    let isBanned = false;
    let finalReason = "";

    function finish() {
        checked++;
        if (isBanned && checked <= total) {
            checked = 999;
            csvLog("CloudBan", name || xuid, `Detected by cloud: ${finalReason}`);
            callback(true, finalReason);
        } else if (checked === total && !isBanned) {
            callback(false, "");
        }
    }

    if (cfg.cloudBlackBE) {
        let url = `https://api.blackbe.work/openapi/v3/check/?xuid=${xuid||""}&name=${name||""}`;
        network.httpGet(url, (status, result) => {
            if (status === 200 && result) {
                try {
                    let res = JSON.parse(result);
                    if (res.success && res.data && res.data.exist) {
                        isBanned = true;
                        finalReason = "BlackBE: " + (res.data.info[0].info || res.message);
                    }
                } catch(e){}
            }
            finish();
        });
    }

    if (cfg.cloudUniteBan) {
        let url = `https://uniteban.megastudio.cn/api/check_ban.php?xuid=${xuid||""}`;
        if (ip) url += `&ip_address=${ip}`;
        if (clientId) url += `&client_id=${clientId}`;
        network.httpGet(url, (status, result) => {
            if (status === 200 && result) {
                try {
                    let res = JSON.parse(result);
                    if (res.ok && res.data && res.data.banned) {
                        isBanned = true;
                        finalReason = "UniteBan: " + res.data.ban.reason;
                    }
                } catch(e){}
            }
            finish();
        });
    }
}

function sendBanForm(admin) {
    let onlinePlayers = mc.getOnlinePlayers().filter(p => !p.isSimulatedPlayer());
    let names = onlinePlayers.map(p => p.realName);
    
    let fm = mc.newCustomForm().setTitle(tr(admin, "ban.form.title"));
    fm.addDropdown(tr(admin, "ban.form.dropdown"), [tr(admin, "ban.form.dropdown.empty"), ...names], 0);
    fm.addInput(tr(admin, "ban.form.input_name"), "Name or XUID", "");
    fm.addInput(tr(admin, "ban.form.input_days"), tr(admin, "ban.form.days_ph"), "");
    fm.addInput(tr(admin, "ban.form.input_reason"), tr(admin, "ban.form.reason_ph"), tr(admin, "ban.reason.default"));
    
    admin.sendForm(fm, (pl, data) => {
        if (!data) return;
        let targetStr = "";
        let targetPlayer = null;

        if (data[1] && data[1].trim() !== "") {
            targetStr = data[1].trim();
        } else if (data[0] > 0) {
            targetPlayer = onlinePlayers[data[0]-1];
            targetStr = targetPlayer.realName;
        } else {
            sendMsg(pl, "error.player_only");
            return;
        }

        let days = parseFloat(data[2]);
        if (isNaN(days) || days <= 0) days = null;
        let reason = data[3] || tr(pl, "ban.reason.default");

        processBan(pl, targetStr, targetPlayer, days, reason);
    });
}

function processBan(admin, targetStr, targetPlayer, days, reason) {
    let info = { xuid: null, name: null, ip: null, clientId: null };
    
    if (!targetPlayer) {
        let tp = mc.getPlayer(targetStr);
        if (tp) targetPlayer = tp;
    }

    if (targetPlayer) {
        info.xuid = targetPlayer.xuid;
        info.name = targetPlayer.realName;
        let dv = targetPlayer.getDevice();
        info.ip = dv ? dv.ip : targetPlayer.ip;
        info.clientId = dv ? dv.clientId : null;
    } else {
        if (/^\d{16}$/.test(targetStr)) info.xuid = targetStr;
        else info.name = targetStr;
    }

    addLocalBan(info, reason, days);
    
    let targetP = targetPlayer || (info.xuid ? mc.getPlayer(info.xuid) : null) || (info.name ? mc.getPlayer(info.name) : null);
    if (targetP) targetP.kick(tr(targetP, "ban.kick.local", { reason: reason }));

    sendMsg(admin.tell ? admin : null, "ban.success");
    csvLog("Ban", admin.realName || "Console", `Banned ${info.name||info.xuid} for ${days ? days+" days" : "forever"}`);
}

function sendUnbanForm(admin) {
    let bans = banDb.get("list") || [];
    if (bans.length === 0) {
        sendMsg(admin, "unban.none");
        return;
    }
    
    let fm = mc.newSimpleForm().setTitle(tr(admin, "unban.form.title"));
    bans.forEach(b => {
        let title = (b.names.length > 0 ? b.names.join(", ") : b.xuids.join(", "));
        let exp = b.expireTime ? new Date(b.expireTime).toLocaleString() : "永久";
        fm.addButton(`${title}\n${exp}`);
    });

    admin.sendForm(fm, (pl, id) => {
        if (id == null) return;
        let targetBan = bans[id];
        bans.splice(id, 1);
        banDb.set("list", bans);
        let namesStr = targetBan.names.length > 0 ? targetBan.names.join(", ") : targetBan.xuids.join(", ");
        sendMsg(pl, "unban.success", { name: namesStr });
        csvLog("Unban", pl.realName, `Unbanned ${namesStr}`);
    });
}

function processUnbanStr(admin, targetStr) {
    let bans = banDb.get("list") || [];
    let found = -1;
    for (let i = 0; i < bans.length; i++) {
        if (bans[i].xuids.includes(targetStr) || bans[i].names.includes(targetStr)) {
            found = i; break;
        }
    }
    if (found !== -1) {
        bans.splice(found, 1);
        banDb.set("list", bans);
        sendMsg(admin.tell ? admin : null, "unban.success", { name: targetStr });
        csvLog("Unban", admin.realName || "Console", `Unbanned ${targetStr}`);
    } else {
        sendMsg(admin.tell ? admin : null, "unban.not_found");
    }
}

function registerBanCommands() {
    let cmdBan = mc.newCommand("ban", "封禁玩家", PermType.GameMasters);
    cmdBan.optional("target", ParamType.String);
    cmdBan.overload(["target"]);
    cmdBan.overload([]);
    cmdBan.setCallback((cmd, origin, out, results) => {
        if (!origin.player) {
            if (results.target) processBan({realName: "Console"}, results.target, null, null, tr(null, "ban.reason.default"));
            else out.error(tr(null, "unban.console_err"));
            return;
        }
        if (results.target) {
            processBan(origin.player, results.target, null, null, tr(origin.player, "ban.reason.default"));
        } else {
            sendBanForm(origin.player);
        }
    });
    cmdBan.setup();

    let cmdUnban = mc.newCommand("unban", "解除封禁", PermType.GameMasters);
    cmdUnban.optional("target", ParamType.String);
    cmdUnban.overload(["target"]);
    cmdUnban.overload([]);
    cmdUnban.setCallback((cmd, origin, out, results) => {
        if (!origin.player) {
            if (results.target) processUnbanStr({realName: "Console"}, results.target);
            else out.error(tr(null, "unban.console_err"));
            return;
        }
        if (results.target) {
            processUnbanStr(origin.player, results.target);
        } else {
            sendUnbanForm(origin.player);
        }
    });
    cmdUnban.setup();
}

function getPubHomes() {
    let content = pubHomeDb.read();
    return content ? JSON.parse(content) : {};
}
function savePubHomes(obj) {
    pubHomeDb.write(JSON.stringify(obj, null, 4));
}

function registerHomeCommands() {
    let cmdHome = mc.newCommand("home", "家园系统 / Home System", PermType.Any);
    cmdHome.setEnum("HomeAction", ["add", "delete", "go", "publish"]);
    cmdHome.optional("action", ParamType.Enum, "HomeAction", "HomeAction", 1);
    cmdHome.optional("name", ParamType.String);
    cmdHome.overload([]);
    cmdHome.overload(["action"]);
    cmdHome.overload(["action", "name"]);
    
    cmdHome.setCallback((cmd, origin, out, results) => {
        if (!origin.player || origin.player.isSimulatedPlayer()) return;
        let pl = origin.player;

        let action = results.action;
        let name = results.name;

        if (!action) {
            sendHomeMainForm(pl);
            return;
        }

        switch (action) {
            case "add":
                if (name) processHomeAdd(pl, name);
                else sendHomeAddForm(pl);
                break;
            case "delete":
                if (name) processHomeDelete(pl, name);
                else sendHomeDeleteForm(pl);
                break;
            case "go":
                if (name) processHomeGo(pl, name);
                else sendHomeGoForm(pl);
                break;
            case "publish":
                sendHomePublishMainForm(pl);
                break;
        }
    });
    cmdHome.setup();

    let cmdHomeWarp = mc.newCommand("homewarp", "前往公开家园 / Public Homes", PermType.Any);
    cmdHomeWarp.overload([]);
    cmdHomeWarp.setCallback((cmd, origin) => {
        if (origin.player && !origin.player.isSimulatedPlayer()) sendPubHomeListForm(origin.player);
    });
    cmdHomeWarp.setup();

    let cmdHomeWarpAdmin = mc.newCommand("homewarpadmin", "管理公开家园 / Admin Public Homes", PermType.GameMasters);
    cmdHomeWarpAdmin.overload([]);
    cmdHomeWarpAdmin.setCallback((cmd, origin) => {
        if (origin.player && !origin.player.isSimulatedPlayer()) sendPubHomeAdminForm(origin.player);
    });
    cmdHomeWarpAdmin.setup();
}

function processHomeAdd(pl, name) {
    if (!name || name.trim() === "") return;
    let homes = homeDb.get(pl.xuid) || {};
    if (homes[name]) { sendMsg(pl, "home.add.exist", { name: name }); return; }
    
    let currentCount = Object.keys(homes).length;
    let cost = Math.floor(Formulas.homeAddCost(currentCount));
    if (isNaN(cost) || cost < 0) cost = 0;

    if (Eco.get(pl) < cost) { sendMsg(pl, "home.add.nomoney", { cost: cost }); return; }
    if (!Eco.reduce(pl, cost)) { sendMsg(pl, "error.deduct"); return; }

    let pos = pl.pos;
    homes[name] = { x: pos.x, y: pos.y, z: pos.z, dimid: pos.dimid };
    homeDb.set(pl.xuid, homes);
    sendMsg(pl, "home.add.success", { name: name, cost: cost });
    csvLog("Home", pl.realName, "Added home " + name);
}

function processHomeDelete(pl, name) {
    let homes = homeDb.get(pl.xuid) || {};
    if (!homes[name]) { sendMsg(pl, "home.not_found", { name: name }); return; }

    delete homes[name];
    homeDb.set(pl.xuid, homes);

    let pubId = pl.xuid + "_" + name;
    let pubHomes = getPubHomes();
    if (pubHomes[pubId]) {
        delete pubHomes[pubId];
        savePubHomes(pubHomes);
    }
    sendMsg(pl, "home.delete.success", { name: name });
    csvLog("Home", pl.realName, "Deleted home " + name);
}

function processHomeGo(pl, name) {
    let homes = homeDb.get(pl.xuid) || {};
    if (!homes[name]) { sendMsg(pl, "home.not_found", { name: name }); return; }

    let count = Util.getCount("homeGoCounts", pl.xuid);
    let cost = Math.floor(Formulas.homeGoCost(count));
    if (isNaN(cost) || cost < 0) cost = 0;

    if (Eco.get(pl) < cost) { sendMsg(pl, "home.go.nomoney", { cost: cost }); return; }
    if (!Eco.reduce(pl, cost)) { sendMsg(pl, "error.deduct"); return; }

    Util.addCount("homeGoCounts", pl.xuid);
    let h = homes[name];
    pl.teleport(h.x, h.y, h.z, h.dimid);
    sendMsg(pl, "home.go.success", { name: name, cost: cost });
    csvLog("Home", pl.realName, "Went to home " + name);
}

function sendHomeMainForm(pl) {
    let fm = mc.newSimpleForm()
        .setTitle(tr(pl, "home.main.title"))
        .setContent(tr(pl, "home.main.desc"))
        .addButton(tr(pl, "home.main.btn.go"))
        .addButton(tr(pl, "home.main.btn.add"))
        .addButton(tr(pl, "home.main.btn.delete"))
        .addButton(tr(pl, "home.main.btn.publish"));

    pl.sendForm(fm, (player, id) => {
        if (id == null) return;
        if (id === 0) sendHomeGoForm(player);
        if (id === 1) sendHomeAddForm(player);
        if (id === 2) sendHomeDeleteForm(player);
        if (id === 3) sendHomePublishMainForm(player);
    });
}

function sendHomeAddForm(pl) {
    let fm = mc.newCustomForm().setTitle(tr(pl, "home.add.title"));
    fm.addInput(tr(pl, "home.add.name"), "Name");
    pl.sendForm(fm, (player, data) => { if (data != null) processHomeAdd(player, data[0]); });
}

function sendHomeDeleteForm(pl) {
    let homes = homeDb.get(pl.xuid) || {};
    let names = Object.keys(homes);
    if (names.length === 0) { sendMsg(pl, "home.none"); return; }
    
    let fm = mc.newSimpleForm().setTitle(tr(pl, "home.delete.title")).setContent("");
    names.forEach(n => fm.addButton(n));
    pl.sendForm(fm, (player, id) => { if (id != null) processHomeDelete(player, names[id]); });
}

function sendHomeGoForm(pl) {
    let homes = homeDb.get(pl.xuid) || {};
    let names = Object.keys(homes);
    if (names.length === 0) { sendMsg(pl, "home.none"); return; }
    
    let fm = mc.newSimpleForm().setTitle(tr(pl, "home.go.title")).setContent("");
    names.forEach(n => fm.addButton(n));
    pl.sendForm(fm, (player, id) => { if (id != null) processHomeGo(player, names[id]); });
}

function sendHomePublishMainForm(pl) {
    let fm = mc.newSimpleForm()
        .setTitle(tr(pl, "home.pub.title"))
        .addButton(tr(pl, "home.pub.btn.create"))
        .addButton(tr(pl, "home.pub.btn.remove"));
    pl.sendForm(fm, (player, id) => {
        if (id === 0) sendHomePublishCreateForm(player);
        if (id === 1) sendHomePublishRemoveForm(player);
    });
}

function sendHomePublishCreateForm(pl) {
    let cfg = config.get("home").publish;
    if (!cfg.enabled) { sendMsg(pl, "home.pub.disabled"); return; }
    
    let pubHomes = getPubHomes();
    let globalCount = Object.keys(pubHomes).length;
    if (globalCount >= cfg.maxGlobal) { sendMsg(pl, "home.pub.full_global"); return; }

    let playerPubCount = 0;
    for (let k in pubHomes) { if (pubHomes[k].publisherXuid === pl.xuid) playerPubCount++; }
    if (playerPubCount >= cfg.maxPerPlayer) { sendMsg(pl, "home.pub.full_player"); return; }

    let homes = homeDb.get(pl.xuid) || {};
    let availableHomes = [];
    for (let name of Object.keys(homes)) {
        if (!pubHomes[pl.xuid + "_" + name]) availableHomes.push(name);
    }
    if (availableHomes.length === 0) { sendMsg(pl, "home.pub.no_available"); return; }

    let fm = mc.newCustomForm()
        .setTitle(tr(pl, "home.pub.create.title"))
        .addLabel(tr(pl, "home.pub.create.desc", { max: cfg.maxDays }))
        .addDropdown(tr(pl, "home.pub.create.select"), availableHomes, 0)
        .addInput(tr(pl, "home.pub.create.days"), "1 - " + cfg.maxDays, "7");

    pl.sendForm(fm, (player, data) => {
        if (data == null) return;
        let selectedHome = availableHomes[data[1]];
        let days = parseInt(data[2]);
        if (isNaN(days) || days < 1 || days > cfg.maxDays) { sendMsg(player, "home.pub.invalid_days"); return; }
        if (!checkWordFilter(selectedHome)) { sendMsg(player, "wordfilter.blocked"); return; }

        let cost = Math.floor(Formulas.homePublishCost(days));
        if (isNaN(cost) || cost < 0) cost = 0;

        let pPubs = getPubHomes();
        if (Object.keys(pPubs).length >= cfg.maxGlobal || pPubs[pl.xuid + "_" + selectedHome]) {
            sendMsg(player, "home.pub.failed"); return;
        }

        if (Eco.get(player) < cost) { sendMsg(player, "home.pub.nomoney", { cost: cost }); return; }
        if (!Eco.reduce(player, cost)) { sendMsg(player, "error.deduct"); return; }

        let hData = homes[selectedHome];
        pPubs[pl.xuid + "_" + selectedHome] = {
            name: selectedHome, publisherName: player.realName, publisherXuid: player.xuid,
            x: hData.x, y: hData.y, z: hData.z, dimid: hData.dimid,
            expireTime: Date.now() + days * 86400000
        };
        savePubHomes(pPubs);
        sendMsg(player, "home.pub.success", { name: selectedHome, days: days, cost: cost });
        csvLog("Home", player.realName, "Published home " + selectedHome);
    });
}

function sendHomePublishRemoveForm(pl) {
    let pubHomes = getPubHomes();
    let myPubs = [];
    for (let k in pubHomes) { if (pubHomes[k].publisherXuid === pl.xuid) myPubs.push(pubHomes[k]); }

    if (myPubs.length === 0) { sendMsg(pl, "home.pub.remove.none"); return; }

    let fm = mc.newSimpleForm().setTitle(tr(pl, "home.pub.remove.title")).setContent(tr(pl, "home.pub.remove.desc"));
    myPubs.forEach(p => {
        let remainingDays = Math.max(0, (p.expireTime - Date.now()) / 86400000).toFixed(1);
        fm.addButton(p.name + "\n剩余: " + remainingDays + " 天");
    });

    pl.sendForm(fm, (player, id) => {
        if (id == null) return;
        let selected = myPubs[id];
        let pData = getPubHomes();
        let pubId = selected.publisherXuid + "_" + selected.name;
        if (pData[pubId]) {
            delete pData[pubId];
            savePubHomes(pData);
            sendMsg(player, "home.pub.remove.success", { name: selected.name });
            csvLog("Home", player.realName, "Removed public home " + selected.name);
        }
    });
}

function sendPubHomeListForm(pl) {
    let pubHomes = getPubHomes();
    let keys = Object.keys(pubHomes);
    if (keys.length === 0) { sendMsg(pl, "home.pub.list.none"); return; }

    let list = keys.map(k => pubHomes[k]);
    let fm = mc.newSimpleForm().setTitle(tr(pl, "home.pub.list.title")).setContent(tr(pl, "home.pub.list.desc"));
    list.forEach(p => fm.addButton(`[${p.publisherName}] ${p.name}`));

    pl.sendForm(fm, (player, id) => {
        if (id == null) return;
        let selected = list[id];
        let count = Util.getCount("homeGoCounts", player.xuid); 
        let cost = Math.floor(Formulas.homeGoCost(count));
        if (isNaN(cost) || cost < 0) cost = 0;

        if (Eco.get(player) < cost) { sendMsg(player, "home.go.nomoney", { cost: cost }); return; }
        if (!Eco.reduce(player, cost)) { sendMsg(player, "error.deduct"); return; }

        Util.addCount("homeGoCounts", player.xuid);
        player.teleport(selected.x, selected.y, selected.z, selected.dimid);
        sendMsg(player, "home.go.success", { name: selected.name, cost: cost });
        csvLog("Home", player.realName, "Went to public home " + selected.name);
    });
}

function sendPubHomeAdminForm(pl) {
    let pubHomes = getPubHomes();
    let keys = Object.keys(pubHomes);
    if (keys.length === 0) { sendMsg(pl, "home.pub.list.none"); return; }

    let list = keys.map(k => ({id: k, data: pubHomes[k]}));
    let fm = mc.newSimpleForm().setTitle(tr(pl, "home.pub.admin.title")).setContent(tr(pl, "home.pub.admin.desc"));
    list.forEach(p => fm.addButton(`[${p.data.publisherName}] ${p.data.name}`));

    pl.sendForm(fm, (player, id) => {
        if (id == null) return;
        let selected = list[id];
        let pData = getPubHomes();
        if (pData[selected.id]) {
            delete pData[selected.id];
            savePubHomes(pData);
            sendMsg(player, "home.pub.admin.removed", { name: selected.data.name });
            csvLog("Admin", player.realName, "Force removed public home " + selected.data.name);
        }
    });
}

function registerSuicideCommands() {
    let cmdSuicide = mc.newCommand("suicide", "自杀 / Suicide", PermType.Any);
    cmdSuicide.overload([]);
    cmdSuicide.setCallback((cmd, origin) => {
        if (!origin.player || origin.player.isSimulatedPlayer()) return;
        let pl = origin.player;
        let cost = Math.floor(Formulas.suicideCost(Util.getCount("suicideCounts", pl.xuid)));
        if (isNaN(cost) || cost < 0) cost = 0;
        
        if (Eco.get(pl) < cost) { sendMsg(pl, "suicide.nomoney", { cost: cost }); return; }
        if (!Eco.reduce(pl, cost)) { sendMsg(pl, "error.deduct"); return; }
        
        Util.addCount("suicideCounts", pl.xuid);
        pl.kill();
        sendMsg(pl, "suicide.success", { cost: cost });
        csvLog("Suicide", pl.realName, "Committed suicide");
    });
    cmdSuicide.setup();
}

function registerBackCommands() {
    let cmdBack = mc.newCommand("back", "返回死亡点 / Back to death point", PermType.Any);
    cmdBack.setEnum("GuiEnum", ["gui"]);
    cmdBack.optional("action", ParamType.Enum, "GuiEnum", "GuiEnum", 1);
    cmdBack.overload([]);
    cmdBack.overload(["action"]);
    cmdBack.setCallback((cmd, origin, out, results) => {
        if (!origin.player || origin.player.isSimulatedPlayer()) return;
        let pl = origin.player;
        let records = deathDb.get(pl.xuid) || [];
        if (records.length === 0) { sendMsg(pl, "back.none"); return; }
        
        if (results.action === "gui") sendBackForm(pl, records);
        else processBack(pl, records, 0);
    });
    cmdBack.setup();
}

function sendBackForm(pl, records) {
    let fm = mc.newSimpleForm().setTitle(tr(pl, "back.title"));
    let count = Util.getCount("backCounts", pl.xuid);
    records.forEach((r, idx) => {
        let cost = Math.floor(Formulas.backCost(count, idx + 1));
        if (isNaN(cost) || cost < 0) cost = 0;
        fm.addButton(tr(pl, "back.btn", {
            time: r.time, dim: tr(pl, "back.dim_" + r.dimid) || "Unknown",
            x: Math.floor(r.x), y: Math.floor(r.y), z: Math.floor(r.z), cost: cost
        }));
    });
    pl.sendForm(fm, (player, id) => { if (id != null) processBack(player, records, id); });
}

function processBack(pl, records, recordIndex) {
    if (recordIndex < 0 || recordIndex >= records.length) return;
    let cost = Math.floor(Formulas.backCost(Util.getCount("backCounts", pl.xuid), recordIndex + 1));
    if (isNaN(cost) || cost < 0) cost = 0;
    
    if (Eco.get(pl) < cost) { sendMsg(pl, "back.nomoney", { cost: cost }); return; }
    if (!Eco.reduce(pl, cost)) { sendMsg(pl, "error.deduct"); return; }
    
    Util.addCount("backCounts", pl.xuid);
    let r = records[recordIndex];
    pl.teleport(r.x, r.y, r.z, r.dimid);
    sendMsg(pl, "back.success", { cost: cost });
    csvLog("Back", pl.realName, "Went back to death point");
}

function registerWarpCommands() {
    let cmdWarpSet = mc.newCommand("warpset", "管理地标 / Manage Warps", PermType.GameMasters);
    cmdWarpSet.overload([]);
    cmdWarpSet.setCallback((cmd, origin) => {
        if (origin.player && !origin.player.isSimulatedPlayer()) sendWarpSetMenu(origin.player);
    });
    cmdWarpSet.setup();

    let cmdWarp = mc.newCommand("warp", "地标传送 / Warp Teleport", PermType.Any);
    cmdWarp.setEnum("WarpAction", ["go"]);
    cmdWarp.optional("action", ParamType.Enum, "WarpAction", "WarpAction", 1);
    cmdWarp.optional("name", ParamType.String);
    cmdWarp.overload([]);
    cmdWarp.overload(["action"]);
    cmdWarp.overload(["action", "name"]);
    cmdWarp.setCallback((cmd, origin, out, results) => {
        if (origin.player && !origin.player.isSimulatedPlayer()) {
            if (results.action === "go" && results.name) {
                processWarpGo(origin.player, results.name);
            } else {
                sendWarpForm(origin.player);
            }
        }
    });
    cmdWarp.setup();
}

function getWarpsObj() { let content = warpDb.read(); return content ? JSON.parse(content) : {}; }

function processWarpGo(player, name) {
    let warps = getWarpsObj();
    if (!warps[name]) { sendMsg(player, "warp.not_found", { name: name }); return; }
    
    let w = warps[name];
    let cost = Math.floor(Formulas.warpCost(Util.getCount("warpCounts", player.xuid)));
    if (isNaN(cost) || cost < 0) cost = 0;
    
    if (Eco.get(player) < cost) { sendMsg(player, "warp.nomoney", { cost: cost }); return; }
    if (!Eco.reduce(player, cost)) { sendMsg(player, "error.deduct"); return; }
    
    Util.addCount("warpCounts", player.xuid);
    player.teleport(w.x, w.y, w.z, w.dimid);
    sendMsg(player, "warp.success", { name: name, cost: cost });
    csvLog("Warp", player.realName, "Warped to " + name);
}

function sendWarpSetMenu(player) {
    let fm = mc.newSimpleForm().setTitle(tr(player, "warp.manage.title")).setContent(tr(player, "warp.manage.content"))
        .addButton(tr(player, "warp.manage.add_current"))
        .addButton(tr(player, "warp.manage.add_custom"))
        .addButton(tr(player, "warp.manage.edit"))
        .addButton(tr(player, "warp.manage.delete"));
    player.sendForm(fm, (pl, id) => {
        if (id == null) return; 
        switch (id) {
            case 0: addWarpForm(pl, true); break;
            case 1: addWarpForm(pl, false); break;
            case 2: editWarpSelectForm(pl); break;
            case 3: deleteWarpSelectForm(pl); break;
        }
    });
}

function addWarpForm(player, isCurrent) {
    let fm = mc.newCustomForm().setTitle(tr(player, "warp.add.title"));
    fm.addInput(tr(player, "warp.add.name"), "", "");
    if (!isCurrent) {
        fm.addInput("X", "", "0").addInput("Y", "", "100").addInput("Z", "", "0");
        fm.addDropdown(tr(player, "warp.add.dim"), ["主世界", "下界", "末地"], 0);
    }
    fm.addInput(tr(player, "warp.add.icon"), "textures/... (留空为无)", "");

    player.sendForm(fm, (pl, data) => {
        if (data == null) return; 
        let name = data[0];
        if (name === "") return;
        let warps = getWarpsObj();
        if (warps[name]) { sendMsg(pl, "warp.add.exist"); return; }

        let newWarp = {};
        if (isCurrent) {
            let pos = pl.pos;
            newWarp = { x: pos.x, y: pos.y, z: pos.z, dimid: pos.dimid, icon: data[1] };
        } else {
            let x = parseFloat(data[1]), y = parseFloat(data[2]), z = parseFloat(data[3]);
            if (isNaN(x) || isNaN(y) || isNaN(z)) { sendMsg(pl, "warp.invalid"); return; }
            newWarp = { x: x, y: y, z: z, dimid: data[4], icon: data[5] };
        }
        warpDb.set(name, newWarp);
        sendMsg(pl, "warp.add.success", { name: name });
        csvLog("Warp", pl.realName, "Added warp " + name);
    });
}

function deleteWarpSelectForm(player) {
    let warps = getWarpsObj(), names = Object.keys(warps);
    if (names.length === 0) { sendMsg(player, "warp.none"); return; }
    
    let fm = mc.newSimpleForm().setTitle(tr(player, "warp.del.title")).setContent(tr(player, "warp.del.content"));
    names.forEach(n => fm.addButton(n));
    player.sendForm(fm, (pl, id) => {
        if (id != null) { 
            warpDb.delete(names[id]); 
            sendMsg(pl, "warp.del.success", { name: names[id] }); 
            csvLog("Warp", pl.realName, "Deleted warp " + names[id]);
        }
    });
}

function editWarpSelectForm(player) {
    let warps = getWarpsObj(), names = Object.keys(warps);
    if (names.length === 0) { sendMsg(player, "warp.none"); return; }
    
    let fm = mc.newSimpleForm().setTitle(tr(player, "warp.edit.title")).setContent(tr(player, "warp.manage.content"));
    names.forEach(n => fm.addButton(n));

    player.sendForm(fm, (pl, id) => {
        if (id == null) return; 
        let tName = names[id], wData = warps[tName];
        let cfm = mc.newCustomForm().setTitle(tr(player, "warp.edit.title"))
            .addInput(tr(player, "warp.add.name"), "", tName)
            .addInput("X", "", wData.x.toString()).addInput("Y", "", wData.y.toString()).addInput("Z", "", wData.z.toString())
            .addDropdown(tr(player, "warp.add.dim"), ["主世界", "下界", "末地"], wData.dimid)
            .addInput(tr(player, "warp.add.icon"), "textures/... (留空为无)", wData.icon || "");

        pl.sendForm(cfm, (pl2, data) => {
            if (data == null) return; 
            let newName = data[0], x = parseFloat(data[1]), y = parseFloat(data[2]), z = parseFloat(data[3]);
            if (newName === "" || isNaN(x) || isNaN(y) || isNaN(z)) { sendMsg(pl2, "warp.invalid"); return; }
            if (newName !== tName) warpDb.delete(tName);
            warpDb.set(newName, { x: x, y: y, z: z, dimid: data[4], icon: data[5] });
            sendMsg(pl2, "warp.edit.success", { name: newName });
            csvLog("Warp", pl2.realName, "Edited warp " + newName);
        });
    });
}

function sendWarpForm(player) {
    let warps = getWarpsObj(), names = Object.keys(warps);
    if (names.length === 0) { sendMsg(player, "warp.none"); return; }
    
    let fm = mc.newSimpleForm().setTitle(tr(player, "warp.title"));
    names.forEach(n => { let i = warps[n].icon; (i && i !== "") ? fm.addButton(n, i) : fm.addButton(n); });
    
    player.sendForm(fm, (pl, id) => {
        if (id == null) return; 
        processWarpGo(pl, names[id]);
    });
}

function registerTpaCommands() {
    let cmdTpa = mc.newCommand("tpa", "打开 TPA 传送菜单", PermType.Any);
    cmdTpa.overload([]);
    cmdTpa.setCallback((cmd, origin) => {
        if (!origin.player || origin.player.isSimulatedPlayer()) return;
        if (!Util.acceptsTpa(origin.player.xuid)) { sendMsg(origin.player, "tpa.disabled"); return; }
        if (Util.hasPendingRequest(origin.player.xuid)) { sendMsg(origin.player, "tpa.pending"); return; }
        sendTpaForm(origin.player);
    });
    cmdTpa.setup();

    let cmdTpaCancel = mc.newCommand("tpacancel", "取消已发送的 TPA 请求", PermType.Any);
    cmdTpaCancel.overload([]);
    cmdTpaCancel.setCallback((cmd, origin) => {
        if (!origin.player || origin.player.isSimulatedPlayer()) return;
        let pl = origin.player, canceled = 0, refundTotal = 0;
        let rate = config.get("tpa").refundRate;
        for (let targetXuid in tpaQueue) {
            let queue = tpaQueue[targetXuid];
            for (let i = queue.length - 1; i >= 0; i--) {
                if (queue[i].senderXuid === pl.xuid) {
                    let req = queue.splice(i, 1)[0];
                    canceled++; 
                    refundTotal += Math.floor(req.cost * rate);
                }
            }
        }
        if (canceled > 0) {
            if (refundTotal > 0) Eco.add(pl, refundTotal);
            let counts = dataDb.init("tpaCounts", {});
            let today = Util.getTodayStr();
            if (counts[pl.xuid] && counts[pl.xuid].date === today && counts[pl.xuid].count > 0) {
                counts[pl.xuid].count -= canceled; dataDb.set("tpaCounts", counts);
            }
            sendMsg(pl, "tpa.canceled", { count: canceled, refund: refundTotal });
            csvLog("TPA", pl.realName, `Canceled ${canceled} requests, refunded ${refundTotal}`);
        } else {
            sendMsg(pl, "tpa.cancel.none");
        }
    });
    cmdTpaCancel.setup();

    let cmdAc = mc.newCommand("ac", "同意 TPA 请求", PermType.Any);
    cmdAc.optional("target", ParamType.String);
    cmdAc.overload(["target"]);
    cmdAc.overload([]);
    cmdAc.setCallback((cmd, origin, out, results) => {
        if (origin.player && !origin.player.isSimulatedPlayer()) processTpaRequest(origin.player, true, results.target);
    });
    cmdAc.setup();

    let cmdDe = mc.newCommand("de", "拒绝 TPA 请求", PermType.Any);
    cmdDe.optional("target", ParamType.String);
    cmdDe.overload(["target"]);
    cmdDe.overload([]);
    cmdDe.setCallback((cmd, origin, out, results) => {
        if (origin.player && !origin.player.isSimulatedPlayer()) processTpaRequest(origin.player, false, results.target);
    });
    cmdDe.setup();

    let cmdTpaSet = mc.newCommand("tpaset", "开启/关闭 TPA", PermType.Any);
    cmdTpaSet.overload([]);
    cmdTpaSet.setCallback((cmd, origin) => {
        if (!origin.player || origin.player.isSimulatedPlayer()) return;
        let xuid = origin.player.xuid, settings = dataDb.init("tpaSettings", {}), current = Util.acceptsTpa(xuid);
        settings[xuid] = !current;
        dataDb.set("tpaSettings", settings);
        sendMsg(origin.player, !current ? "tpa.set.on" : "tpa.set.off");
    });
    cmdTpaSet.setup();
}

function sendTpaForm(player) {
    let onlinePlayers = mc.getOnlinePlayers().filter(p => p.xuid !== player.xuid);
    if (onlinePlayers.length === 0) { sendMsg(player, "tpa.no_players"); return; }

    let pList = onlinePlayers.map(p => ({ xuid: p.xuid, name: p.realName }));
    let fm = mc.newCustomForm()
        .setTitle(tr(player, "tpa.form.title"))
        .addLabel(tr(player, "tpa.form.desc"))  
        .addDropdown(tr(player, "tpa.form.target"), pList.map(i => i.name), 0) 
        .addDropdown(tr(player, "tpa.form.type"), [tr(player, "tpa.form.type.tpa"), tr(player, "tpa.form.type.tpahere")], 0);

    player.sendForm(fm, (pl, data) => {
        if (data == null) return;
        let targetInfo = pList[data[1]], type = data[2], targetPlayer = mc.getPlayer(targetInfo.xuid);

        if (!targetPlayer) { sendMsg(pl, "tpa.target_offline"); return; }
        if (!Util.acceptsTpa(targetPlayer.xuid)) { sendMsg(pl, "tpa.target_disabled", { name: targetPlayer.realName }); return; }

        let cond = config.get("tpa").conditions;
        if (cond.enableLimits) {
            let targetBal = cond.sbName ? Eco.getSpecific(targetPlayer, cond.sbName) : Eco.get(targetPlayer);
            let senderBal = cond.sbName ? Eco.getSpecific(pl, cond.sbName) : Eco.get(pl);
            if (targetBal < cond.targetMinMoney) { sendMsg(pl, "tpa.limit.target"); return; }
            if (senderBal < cond.senderMinMoney) { sendMsg(pl, "tpa.limit.sender"); return; }
        }

        let cost = Math.floor(Formulas.tpaCost(Util.getCount("tpaCounts", pl.xuid)));
        if (isNaN(cost) || cost < 0) cost = 0;

        if (Eco.get(pl) < cost) { sendMsg(pl, "tpa.fee.insufficient", { cost: cost }); return; }
        sendTpaConfirmForm(pl, targetInfo.xuid, targetInfo.name, type, cost);
    });
}

function sendTpaConfirmForm(sender, targetXuid, targetName, type, cost) {
    let typeStr = tr(sender, type === 0 ? "tpa.type.to_target" : "tpa.type.to_me", { name: targetName });
    let fm = mc.newSimpleForm()
        .setTitle(tr(sender, "tpa.confirm.title"))
        .setContent(tr(sender, "tpa.confirm.desc", { type: typeStr, cost: cost }))
        .addButton(tr(sender, "tpa.confirm.btn.yes"))
        .addButton(tr(sender, "tpa.confirm.btn.no"));

    sender.sendForm(fm, (pl, id) => {
        if (id == null || id === 1) return;
        let targetPlayer = mc.getPlayer(targetXuid);
        if (!targetPlayer) { sendMsg(pl, "tpa.target_offline"); return; }
        if (!Eco.reduce(pl, cost)) { sendMsg(pl, "error.deduct"); return; }
        Util.addCount("tpaCounts", pl.xuid);

        let req = {
            id: system.randomGuid(),
            senderXuid: pl.xuid, senderName: pl.realName, targetXuid: targetXuid, targetName: targetPlayer.realName,
            type: type, cost: cost, expireTick: currentTick + (config.get("tpa").timeoutSeconds * 20)
        };

        if (!tpaQueue[targetXuid]) tpaQueue[targetXuid] = [];
        tpaQueue[targetXuid].push(req);
        sendMsg(pl, "tpa.sent", { cost: cost });
        csvLog("TPA", pl.realName, `Sent TPA request to ${targetName}`);
        
        targetPlayer.tell(
            tr(targetPlayer, "tpa.receive.title") +
            tr(targetPlayer, "tpa.receive.msg1", { name: pl.realName, type: tr(targetPlayer, type === 0 ? "tpa.receive.type.tpa" : "tpa.receive.type.tpahere") }) + "\n" +
            tr(targetPlayer, "tpa.receive.msg2") +
            tr(targetPlayer, "tpa.receive.footer")
        );
    });
}

function processTpaRequest(targetPlayer, isAccept, specificTargetName) {
    let queue = tpaQueue[targetPlayer.xuid];
    if (!queue || queue.length === 0) { sendMsg(targetPlayer, "tpa.no_pending"); return; }

    let reqIndex = specificTargetName ? queue.findIndex(r => r.senderName.toLowerCase() === specificTargetName.toLowerCase()) : 0;
    if (reqIndex === -1) { sendMsg(targetPlayer, "tpa.not_found", { name: specificTargetName }); return; }

    let req = queue.splice(reqIndex, 1)[0], senderPlayer = mc.getPlayer(req.senderXuid);

    if (!isAccept) {
        sendMsg(targetPlayer, "tpa.rejected.target", { name: req.senderName });
        if (senderPlayer) sendMsg(senderPlayer, "tpa.rejected.sender", { name: targetPlayer.realName });
        return;
    }

    if (!senderPlayer) { sendMsg(targetPlayer, "tpa.target_offline"); return; }
    sendMsg(targetPlayer, "tpa.accepted.target", { name: req.senderName });
    sendMsg(senderPlayer, "tpa.accepted.sender", { name: targetPlayer.realName });

    req.type === 0 ? senderPlayer.teleport(targetPlayer.pos.x, targetPlayer.pos.y, targetPlayer.pos.z, targetPlayer.pos.dimid) : targetPlayer.teleport(senderPlayer.pos.x, senderPlayer.pos.y, senderPlayer.pos.z, senderPlayer.pos.dimid);
    csvLog("TPA", targetPlayer.realName, `Accepted TPA from ${req.senderName}`);
}

function sendNoticeForm(player, content, noticeHash, isManual = false) {
    let fm = mc.newSimpleForm().setTitle(tr(player, "notice.title")).setContent(content);
    fm.addButton(tr(player, "notice.btn.ok"));
    if (!isManual) fm.addButton(tr(player, "notice.btn.never"));

    player.sendForm(fm, (pl, id) => {
        if (!isManual && id === 1) {
            let reads = dataDb.init("noticeReads", {});
            reads[pl.xuid] = noticeHash;
            dataDb.set("noticeReads", reads);
            sendMsg(pl, "notice.set_never");
        }
    });
}

function registerNoticeCommand() {
    let cmdNotice = mc.newCommand("notice", "查看服务器公告", PermType.Any);
    cmdNotice.overload([]);
    cmdNotice.setCallback((cmd, origin) => {
        if (origin.player && !origin.player.isSimulatedPlayer()) {
            let currentNotice = config.get("notice").content;
            let noticeHash = data.toMD5(currentNotice);
            sendNoticeForm(origin.player, currentNotice, noticeHash, true);
        }
    });
    cmdNotice.setup();
}

let motdTaskId = null;
let motdIndex = 0;
function startDynamicMotd() {
    let cfg = config.get("motd");
    if (!cfg.enabled || !cfg.list || cfg.list.length === 0) return;
    
    motdTaskId = setInterval(() => {
        let text = cfg.list[motdIndex];
        let onlineCount = mc.getOnlinePlayers().length;
        text = text.replace(/{online}/g, onlineCount.toString()).replace(/{tps}/g, getAvgTps(1));
        mc.setMotd(text);
        motdIndex = (motdIndex + 1) % cfg.list.length;
    }, Math.max(1000, cfg.intervalSeconds * 1000));
}

function registerMoneyCommands() {
    let cmdMoney = mc.newCommand("moneysystem", "打开经济系统菜单", PermType.Any);
    cmdMoney.overload([]);
    cmdMoney.setCallback((cmd, origin) => {
        if (origin.player && !origin.player.isSimulatedPlayer()) sendMoneyMainForm(origin.player);
    });
    cmdMoney.setup();
}

function sendMoneyMainForm(player) {
    let fm = mc.newSimpleForm().setTitle(tr(player, "eco.main.title")).setContent(tr(player, "eco.main.desc", { balance: Eco.get(player) }))
        .addButton(tr(player, "eco.main.btn.transfer")).addButton(tr(player, "eco.main.btn.close"));
    player.sendForm(fm, (pl, id) => { if (id === 0) sendTransferForm(pl); });
}

function sendTransferForm(player) {
    let onlinePlayers = mc.getOnlinePlayers().filter(p => p.xuid !== player.xuid);
    if (onlinePlayers.length === 0) { sendMsg(player, "eco.transfer.no_players"); return; }

    let pList = onlinePlayers.map(p => ({ xuid: p.xuid, name: p.realName })), taxRate = config.get("economy").transferTaxRate;
    let fm = mc.newCustomForm().setTitle(tr(player, "eco.transfer.title")).addLabel(tr(player, "eco.transfer.desc", { tax: (taxRate * 100).toFixed(1) }))
        .addDropdown(tr(player, "eco.transfer.target"), pList.map(i => i.name), 0).addInput(tr(player, "eco.transfer.amount"), "输入金额", "100");

    player.sendForm(fm, (pl, data) => {
        if (data == null) return;
        let targetPlayer = mc.getPlayer(pList[data[1]].xuid);
        if (!targetPlayer) { sendMsg(pl, "tpa.target_offline"); return; }

        let amount = parseInt(data[2]);
        if (isNaN(amount) || amount <= 0) { sendMsg(pl, "eco.transfer.invalid"); return; }

        let tax = Math.floor(amount * taxRate), totalCost = amount + tax;
        if (Eco.get(pl) < totalCost) { sendMsg(pl, "eco.transfer.insufficient", { cost: totalCost, amount: amount, tax: tax }); return; }

        if (Eco.reduce(pl, totalCost)) {
            if (Eco.add(targetPlayer, amount)) {
                sendMsg(pl, "eco.transfer.success.sender", { name: targetPlayer.realName, amount: amount, tax: tax });
                sendMsg(targetPlayer, "eco.transfer.success.target", { name: pl.realName, amount: amount });
                csvLog("Transfer", pl.realName, `Sent ${amount} to ${targetPlayer.realName} with tax ${tax}`);
            } else {
                Eco.add(pl, totalCost);
                sendMsg(pl, "eco.transfer.rollback");
            }
        } else sendMsg(pl, "eco.transfer.fail");
    });
}

function registerLangCommands() {
    let cmdLang = mc.newCommand("languagesue", "切换语言 / Switch Language", PermType.Any);
    cmdLang.overload([]);
    cmdLang.setCallback((cmd, origin) => {
        if (!origin.player || origin.player.isSimulatedPlayer()) return;
        let files = File.getFilesList(LANG_PATH) || [], langs = files.map(f => f.replace(".json", ""));
        if (!langs.includes("zh_CN")) langs.push("zh_CN");
        langs = [...new Set(langs)];
        
        let fm = mc.newSimpleForm().setTitle(tr(origin.player, "lang.title")).setContent(tr(origin.player, "lang.desc"));
        langs.forEach(l => fm.addButton(l));
        
        origin.player.sendForm(fm, (pl, id) => {
            if (id == null) return;
            let pLangs = dataDb.init("playerLangs", {});
            pLangs[pl.xuid] = langs[id];
            dataDb.set("playerLangs", pLangs);
            sendMsg(pl, "lang.switched", { lang: langs[id] });
        });
    });
    cmdLang.setup();
}


function setupDynamicCmd(cmdName, cmdData) {
    let dynCmd = mc.newCommand(cmdName, cmdData.desc || "自定义映射命令", PermType.Any);
    if (cmdData.alias && cmdData.alias !== "") {
        dynCmd.setAlias(cmdData.alias);
    }
    
    if (cmdData.hasArgs) {
        dynCmd.optional("args", ParamType.RawText);
        dynCmd.overload(["args"]);
    }
    dynCmd.overload([]);

    dynCmd.setCallback((cmd, origin, out, results) => {
        if (!origin.player || origin.player.isSimulatedPlayer()) return;
        
        let liveCmds = cusCmdDb.get("list") || {};
        if (!liveCmds[cmdName]) {
            out.error("此自定义命令已被管理员删除，将在下一次服务器重启后完全清除。");
            return;
        }

        let liveData = liveCmds[cmdName];
        let finalCmd = liveData.targetCmd.replace(/%name%/g, '"' + origin.player.realName + '"');
        
        if (liveData.hasArgs && results.args) {
            finalCmd += " " + results.args;
        }

        if (liveData.runAsConsole) {
            mc.runcmd(finalCmd);
        } else {
            origin.player.runcmd(finalCmd);
        }
    });
    dynCmd.setup();
}

function registerCusCmdSys() {
    let cmds = cusCmdDb.get("list") || {};
    for (let cmdName in cmds) {
        try {
            setupDynamicCmd(cmdName, cmds[cmdName]);
        } catch (e) {
            logger.warn(`动态映射命令 /${cmdName} 注册失败，该命令可能已被占用。`);
        }
    }

    let manageCmd = mc.newCommand("customcommand", "自定义命令管理后台", PermType.GameMasters);
    manageCmd.setAlias("cuscmd");
    manageCmd.overload([]);
    manageCmd.setCallback((cmd, origin) => {
        if (!origin.player || origin.player.isSimulatedPlayer()) return;
        sendCusCmdManageForm(origin.player);
    });
    manageCmd.setup();
}

function sendCusCmdManageForm(player) {
    let fm = mc.newSimpleForm()
        .setTitle("自定义命令管理")
        .setContent("利用此功能，可桥接任意插件或原版指令系统：")
        .addButton("创建自定义命令")
        .addButton("删除自定义命令");

    player.sendForm(fm, (pl, id) => {
        if (id === 0) sendCusCmdCreateForm(pl);
        else if (id === 1) {
            let isSuper = config.get("customCommands").superAdmins.includes(pl.xuid);
            if (!isSuper) {
                pl.tell(PREFIX + "§c权限不足：必须为配置表中的超级管理员才可删除自定义命令！");
                return;
            }
            sendCusCmdDeleteForm(pl);
        }
    });
}

function sendCusCmdCreateForm(player) {
    let fm = mc.newCustomForm()
        .setTitle("创建自定义命令")
        .addInput("主命令名称 (纯小写字母/字母+数字，禁止纯数字或特殊符号)", "如: test")
        .addInput("命令简介/描述", "出现在玩家输入时的补全提示中", "自定义映射命令")
        .addInput("辅助别名 (可选，纯小写字母/数字，禁止纯数字或特殊符号)", "留空则不设置别名")
        .addInput("映射的目标命令 (支持变量 %name%)", "如: warp go 主城")
        .addDropdown("指令执行者身份", ["玩家身份执行", "以控制台权限执行"], 0)
        .addSwitch("接收后续不确定参数并自动追加？\n(若开启，/命令 [参数] 均会向后拼接)", false);

    player.sendForm(fm, (pl, data) => {
        if (data == null) return;
        let cmdName = data[0].trim();
        let desc = data[1].trim(); 
        let alias = data[2].trim();
        let targetCmd = data[3].trim();
        let runAsConsole = (data[4] === 1);
        let hasArgs = data[5];

        if (!/^[a-z0-9]+$/.test(cmdName)) {
            pl.tell(PREFIX + "§c注册失败：命令名称非法！必须仅包含小写英文字母与数字。");
            return;
        }
        if (/^\d+$/.test(cmdName)) {
            pl.tell(PREFIX + "§c注册失败：命令名称不能为纯数字！请包含至少一个英文字母。");
            return;
        }
        if (alias !== "" && !/^[a-z0-9]+$/.test(alias)) {
            pl.tell(PREFIX + "§c注册失败：别名非法！必须仅包含小写英文字母与数字。");
            return;
        }
        if (alias !== "" && /^\d+$/.test(alias)) {
            pl.tell(PREFIX + "§c注册失败：命令别名不能为纯数字！");
            return;
        }
        if (targetCmd === "") {
            pl.tell(PREFIX + "§c注册失败：目标映射命令不能为空！");
            return;
        }

        let isSuper = config.get("customCommands").superAdmins.includes(pl.xuid);
        if (runAsConsole && !isSuper) {
            pl.tell(PREFIX + "§c注册失败：高危权限拦截！您并非指定的超级管理员，无法创建“控制台”级别的映射指令。");
            return;
        }

        let cmds = cusCmdDb.get("list") || {};
        if (cmds[cmdName]) {
            pl.tell(PREFIX + "§c注册失败：该自定义命令映射已经存在！");
            return;
        }

        let cmdData = {
            alias: alias,
            desc: desc,
            targetCmd: targetCmd,
            runAsConsole: runAsConsole,
            hasArgs: hasArgs
        };

        cmds[cmdName] = cmdData;
        cusCmdDb.set("list", cmds);

        try {
            setupDynamicCmd(cmdName, cmdData);
            pl.tell(PREFIX + "§a高级指令桥接映射 /" + cmdName + " 创建成功并已上线！");
            csvLog("CustomCommand", pl.realName, "Created CMD map " + cmdName);
        } catch (e) {
            pl.tell(PREFIX + "§c指令上线失败：该命令标识符已被原版系统或其他插件锁定占用。");
        }
    });
}

function sendCusCmdDeleteForm(player) {
    let cmds = cusCmdDb.get("list") || {};
    let names = Object.keys(cmds);
    if (names.length === 0) {
        player.tell(PREFIX + "§c当前运行环境中没有任何可用的自定义命令。");
        return;
    }

    let fm = mc.newSimpleForm()
        .setTitle("删除自定义命令")
        .setContent("请选择需要注销的指令项：\n(警告：删除后即刻失效，但客户端提示需在服务器重启后方可完全清除)");

    names.forEach(n => fm.addButton("/" + n));

    player.sendForm(fm, (pl, id) => {
        if (id == null) return;
        let delName = names[id];
        
        let freshCmds = cusCmdDb.get("list") || {};
        if (freshCmds[delName]) {
            delete freshCmds[delName];
            cusCmdDb.set("list", freshCmds);
            pl.tell(PREFIX + "§a指令映射 /" + delName + " 已被强制吊销。");
            csvLog("CustomCommand", pl.realName, "Revoked CMD map " + delName);
        }
    });
}

function registerPlayerManageCommands() {
    let cmdPM = mc.newCommand("playermanage", "Player Management System", PermType.GameMasters);
    cmdPM.setEnum("PMAction", ["look", "talkas", "cmdas", "money", "status", "crash"]);
    cmdPM.optional("target", ParamType.Player);
    cmdPM.optional("action", ParamType.Enum, "PMAction", "PMAction", 1);
    cmdPM.optional("content", ParamType.RawText);
    cmdPM.overload([]);
    cmdPM.overload(["target"]);
    cmdPM.overload(["target", "action"]);
    cmdPM.overload(["target", "action", "content"]);
    
    cmdPM.setCallback((cmd, origin, out, results) => {
        if (!origin.player) return;
        let admin = origin.player;

        if (!results.target) {
            sendPMMainMenu(admin);
            return;
        }
        if (results.target.length === 0) {
            admin.tell("§c找不到目标玩家！");
            return;
        }
        let targetPlayer = results.target[0];

        if (!results.action) {
            sendPMTargetMenu(admin, targetPlayer);
            return;
        }

        let action = results.action.toLowerCase();
        let content = results.content || "";

        switch(action) {
            case "look":
                admin.setGameMode(6);
                admin.teleport(targetPlayer.pos.x, targetPlayer.pos.y, targetPlayer.pos.z, targetPlayer.pos.dimid);
                admin.tell("§a已进入旁观模式并传送到 " + targetPlayer.realName);
                break;
            case "talkas":
                if(content !== "") targetPlayer.talkAs(content);
                break;
            case "cmdas":
                if(content !== "") targetPlayer.runcmd(content.startsWith("/") ? content.substring(1) : content);
                break;
            case "money":
                let amt = parseInt(content);
                if(!isNaN(amt)) {
                    if(amt > 0) Eco.add(targetPlayer, amt);
                    else if(amt < 0) Eco.reduce(targetPlayer, -amt);
                    admin.tell("§a已调整玩家资金: " + amt);
                }
                break;
            case "status":
                sendPMStatusMenu(admin, targetPlayer);
                break;
            case "crash":
                targetPlayer.crash();
                admin.tell("§a已向客户端发送崩溃指令。");
                break;
            default:
                admin.tell("§c未知操作。");
                break;
        }
    });
    cmdPM.setup();
}

function sendPMMainMenu(admin) {
    let players = mc.getOnlinePlayers();
    if(players.length === 0) { admin.tell("§c当前无在线玩家"); return; }
    let fm = mc.newSimpleForm().setTitle("PlayerManage").setContent("请选择一个在线玩家进行操作：");
    players.forEach(p => fm.addButton(p.realName));
    admin.sendForm(fm, (pl, id) => {
        if(id != null) sendPMTargetMenu(pl, players[id]);
    });
}

function sendPMTargetMenu(admin, targetPlayer) {
    if(!targetPlayer || targetPlayer.isSimulatedPlayer()) {
        admin.tell("§c目标玩家已离线或无效"); return;
    }
    let fm = mc.newSimpleForm().setTitle("管理: " + targetPlayer.realName).setContent("请选择你要对该玩家进行的操作：")
        .addButton("视奸 (Spectate)")
        .addButton("替身发言 (Talk As)")
        .addButton("替身执行命令 (Command As)")
        .addButton("资金管理 (Money)")
        .addButton("查看状态信息 (Status)")
        .addButton("反作弊-加入黑名单 (Ban)")
        .addButton("反作弊-崩溃客户端 (Crash)")
        .addButton("反作弊-踢出玩家 (Kick)");
        
    admin.sendForm(fm, (pl, id) => {
        if(id == null) return;
        switch(id) {
            case 0:
                pl.setGameMode(6);
                pl.teleport(targetPlayer.pos.x, targetPlayer.pos.y, targetPlayer.pos.z, targetPlayer.pos.dimid);
                pl.tell("§a已进入旁观模式并传送到 " + targetPlayer.realName);
                break;
            case 1:
                let fm1 = mc.newCustomForm().setTitle("替身发言").addInput("输入发言内容", "");
                pl.sendForm(fm1, (pl2, data) => {
                    if(data && data[0] !== "") targetPlayer.talkAs(data[0]);
                });
                break;
            case 2:
                let fm2 = mc.newCustomForm().setTitle("替身执行命令").addInput("输入需代为执行的命令 (不带/)", "");
                pl.sendForm(fm2, (pl2, data) => {
                    if(data && data[0] !== "") targetPlayer.runcmd(data[0].startsWith("/") ? data[0].substring(1) : data[0]);
                });
                break;
            case 3:
                let fm3 = mc.newCustomForm().setTitle("资金管理").addInput("输入增加或减少的金币数值 (负数为减少)", "0");
                pl.sendForm(fm3, (pl2, data) => {
                    if(data) {
                        let amt = parseInt(data[0]);
                        if(!isNaN(amt) && amt !== 0) {
                            if(amt > 0) Eco.add(targetPlayer, amt);
                            else Eco.reduce(targetPlayer, -amt);
                            pl2.tell("§a资金操作已生效。");
                        }
                    }
                });
                break;
            case 4:
                sendPMStatusMenu(pl, targetPlayer);
                break;
            case 5:
                sendBanFormForTarget(pl, targetPlayer);
                break;
            case 6:
                targetPlayer.crash();
                pl.tell("§a已发送客户端崩溃指令。");
                break;
            case 7:
                let fm7 = mc.newCustomForm().setTitle("踢出玩家").addInput("踢出理由 (可选)", "", "违规");
                pl.sendForm(fm7, (pl2, data) => {
                    if(data) targetPlayer.kick(data[0] || "被管理员踢出服务器");
                });
                break;
        }
    });
}

function sendBanFormForTarget(admin, targetPlayer) {
    let fm = mc.newCustomForm().setTitle("加入黑名单")
        .addLabel("目标: " + targetPlayer.realName + " (" + targetPlayer.xuid + ")")
        .addInput("封禁时长 (天), 留空为永久", "留空为永久")
        .addInput("封禁理由", "...", tr(admin, "ban.reason.default"));
    admin.sendForm(fm, (pl, data) => {
        if(!data) return;
        let days = parseFloat(data[1]);
        if(isNaN(days) || days <= 0) days = null;
        let reason = data[2] || tr(pl, "ban.reason.default");
        processBan(pl, targetPlayer.realName, targetPlayer, days, reason);
    });
}

function sendPMStatusMenu(admin, targetPlayer) {
    let dv = targetPlayer.getDevice();
    let ip = dv ? dv.ip : targetPlayer.ip;
    let cid = dv ? dv.clientId : "未知";
    let os = dv ? dv.os : "未知";
    
    let onlineTime = "Null";
    if(config.get("playerDatabase") && config.get("playerDatabase").enabled) {
        let pData = pdbDb.get(targetPlayer.xuid);
        if(pData) onlineTime = (pData.OnlineTime || 0).toFixed(2) + " 分钟";
    }

    let info = `名称: ${targetPlayer.realName}\n`;
    info += `XUID: ${targetPlayer.xuid}\n`;
    info += `UUID: ${targetPlayer.uuid}\n`;
    info += `IP: ${ip}\n`;
    info += `ClientID: ${cid}\n`;
    info += `OS: ${os}\n`;
    info += `在线时长: ${onlineTime}\n\n`;
    info += `--- 背包物品 ---`;

    let fm = mc.newSimpleForm().setTitle("玩家信息: " + targetPlayer.realName).setContent(info);
    
    let inv = targetPlayer.getInventory();
    if(inv) {
        let items = inv.getAllItems();
        for(let i = 0; i < items.length; i++) {
            let it = items[i];
            if(!it.isNull()) {
                fm.addButton(`${it.name}\n数量: ${it.count} | 格子编号: ${i}`);
            }
        }
    }
    
    admin.sendForm(fm, (pl, id) => {});
}

function registerPlayerDatabaseCommand() {
    let cmd = mc.newCommand("playerdatabase", "Player Database System", PermType.GameMasters);
    cmd.setEnum("PDBAction", ["refresh"]);
    cmd.optional("action", ParamType.Enum, "PDBAction", "PDBAction", 1);
    cmd.overload([]);
    cmd.overload(["action"]);
    cmd.setCallback((cmd, origin, out, results) => {
        if(!origin.player) return;
        if(results.action === "refresh") {
            let regData = JSON.parse(regDb.read() || '{"total":0,"records":{}}');
            let count = Object.keys(regData.records || {}).length;
            regData.total = count;
            regDb.write(JSON.stringify(regData, null, 4));
            origin.player.tell("§a已重新计算并更新数据库中实际的总注册玩家数: " + count);
        } else {
            sendPDBMenu(origin.player);
        }
    });
    cmd.setup();
}

function sendPDBMenu(admin) {
    let regData = JSON.parse(regDb.read() || '{"total":0,"records":{}}');
    let total = regData.total || 0;
    
    let fm = mc.newSimpleForm().setTitle("玩家数据库信息").setContent(`历史总注册玩家数: ${total}\n\n7日内新注册玩家名单:`);
    
    let now = Date.now();
    let sevendays = 7 * 86400000;
    
    let count7 = 0;
    for(let xuid in regData.records) {
        let rec = regData.records[xuid];
        if(now - rec.ts <= sevendays) {
            count7++;
            let pData = pdbDb.get(xuid);
            let timePlay = pData ? (pData.OnlineTime || 0).toFixed(2) : "0.00";
            fm.addButton(`[${rec.name}]\n注册: ${rec.date} ${rec.time} | 游玩: ${timePlay}分钟`);
        }
    }
    
    if(count7 === 0) {
        fm.setContent(`历史总注册玩家数: ${total}\n\n近7日内无任何新注册玩家记录。`);
    }
    
    admin.sendForm(fm, (pl, id) => {});
}

logger.setTitle("UEssential");
logger.info("UEssential " + VERSION.join(".") + " 加载成功！作者：wuw111，使用Gemini系列模型辅助开发。BUG反馈请加入反馈群：1097933637。本插件为免费插件，如果您是花钱购买的，请立刻投诉商家并且要求退款。");