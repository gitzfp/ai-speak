<template>
  <view class="container">
    <!-- 头部 -->
    <view class="header">
      <view class="description">
        <text>已同步新教材，正版权威更可靠</text>
      </view>
      <view class="book-info">
        <view class="leftcontent">
          <image :src="book.icon_url" class="book-cover" />
        </view>
        <view class="rightcontent">
          <view class="book-details">
            <view class="book-subtitle">{{ book.grade }} {{ book.term }}</view>
            <view class="book-title">{{ book.book_name }}</view>
          </view>
          <view class="book-buttons">
            <view class="qiuhuan" @click="switchBook">⥦ 切换教材</view>
            <view class="fenxiang" @click="shareToClass">分享到班级</view>
          </view>
        </view>
     </view>
    </view>
    <!-- 功能按钮区域 -->
    <view class="function-buttons">
      <view class="button-tit">
        <image class="buttontit-icon" src="@/assets/icons/preparation_book.svg"></image>
          课本同步学
      </view>
      <view class="button-row button-line">
        <view class="function-button" @click="textbookListen">
          <image class="button-icon" src="@/assets/icons/listening.svg"></image>
          听课文
        </view>
        <view class="function-button" @click="sentenceFollow">
          <image class="button-icon" src="@/assets/icons/repeat.svg"></image>
          句子跟读
        </view>
        <!-- <view class="function-button" @click="reciteTest">
          <image class="button-icon" src="@/assets/icons/recitation_pattern.svg"></image>
          背诵测评
        </view> -->
        <!-- <view class="function-button" @click="vocabularyReinforcement">
          <image class="button-icon" src="@/assets/icons/word.svg"></image>
          学单词
        </view> -->
        <view class="function-button" @click="listenWrite">
          <image class="button-icon" src="@/assets/icons/recite.svg"></image>
          课本点读
        </view>
      </view>
      <view class="button-tit">
        <image class="buttontit-icon" src="@/assets/icons/five-star.svg"></image>
          单词强化
      </view>
      <view class="button-row">
        <!-- <view class="function-button" @click="wordTricks">
          <image class="button-icon" src="@/assets/icons/verify-code2.svg"></image>
          单词巧记
        </view> -->
        <view class="function-button" @click="earTraining">
          <image class="button-icon" src="@/assets/icons/ear_grinding.svg"></image>
          磨耳朵
        </view>
        <view class="function-button" @click="pronunciationTest">
          <image class="button-icon" src="@/assets/icons/tk-ivr.svg"></image>
          发音测评
        </view>
        <view class="function-button" @click="wordListenWrite">
          <image class="button-icon" src="@/assets/icons/word_dictation.svg"></image>
          单词听写
        </view>
        <!-- <view class="function-button" @click="eliminationGame">
          <image class="button-icon" src="@/assets/icons/abacus_flat.svg"></image>
          消消乐
        </view> -->
      </view>
    </view>
    <view class="intermediate-part">
      <!-- <view class="subscribe">
          <view class="subscribe-tit">
            <image class="buttontit-icon" src="@/assets/icons/bell.svg"></image>
            <view>订阅学习报告，及时掌握孩子学习情况！</view>
          </view>
      </view> -->
      <view @tap="wordRecitationHomeclick" class="recitation-plan">
          <view class="recitation-tit">
            <view class="recitation-left">
              <image class="recitation-icon1" src="@/assets/icons/en.svg"></image>
              <view>今日背词计划 </view>
              <image class="recitation-icon2" src="@/assets/icons/left_arrow.svg"></image>
            </view>
            <view class="recitation-right">
              已背 0/595
            </view>
          </view>
          <view class="button-container">
            <view class="spacer"></view>
            <view class="button-left">
              <image class="container-icon" src="@/assets/icons/toeng.svg"></image>
              <view class="container-tit">需新学习5词 </view>
            </view>
            <view class="spacer"></view>
            <view class="button-right">
              <image class="container-icon" src="@/assets/icons/toeng2.svg"></image>
              <view class="container-tit">需复习0词 </view>
            </view>
            <view class="spacer"></view>
          </view>
      </view>
    </view>



    <bookSelector ref="bookSelectors" v-if="isPopupOpen" :books="books" @switchbookSuccess="switchbookSuccess" @closePopup="togglePopup" />
  </view>
</template>

<script setup>
import { ref,nextTick,onMounted, Text} from 'vue';
import bookSelector from './bookSelector.vue';
// 引入 Icon 组件
// import Icon from "@/components/Icon.vue";

const isPopupOpen = ref(false)
const bookSelectors = ref(null);
const book = ref({
	book_id:'',
	book_name:'',
	grade:'',
	icon_url: '',
	subject_id:0,
	term:'',
	version_type:''
})

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

