import sysRequest from "@/api/sys";

// 功能开关配置（默认值）
export const features = {
  // 是否显示教材模块（小程序审核通过后设置为true）
  showTextbookModule: false,
  
  // 是否启用手动输入任务类型
  enableManualInput: true,
}

// 获取功能开关状态
export function isFeatureEnabled(featureName: keyof typeof features): boolean {
  return features[featureName] || false;
}

// 更新功能开关状态
export function updateFeature(featureName: keyof typeof features, enabled: boolean) {
  features[featureName] = enabled;
  // 同时保存到本地存储作为缓存
  uni.setStorageSync(`feature_${featureName}`, enabled);
}

// 从后端加载功能开关状态
export async function loadFeaturesFromServer() {
  try {
    const res = await sysRequest.settingsGet();
    if (res.data && res.data.features) {
      Object.keys(res.data.features).forEach((key) => {
        if (key in features) {
          (features as any)[key] = res.data.features[key];
          // 更新本地缓存
          uni.setStorageSync(`feature_${key}`, res.data.features[key]);
        }
      });
    }
  } catch (error: any) {
    // 如果是404错误，说明接口还未实现，使用默认配置
    if (error.response && error.response.status === 404) {
      console.log('系统设置接口暂未实现，使用默认配置');
    } else {
      console.error('加载功能配置失败，使用本地缓存:', error);
    }
    // 从本地存储加载
    loadFeaturesFromCache();
  }
}

// 从本地存储加载功能开关状态（作为缓存）
export function loadFeaturesFromCache() {
  Object.keys(features).forEach((key) => {
    const storedValue = uni.getStorageSync(`feature_${key}`);
    if (storedValue !== null && storedValue !== undefined) {
      (features as any)[key] = storedValue;
    }
  });
}

// 初始化时先从缓存加载，然后异步从服务器更新
export function loadFeatures() {
  // 先从缓存加载，保证功能可用
  loadFeaturesFromCache();
  // 异步从服务器更新最新配置
  loadFeaturesFromServer();
}