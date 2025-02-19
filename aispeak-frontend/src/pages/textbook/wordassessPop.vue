<template>
    <view class="modal" v-if="isModalVisible" @tap="hideEvaluationModal">
        <view class="modal-content" :class="{ 'modal-content-active': isModalVisible }" @tap.stop>
            <view class="modal-title">发音测评</view>
            <view class="modal-body">
                {{ currentWord.word }}
            </view>
            <!-- 预留跟读按钮位置 -->
            <view class="assess-actions-placeholder">
                <view class="assess-actions">
                <speech  @success="submitRecording"></speech>
                </view>
            </view>
            <view class="modal-footer">
                <button @tap="hideEvaluationModal">关闭</button>
            </view>
        </view>
    </view>
</template>

<script setup>

    import { ref,defineEmits} from 'vue';
    import Speech from "./PronuciationSpeech.vue"


    const props = defineProps({
        currentWord: {
        type: Object, 
        required: true
         },
    })

    const isModalVisible = ref(false);
    const emit = defineEmits();
    const hideEvaluationModal = () => {
        isModalVisible.value = false;
    };


    // 显示弹窗方法
    const showPopup = () => {
        isModalVisible.value = true;
    };

    const submitRecording = (voice) => {
        console.log(voice, "录音对象")
    }
    
    // 将方法暴露给父组件
    defineExpose({
    showPopup
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
    align-items: flex-end; /* 弹窗从底部弹出 */
    z-index: 1000;
    transition: opacity 0.3s ease;
}

.modal-content {
    background-color: white;
    width: 100%;
    border-top-left-radius: 20rpx;
    border-top-right-radius: 20rpx;
    padding: 32rpx;
    transform: translateY(100%); /* 初始位置在屏幕外 */
    transition: transform 0.3s ease;
}

.modal-content-active {
    transform: translateY(0); /* 弹窗弹出时回到屏幕内 */
}

.modal-title {
    font-size: 32rpx;
    // font-weight: bold;
    margin-bottom: 20rpx;
    text-align: center;
}

.modal-body {
    font-size: 35rpx;
    margin-bottom: 20rpx;
    font-weight: bold;
    text-align: center;
}

.modal-footer {
    text-align: right;
}
</style>