const switchbookSuccess = (newbook) => {
  console.log("newbook=====")
    console.log(newbook)
    book.value = {...newbook}
    console.log(book.value.term)
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
        //  book.value = books.value[0]
         book.value = { ...books.value[0] };
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

const textbookListen = () => {
  uni.navigateTo({
    url: `/pages/textbook/TextbookListen?book_id=${book.value.book_id}`,
  })
};

const sentenceFollow = () => {
  console.log('Sentence Follow');
};

const reciteTest = () => {
  console.log('Recite Test');
};

const vocabularyReinforcement = () => {
  console.log('Learn Words');
  const objStr = JSON.stringify(book.value);
  uni.setStorage('currentBook', objStr);

  uni.navigateTo({
      url: `/pages/textbook/Learnwords?objId=currentBook`
    });
};

const listenWrite = () => {
  console.log('Text Point Read');
  uni.navigateTo({
        url: `/pages/textbook/books?book_id=${book.value.book_id}`,
      })
};

// 背单词入口
const wordRecitationHomeclick = () => {
  uni.navigateTo({
	url: `/pages/textbook/WordRecitationHome`,
  })
}


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
</script >

<style  scoped lang="less">
.container {
  // background-color: #59C160;
  background: linear-gradient(to bottom, #59C160 0%, #f8f9fa 100%);
  padding-top:10px;
  height: 100vh;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
  margin:60rpx 30rpx;
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
  margin-bottom: 10px;
  width: 100%;
}
.highlight-text {
  font-size: 25px;
  /* background-color: #5cb85c; */
  /* padding: 5px 10px; */
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

  padding: 10px;
  border-radius: 10px;
  width: 100%;
  margin-bottom: 20px;
  color: #fff;
  text-align: left;
}
.description text {
  background-color: #5ECB80;
  padding: 10px;
  border-radius: 5px;
}

.book-info {
  display: flex;
  align-items: center;
  /* margin-bottom: 20px; */
  /* background-color: red; */
  width: 100%;;

}
.leftcontent {
  width: 120px; /* 设置.leftcontent宽度为120px */
  display: flex;
  justify-content: center;
  align-items: center; /* 垂直居中 */
}
.rightcontent {
  flex-grow: 1; /* 让.rightcontent占据剩余的空间 */
}
.book-details {
  height: 74px;
}
.book-subtitle {
  line-height: 45px;
  color: #fff;
  font-size: 25px;
  font-weight: bold;
}
.book-title {
  line-height: 20px;
  font-size: 16px;
  color: #73E0FF;
}
.book-buttons {
  height: 74px;
  display: flex;
  justify-content: space-between;
}
.book-buttons .qiuhuan {
  margin-top: 10px;
  background-color: #fff;
  color: #6FDBA7;
  height: 30px;
  line-height: 30px;
  padding: 0 20px;
  border-radius: 15px;
  font-size: 13px;
}

.book-buttons .fenxiang {
  margin-top: 10px;
  background-color: #FBE6CE;
  color: #E6A65D;
  height: 30px;
  line-height: 30px;
  padding: 0 20px;
  border-radius: 15px;
  font-size: 13px;
}


.book-cover {
  width: 103px;
  height: 148px;
  margin-right: 20px;
}

.buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
}

.button-tit {
  padding-top: 5px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: grey;
}
.buttontit-icon {
  width: 15px; /* 根据实际图标的大小调整 */
  height: 15px; /* 根据实际图标的大小调整 */
  margin: 5px;

}

.button-row {
  display: flex;
  justify-content: space-around;
  padding-bottom: 10px;
}
.button-line {
  border-bottom: 0.5px solid gainsboro;
}

.function-buttons {
  background-color: #F4FFF5;
  border-radius: 10px;
  margin:30rpx 0;
}

.function-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* background-color: #F4FFF5; */
  border-radius: 10px;
  border: 0;
  outline: none;
  padding: 10px;
  /* margin: 5px; */
  width: 100px;
  text-align: center;
  font-size: 12px;
  color: #333;
  font-weight: bold;
}

.button-icon {
  width: 100rpx; /* 根据实际图标的大小调整 */
  height: 100rpx; /* 根据实际图标的大小调整 */
  margin-bottom: 5rpx;
}

.intermediate-part {
  margin-top: 30rpx;
  width: 100%;
  padding: 10rpx 10rpx 10rpx 0;
  background-color: white;
  .subscribe {
    background-color: #fdf3e8;
    margin:0 15rpx;
    border-radius: 25rpx;
    height: 50rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .subscribe-tit {
      display: flex;
      align-items: center;
      image {
        margin-left: 25px;
        width: 20px;
        height: 20px;
      }
      view {
        font-size: 13px;
        font-weight: bold;
      }
    }
    .subscribe-bnt {
      background-color: #e98f36;
      color: #fff;
      font-size: 12px;
      margin-right: 15px;
      height: 25px;
      border-radius: 17.5px;
      padding: 5px 15px;
      line-height: 25px;
    }
  }

  .recitation-plan {
    margin: 15px;
    border-radius: 10px;
    height: 100px;
    border: 1px solid #f5f5f5; /* 添加边框，替换 #yourBorderColor 为你想要的边框颜色 */
    box-shadow: 0 0.5px 3px rgba(0,0,0,0.1); /* 添加阴影效果，可根据需要调整 */
    padding-bottom: 15px;
    .recitation-tit {

      margin:0 15px;
      border-radius: 25px;
      height: 50px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .recitation-left {
        display: flex;
        align-items: center;
        .recitation-icon1 {
          width: 20px;
          height: 20px;
          margin-right: 5px;
        }
        .recitation-icon2 {
          width: 15px;
          height: 15px;
        }
        view {
          font-size: 15px;
          font-weight: bold;
          margin-right: 5px;
        }
      }
      .recitation-right {
        font-size: 13px;
        margin-right: 5px;
      }

      
    }
  
    .button-container {
      display: flex;
      align-items: center; /* 垂直居中对齐 */
      .spacer {
        flex-grow: 1; /* 让这些间隔占据剩余空间 */
      }
      .button-left {
        /* 确保按钮间没有额外的间距 */
        margin: 0;
        width: 35%;
        height: 45px;
        background: #e98f36;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 22.5px;
      }
      .button-right {
        /* 确保按钮间没有额外的间距 */
        margin: 0;
        width: 35%;
        height: 45px;
        background-color: #EE6838;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 22.5px;
      }

      .container-icon {
        width: 20px;
        height: 20px;
        margin-right: 5px;
      }
      .container-tit {
        font-size: 15px;
        font-weight: 300;
        color: #fff;
      }
    }

  }

}


</style>