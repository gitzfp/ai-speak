<template>
    <view class="modal" v-if="isVisible" @tap="closeModal">
      <view class="modal-content" :class="{ 'modal-content-active': isVisible }" @tap.stop>
        <view class="modal-title">播放设置</view>
        <view class="modal-body">
          <!-- 播放设置内容 -->
          <view class="setting-item">
            <text>重复次数</text>
            <view class="setting-right">
                <view class="ControlsItem" @click="removeItem(playsettingobject.repeatnum)">-</view>
                <!-- 中间数组展示 -->
                <view class="middlenum">{{playsettingobject.repeatnum}}次</view>
                <!-- 增加按钮 -->
                <view class="ControlsItem" @click="addItem(playsettingobject.repeatnum)">+</view>
            </view>
          </view>
          <view class="setting-item">
            <text>切换间隔</text>
            <view class="setting-right">
                <view class="ControlsItem" @click="removeSeconds(playsettingobject.interval)">-</view>
                <!-- 中间数组展示 -->
                <view class="middlenum">{{playsettingobject.interval}}秒</view>
                <!-- 增加按钮 -->
                <view class="ControlsItem" @click="addSeconds(playsettingobject.interval)">+</view>
            </view>
          </view>
          <view class="setting-item">
            <text>发音倍速</text>
            <view class="setting-right">
              <view @click="multipleclick(item)" :class="{multiple:playsettingobject.multiple==item}" v-for="(item, index) in multipleList" :key="index"  class="middlenum">{{item}}</view>
            </view>
          </view>
          <view class="setting-item">
            <text>单词拼读</text>
            <switch :checked="playsettingobject.phonicsState" @change="phonicsChange" />
          </view>
          <view class="setting-item">
            <text>播放单词释义</text>
            <switch :checked="playsettingobject.annotationSate" @change="annotationChange" />
          </view>
        </view>
        <view class="modal-footer">
          <button @tap="closeModal">关闭</button>
        </view>
      </view>
    </view>
  </template>
  
  <script setup>
  import { ref,defineEmits,onMounted} from 'vue';

  const emit = defineEmits();

  const props = defineProps({
    playsettingobject: {
    type: Object, 
    required: true
    },
    currentPage:{
      type: Number,
    }
})

    // 组件挂载时获取数据
    onMounted(() => {
      
    })
  
  const isVisible = ref(false);

  const multipleList = ref(
    [0.5,0.75,1.0,1.25,1.5,2.0]
  );
  


  function removeItem(repeatnum) {
    if (repeatnum>1) {
      repeatnum = repeatnum-1
      const newSettings = {
      ...props.playsettingobject,
      repeatnum: repeatnum // 修改某个属性
      };
      emit('playsettingSuccess', newSettings);
    }
  }
  function addItem(repeatnum) {
    if (repeatnum<5) {
      repeatnum = repeatnum+1
      const newSettings = {
      ...props.playsettingobject,
      repeatnum: repeatnum // 修改某个属性
      };
      emit('playsettingSuccess', newSettings);
    }
  }

  function removeSeconds(interval) {
    if (interval>1) {
      interval = interval-1
      const newSettings = {
      ...props.playsettingobject,
      interval: interval // 修改某个属性
      };
      emit('playsettingSuccess', newSettings);
    }
  }
  function addSeconds(interval) {
    if (interval<9) {
      interval = interval+1
      const newSettings = {
      ...props.playsettingobject,
      interval: interval // 修改某个属性
      };
      emit('playsettingSuccess', newSettings);
    }
  }

  function multipleclick(item) {
      const newSettings = {
      ...props.playsettingobject,
      multiple: item // 修改某个属性
      };
      emit('playsettingSuccess', newSettings);
    
  }

  

  function phonicsChange(event) {
    // 更新switchState为新的状态
    
    const newSettings = {
      ...props.playsettingobject,
      phonicsState: event.detail.value // 修改某个属性
      };
      emit('playsettingSuccess', newSettings);
  }
  function annotationChange(event) {
    // 更新switchState为新的状态
    const newSettings = {
      ...props.playsettingobject,
      annotationSate: event.detail.value // 修改某个属性
      };
      emit('playsettingSuccess', newSettings);
  }

  const showModal = () => {
    isVisible.value = true;
  };
  
  const closeModal = () => {
    isVisible.value = false;
  };
  
  defineExpose({
    showModal,
    closeModal,
  });
  </script>
  
  <style scoped lang="scss">
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 1000;
    transition: opacity 0.3s ease;
  }
  
  .modal-content {
    background-color: white;
    width: 100%;
    border-top-left-radius: 20rpx;
    border-top-right-radius: 20rpx;
    padding: 32rpx;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }
  
  .modal-content-active {
    transform: translateY(0);
  }
  
  .modal-title {
    font-size: 32rpx;
    // font-weight: bold;
    margin-bottom: 20rpx;
    padding: 10rpx 0;
    text-align: center;
  }
  
  .modal-body {
    margin-bottom: 20rpx;
  }
  
  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25rpx 0;
    // border-bottom: 1rpx solid #e8e8e8;
  }
  .setting-right {
    display: flex;
    align-items: center;
  }
  .ControlsItem {
    width: 50rpx;
    height: 50rpx;
    border-radius: 25rpx;
    font-size: 35rpx;
    background-color: #999;
    color: #fff;
    display: flex;
    line-height: 40rpx;
    justify-content: center;
    // align-items: center;
  }
  .middlenum {
    margin: 0 15rpx;
  }
  
  .modal-footer {
    text-align: right;
  }
  .multiple {
    color: blue;
  }
  </style>