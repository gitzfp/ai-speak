<template>
  <view class="page">
    <!-- 顶部图片 -->
    <!-- <image class="goodimg" src="../../static/good.jpg" mode="aspectFit"></image -->

    <!-- 文字描述 -->
    <view class="description">
      <text style="font-size: 40rpx; color: #333;">太棒啦</text>
    </view>
	<view class="description">
		<text style="font-size: 28rpx; color: #666;">已经学习<text style="color: orangered;">{{allWords.length}}</text>个单词</text>
	</view>

    <!-- 分享按钮 -->
    <view class="share-button" @click="shareToClass">分享到班级</view>

    <!-- 邀请按钮 -->
    <view class="invite-button" @click="inviteFriend">邀请朋友一起学</view>
  </view>
</template>

<script setup>
	import { ref,onMounted,defineEmits} from 'vue';
	
	const props = defineProps({
	    allWords: {
			type: Array,
			default: () => [],
	    },
	})
	
	// 判断是否是小程序环境
	const isMiniProgram = typeof wx !== 'undefined' && wx;



 // 分享到班级
    const shareToClass = () => {
		console.log("wx")
		console.log(wx)
		console.log("isMiniProgram")
		console.log(isMiniProgram)
		
        if (isMiniProgram) {
            // 小程序分享逻辑
            wx.shareAppMessage({
                title: '分享到班级',
                path: '/pages/index/index',
                imageUrl: '../../static/good.jpg',
                success(res) {
                    console.log('小程序分享成功', res);
                },
                fail(err) {
                    console.error('小程序分享失败', err);
                }
            });
        } else {
            // H5分享逻辑
            if (typeof wx !== 'undefined') {
                wx.ready(() => {
                    wx.updateAppMessageShareData({
                        title: '分享到班级',
                        desc: '快来和我一起学习吧！',
                        link: window.location.href,
                        imgUrl: 'https://your-domain.com/static/good.jpg',
                        success() {
                            console.log('H5分享设置成功');
                        },
                        fail(err) {
                            console.error('H5分享设置失败', err);
                        }
                    });
                });
            } else {
                console.error('微信 JS-SDK 未加载');
            }
        }
    };
	
    // 邀请朋友一起学
    const inviteFriend = () => {
        if (isMiniProgram) {
            // 小程序分享逻辑
            wx.shareAppMessage({
                title: '邀请朋友一起学',
                path: '/pages/index/index',
                imageUrl: '../../static/good.jpg',
                success(res) {
                    console.log('小程序分享成功', res);
                },
                fail(err) {
                    console.error('小程序分享失败', err);
                }
            });
        } else {
            // H5分享逻辑
            if (typeof wx !== 'undefined') {
                wx.ready(() => {
                    wx.updateTimelineShareData({
                        title: '邀请朋友一起学',
                        link: window.location.href,
                        imgUrl: 'https://your-domain.com/static/good.jpg',
                        success() {
                            console.log('H5分享设置成功');
                        },
                        fail(err) {
                            console.error('H5分享设置失败', err);
                        }
                    });
                });
            } else {
                console.error('微信 JS-SDK 未加载');
            }
        }
    };

	
	// 组件挂载时启动自动滑动
	onMounted(() => {
		
		//暂时没有 全局分享
	//     if (isMiniProgram) {
	//         // 小程序全局分享设置
	//         wx.onShareAppMessage(() => {
	//             return {
	//                 title: '太棒啦！我已经学习了很多单词',
	//                 path: '/pages/index/index',
	//                 imageUrl: '../../static/good.jpg',
	//             };
	//         });
	//     } else {
	//         // H5全局分享设置
	//         if (typeof wx !== 'undefined') {
	//             wx.ready(() => {
	//                 wx.updateAppMessageShareData({
	//                     title: '太棒啦！我已经学习了很多单词',
	//                     desc: '快来和我一起学习吧！',
	//                     link: window.location.href,
	//                     imgUrl: 'https://your-domain.com/static/good.jpg',
	//                     success() {
	//                         console.log('H5分享设置成功');
	//                     },
	//                     fail(err) {
	//                         console.error('H5分享设置失败', err);
	//                     }
	//                 });
	
	//                 wx.updateTimelineShareData({
	//                     title: '太棒啦！我已经学习了很多单词',
	//                     link: window.location.href,
	//                     imgUrl: 'https://your-domain.com/static/good.jpg',
	//                     success() {
	//                         console.log('H5朋友圈分享设置成功');
	//                     },
	//                     fail(err) {
	//                         console.error('H5朋友圈分享设置失败', err);
	//                     }
	//                 });
	//             });
	//         } else {
	//             console.error('微信 JS-SDK 未加载');
	//         }
	//     }
	});


</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.goodimg {
	margin-top: 50rpx;
	width: 200rpx;
	height: 200rpx;
}

.description {
  margin-top: 20rpx;
  text-align: center;
}

.share-button{
  width: 70%;
  height: 90rpx;
  margin-top: 50rpx;
  border-radius: 45rpx;
  text-align: center;
  line-height: 90rpx;
  font-size: 30rpx;
  background-color: #ff6600;
  color: #fff;
}
.invite-button {
  width: 70%;
  height: 90rpx;
  margin-top: 30rpx;
  border-radius: 45rpx;
  text-align: center;
  line-height: 90rpx;
  font-size: 30rpx;
  background-color: #00bfa5;
  color: #fff;
}


.function-icons {
  display: flex;
  justify-content: space-around;
  margin-top: 40rpx;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>