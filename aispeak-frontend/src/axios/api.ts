import __config from "@/config/env";

const request = (
  url: string,
  method?:
    | "OPTIONS"
    | "GET"
    | "HEAD"
    | "POST"
    | "PUT"
    | "DELETE"
    | "TRACE"
    | "CONNECT",
  data?: any,
  showLoading?: boolean
): Promise<any> => {
  let _url = __config.basePath + url;
  
  // 清理空字符串参数（对于 GET 请求特别重要）
  if (method === "GET" && data) {
    const cleanedData: any = {};
    for (const key in data) {
      // 只添加非空值（排除空字符串、null、undefined）
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        cleanedData[key] = data[key];
      }
    }
    data = cleanedData;
  }
  
  return new Promise((resolve, reject) => {
    if (showLoading) {
      uni.showLoading();
    }
    uni.request({
      url: _url,
      method: method,
      data: data,
      header: {
        "Content-Type": "application/json",
        "X-Token": uni.getStorageSync("x-token")
          ? uni.getStorageSync("x-token")
          : "",
      },
      success(res) {
        if (res.statusCode == 200) {
          resolve(res.data);
        } else if (res.statusCode == 401) {
          // 检查是否有token，如果没有token说明是游客模式
          const token = uni.getStorageSync("x-token");
          if (token) {
            // 有token但过期了，提示重新登录
            uni.showToast({
              title: "登录过期，重新登录",
              icon: "none",
              duration: 2000,
            });
            uni.removeStorageSync("x-token");
            uni.removeStorageSync("user_id");
            // 延迟跳转，让用户看到提示
            setTimeout(() => {
              uni.navigateTo({
                url: "/pages/login/index",
              });
            }, 2000);
          } else {
            // 游客模式，不提示，直接返回错误
            reject({
              code: 401,
              message: "需要登录"
            });
          }
        } else {
          reject(res.data);
        }
      },
      fail(error) {
        console.error(error);
        reject(error);
      },
      complete(res) {
        // 判断是否在loading中
        if (showLoading) {
          uni?.hideLoading();
        }
      },
    });
  });
};
export default request;
