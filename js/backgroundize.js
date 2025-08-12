/**
 * author: 4rozeN
 * file: backgroundize.js
 * last modified: 2025-05-19
 * description: 背景图随日夜模式切换处理。
 */

/**
 * 获取颜色模式切换按钮（深色 / 浅色）。
 * @type {HTMLElement | null}
 */
const colorToggleButton = document.querySelector("#color-toggle-btn .nav-link");

/**
 * 背景容器元素（统一为 #web_bg）。
 * @type {HTMLElement}
 */
const backgroundContainer = document.querySelector("#web_bg");

// === 背景图片配置 ===
/**
 * BACKGROUND_IMAGES 说明：
 * - dark / light：按颜色模式分类；再区分 desktop / mobile 两张图。
 * - fallback：在排除页面、或桌面 / 移动切换时的默认背景。
 */
const BACKGROUND_IMAGES = {
  dark: {
    desktop:
      "/img/Background-dark.png",
    mobile:
      "/img/Background-dark.png",
  },
  light: {
    desktop:
      "/img/Background.png",
    mobile:
      "/img/Background.png",
  },
  fallback:
    "/img/Background.png",
};

// === 页面排除列表 ===
/**
 * 在以下路径（前缀匹配）不跟随颜色模式切换背景。
 * 说明：主页 ("/") 也被视为排除页面。
 * @type {string[]}
 */
const PAGE_EXCLUSIONS = [
  "/links/",
  "/about/",
  "/categories/",
  "/tags/",
  "/collections/",
];

// === 工具函数 ===
/**
 * 判断当前页面是否在排除列表中。
 * @param {string} path - location.pathname
 * @returns {boolean}
 */
const isExcludedPage = (path) => {
  return PAGE_EXCLUSIONS.some((excluded) => path.startsWith(excluded));
};

/**
 * 判断是否为移动端视口。
 * @returns {boolean}
 */
const isMobileViewport = () => window.innerWidth < 768;

/**
 * 移除 banner 遮罩，避免背景图层被半透明黑层覆盖。
 */
const removeBannerMask = () => {
  const mask = document.querySelector("#banner .mask");
  if (mask) mask.style.backgroundColor = "rgba(0,0,0,0)";
};

/**
 * 预加载所有背景图片，降低首帧闪烁。
 */
const preloadBackgroundImages = () => {
  const urls = new Set();
  // 收集所有图片 URL
  Object.values(BACKGROUND_IMAGES).forEach((entry) => {
    if (typeof entry === "object") {
      urls.add(entry.desktop);
      urls.add(entry.mobile);
    } else {
      urls.add(entry);
    }
  });
  // 创建 Image 对象触发加载
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

/**
 * 根据当前模式 / 视口或自定义 URL 设置背景图。
 * @param {"dark" | "light" | null} mode - 当前颜色模式；null 表示排除页面
 * @param {string} [customUrl] - 强制使用的自定义链接（优先级最高）
 */
const applyBackgroundImage = (mode, customUrl) => {
  const mobile = isMobileViewport();
  let imageUrl;

  if (customUrl) {
    // 若明确指定自定义 URL，则直接使用
    imageUrl = customUrl;
  } else if (mode === null) {
    console.log("mode is null");
    // 排除页面：桌面使用 fallback，移动端统一 dark.mobile
    imageUrl = mobile
      ? BACKGROUND_IMAGES["dark"].mobile
      : BACKGROUND_IMAGES.fallback;
  } else if (!isExcludedPage(location.pathname) && mode) {
    // 非排除页面：根据模式 + 视口选择
    imageUrl = mobile
      ? BACKGROUND_IMAGES[mode].mobile
      : BACKGROUND_IMAGES[mode].desktop;
  } else {
    // 处理从移动端切换回桌面端时可能出现的背景错乱
    imageUrl = mobile
      ? BACKGROUND_IMAGES["dark"].mobile
      : BACKGROUND_IMAGES.fallback;
  }
  console.log("url: ", {imageUrl});
  backgroundContainer.style.backgroundImage = `url(${imageUrl})`;
};

/**
 * 获取用户当前的颜色模式（深/浅）。
 * @returns {"dark" | "light"}
 */
const getUserColorScheme = () => {
  const mode = document.documentElement.getAttribute("data-user-color-scheme");
  console.log("mode: ", {mode});
  return mode === "dark" ? "dark" : "light";
};

/**
 * 颜色模式切换后的回调：重新应用背景并移除遮罩。
 */
const handleColorSchemeToggle = () => {
  if (!isExcludedPage(location.pathname)) {
    applyBackgroundImage(getUserColorScheme());
  }
  removeBannerMask();
};

// === 视口 Resize 处理（防抖） ===
let resizeTimer; // 定时器句柄
/**
 * 窗口大小变化事件的处理函数（含 200ms 防抖）。
 */
const handleViewportResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    applyBackgroundImage(getUserColorScheme());
  }, 200);
};

// === 监听颜色模式属性变化 ===
const observeColorSchemeChange = () => {
  const targetNode = document.documentElement;
  const config = {
    attributes: true,
    attributeFilter: ["data-user-color-scheme"],
  };

  const callback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "data-user-color-scheme"
      ) {
        handleColorSchemeToggle();
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
};

// === 初始化 ===
/**
 * 初始化背景：预加载 → 根据当前页面 & 模式设置 → 去掉遮罩。
 */
const initializeBackgrounds = () => {
  preloadBackgroundImages();

  const currentPath = location.pathname;
  const currentMode = getUserColorScheme();

  if (PAGE_EXCLUSIONS.includes(currentPath)) {
    applyBackgroundImage(null);
  } else {
    applyBackgroundImage(currentMode);
  }

  removeBannerMask();
};

// === 事件监听 ===
if (!colorToggleButton) {
  console.warn("未找到颜色模式切换按钮");
} else {
  colorToggleButton.addEventListener("click", () => {
    setTimeout(() => {
      handleColorSchemeToggle();
    }, 100);
  });
}

// 监听颜色模式属性变化
observeColorSchemeChange();

// 监听窗口大小变化
window.addEventListener("resize", handleViewportResize, { passive: true });

// DOMContentLoaded → 初始化背景
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM 完成，开始初始化背景图。");
  initializeBackgrounds();
});

// 加载完毕之后清除控制台日志
window.addEventListener("load", () => {
  console.clear();
});