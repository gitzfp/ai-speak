<template>
  <view class="container">
    <!-- 头部 -->
    <view class="header">
      <!-- <image src="/static/images/logo.png" mode="widthFix"></image> -->
      <text class="title">英语朗读宝</text>
      <view class="subtitle">
        <text class="highlight-text">课本同步学 英语进步快</text>
      </view>
      <view class="description">
        <text>已同步新教材，正版权威更可靠</text>
      </view>
      <view class="book-info">
        <!-- <image src="/static/images/book-cover.png" mode="widthFix"></image> -->
        <view class="book-details">
          <text>一年级上册</text>
          <text>人教版PEP</text>
        </view>
      </view>
      <view class="buttons">
        <button @click="switchBook">切换教材</button>
        <button @click="shareToClass">分享到班级</button>
      </view>
    </view>
    <!-- 功能按钮区域 -->
    <view class="function-buttons">
      <view class="button-row">
        <button class="function-button" @click="textbookSync">
          <!-- <Icon name="listening" color="red" size="24" /> -->
          听课文
        </button>
        <button class="function-button" @click="sentenceFollow">
          <!-- <image class="button-icon" src=""></image> -->
          句子跟读
        </button>
        <button class="function-button" @click="reciteTest">
          <!-- <image class="button-icon" src="../../static/icons/book_r.png"></image> -->
          背诵测评
        </button>
        <button class="function-button" @click="vocabularyReinforcement">
          <!-- <image class="button-icon" src="../../static/icons/book_r.png"></image> -->
          单词强化
        </button>
        <button class="function-button" @click="listenWrite">
          <!-- <image class="button-icon" src="../../static/icons/book_r.png"></image> -->
          听写练习
        </button>
      </view>
      <view class="button-row">
        <button class="function-button" @click="wordTricks">单词巧记</button>
        <button class="function-button" @click="earTraining">磨耳朵</button>
        <button class="function-button" @click="pronunciationTest">发音测评</button>
        <button class="function-button" @click="wordListenWrite">单词听写</button>
        <button class="function-button" @click="eliminationGame">消消乐</button>
      </view>
    </view>
    <bookSelector ref="bookSelectors" v-if="isPopupOpen" :books="books" @switchbookSuccess="switchbookSuccess" @closePopup="togglePopup" />
  </view>
</template>

<script setup>
import { ref,nextTick,onMounted} from 'vue';
import bookSelector from './bookSelector.vue';
// 引入 Icon 组件
// import Icon from "@/components/Icon.vue";

const isPopupOpen = ref(false)
const bookSelectors = ref(null);

// 书籍数据
const books = ref([])

const togglePopup = () => {
  console.log("删除")
  isPopupOpen.value = false;
};


// 组件挂载时获取数据
onMounted(() => {
    fetchBooks(false)
})

const switchbookSuccess = (book) => {
  console.log("book=====")
    console.log(book)
}


const switchBook = () => {

  if (books.value.length) {
    isPopupOpen.value = true;
    console.log("isPopupOpen.value")
    console.log(isPopupOpen.value)
    // 使用 nextTick 确保 DOM 已经更新并且子组件已经挂载
    nextTick(() => {
          console.log("After DOM update:");
          console.log(bookSelectors.value); // 这里应该能够获取到子组件实例
          
          if (bookSelectors.value && typeof bookSelectors.value.showPopup === 'function') {
            bookSelectors.value.showPopup(); // 调用子组件的方法
          }
    });
  } else {
    fetchBooks(true)
  }

};

// 从接口获取数据
const fetchBooks = (isSwitch) => {
  console.log("数据库的边框和")
  uni.request({
    url: "https://diandu.mypep.cn/static/textbook/bookList_pep_click_subject_web_1_0_0.json",
    success: (res) => {
      // 过滤出英语科目的书籍
      const englishSubject = res.data.booklist.find(
        (subject) => subject.subject_name === "英语"
      )
      if (englishSubject) {
        // 将所有版本的书籍合并到一个数组中
        books.value = englishSubject.versions.flatMap(
          (version) => version.textbooks
        )

        if (isSwitch) {
          isPopupOpen.value = true;
          console.log("点击切换请求进去")
        // 使用 nextTick 确保 DOM 已经更新并且子组件已经挂载
        nextTick(() => {
              console.log("After DOM update:");
              console.log(bookSelectors.value); // 这里应该能够获取到子组件实例
              
              if (bookSelectors.value && typeof bookSelectors.value.showPopup === 'function') {
                bookSelectors.value.showPopup(); // 调用子组件的方法
              }
        });
        } else {
          console.log("一开始请求")
        }
        

      }
    },
    fail: (err) => {
      console.error("Failed to fetch books:", err)
    },
  })
}

const shareToClass = () => {
  console.log('Share to Class');
};

const textbookSync = () => {
  console.log('Listen Text');
};

const sentenceFollow = () => {
  console.log('Sentence Follow');
};

const reciteTest = () => {
  console.log('Recite Test');
};

const vocabularyReinforcement = () => {
  console.log('Learn Words');
};

const listenWrite = () => {
  console.log('Text Point Read');
};

const wordTricks = () => {
  console.log('Word Tricks');
};

const earTraining = () => {
  console.log('Ear Training');
};

const pronunciationTest = () => {
  console.log('Pronunciation Test');
};

const wordListenWrite = () => {
  console.log('Word Listen Write');
};

const eliminationGame = () => {
  console.log('Elimination Game');
};
</script>

<style scoped>
.container {
  background-color: #59C160;
  padding: 10px;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 20px;
  color: #fff;
  margin-bottom: 10px;
  width: 100%;
}

.subtitle {
  font-size: 20px;
  color: #408F4C;
  margin-bottom: 20px;
  width: 100%;
}
.highlight-text {
  font-size: 25px;
  /* background-color: #5cb85c; */
  padding: 5px 10px;
  border-radius: 10px;
  
  color: #408F4C; /* 文字颜色 */

  /* 使用 text-shadow 创建描边效果 */
  text-shadow:
    -1px -1px 0 #fff, /* 左上角 */
     1px -1px 0 #fff, /* 右上角 */
    -1px 1px 0 #fff,  /* 左下角 */
     1px 1px 0 #fff;  /* 右下角 */
}

.description {
  background-color: #cfe8d9;
  padding: 10px;
  border-radius: 10px;
  width: 50%;
  text-align: center;
  margin-bottom: 20px;
}

.book-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.book-cover {
  width: 100px;
  height: 150px;
  margin-right: 20px;
}

.book-details {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
}

.button-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.function-buttons {
  background-color: #F5FEF5;
  border-radius: 10px;
}

.function-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: none;
  border-radius: 10px;
  padding: 10px;
  /* margin: 5px; */
  width: 100px;
  text-align: center;
  font-size: 12px;
  color: #333;
}
.function-button button {
  background: none;
}
.button-icon {
  width: 40px; /* 根据实际图标的大小调整 */
  height: 40px; /* 根据实际图标的大小调整 */
  margin-bottom: 5px;
}
</style>