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
            <view class="qiuhuan" @click="switchBook">切换教材</view>
            <view class="fenxiang" @click="shareToClass">分享班级</view>
          </view>
          <!-- <button class="upload-btn" @tap="uploadPages">上传外研社教材</button> -->
          <!-- <button class="upload-btn" @tap="uploadChapters">上传外研社目录</button> -->
        </view>
      </view>
    </view>
    <!-- 功能按钮区域 -->
    <view class="function-buttons">
      <view class="button-tit">
        <image
          class="buttontit-icon"
          src="@/assets/icons/preparation_book.svg"
        ></image>
        课本同步学
      </view>
      <view class="button-row button-line">
        <view class="function-button" @click="listenWrite">
            <image class="button-icon" src="@/assets/icons/recite.svg"></image>
            课本点读
        </view>
        <view class="function-button" @click="sentenceFollow">
            <image class="button-icon" src="@/assets/icons/repeat.svg"></image>
            句子跟读
        </view>
        <view class="function-button" @click="textbookListen">
          <image class="button-icon" src="@/assets/icons/listening.svg"></image>
          听课文
        </view>
        <!-- <view class="function-button" @click="reciteTest">
          <image class="button-icon" src="@/assets/icons/recitation_pattern.svg"></image>
          背诵测评
        </view> -->
        <!-- <view class="function-button" @click="vocabularyReinforcement">
          <image class="button-icon" src="@/assets/icons/word.svg"></image>
          学单词
        </view> -->
 
      </view>
      <view class="button-tittwo">
        <view class="button-tittwoItem">
          <image
            class="buttontit-icon"
            src="@/assets/icons/five-star.svg"
          ></image>
          单词强化
        </view>
        <view @tap="newWordbookclick" class="button-tittwoItemright">
          生词本
          <image
            class="buttontit-icon"
            src="@/assets/icons/left_arrow_nw.svg"
          ></image>
        </view>
      </view>
      <view class="button-row">
        <!-- <view class="function-button" @click="wordTricks">
          <image class="button-icon" src="@/assets/icons/verify-code2.svg"></image>
          单词巧记
        </view> -->
        <view class="function-button" @click="earTraining">
          <image
            class="button-icon"
            src="@/assets/icons/ear_grinding.svg"
          ></image>
          磨耳朵
        </view>
        <view class="function-button" @click="pronunciationTest">
          <image class="button-icon" src="@/assets/icons/tk-ivr.svg"></image>
          发音测评
        </view>
        <view class="function-button" @click="wordListenWrite">
          <image
            class="button-icon"
            src="@/assets/icons/word_dictation.svg"
          ></image>
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
            <image
              class="recitation-icon2"
              src="@/assets/icons/left_arrow.svg"
            ></image>
          </view>
          <view class="recitation-right"> 已背 0/595 </view>
        </view>
        <view class="button-container">
          <view class="spacer"></view>
          <view class="button-left">
            <image
              class="container-icon"
              src="@/assets/icons/toeng.svg"
            ></image>
            <view class="container-tit">需新学习5词 </view>
          </view>
          <view class="spacer"></view>
          <view class="button-right">
            <image
              class="container-icon"
              src="@/assets/icons/toeng2.svg"
            ></image>
            <view class="container-tit">需复习0词 </view>
          </view>
          <view class="spacer"></view>
        </view>
      </view>
    </view>

    <bookSelector
      ref="bookSelectors"
      v-if="isPopupOpen"
      :books="books"
      @switchbookSuccess="switchbookSuccess"
      @closePopup="togglePopup"
    />
  </view>
</template>

<script setup>
import { ref, nextTick, onMounted, Text } from "vue";
import bookSelector from "./bookSelector.vue";
import env from "@/config/env"; // 导入 env.ts
const baseUrl = env.basePath; // 获取
import textbook from "@/api/textbook";
import bookPages1 from "./wys-textbook/1l1_V2.json";
import bookPages2 from "./wys-textbook/1l2_V2.json";
import bookPages3 from "./wys-textbook/1l3_V2.json";
import bookPages4 from "./wys-textbook/241113SCCL_002052267526682daa78f0001151d8c.json";
import bookPages5 from "./wys-textbook/1l5_V2.json";
import bookPages6 from "./wys-textbook/241113SCCL_002055767579a011887c90001a3978a.json";
import bookPages7 from "./wys-textbook/1l7_V2.json";
import bookPages8 from "./wys-textbook/241113SCCL_00206046756bcbddaa78f0001c8efbd.json";
import bookPages9 from "./wys-textbook/1l9_V2.json";
import bookPages10 from "./wys-textbook/241115SCCL_00206486756c09f105ccd000197c45e.json";
import bookPages11 from "./wys-textbook/1l11_V2.json";
import bookPages12 from "./wys-textbook/241115SCCL_0020690675796941887c900019f87a4.json";
import bookChapters1 from "./wys-chapter/1l1_V2_chapters.json";
import bookChapters2 from "./wys-chapter/1l2_V2_chapters.json";
import bookChapters3 from "./wys-chapter/1l3_V2_chapters.json";
import bookChapters4 from "./wys-chapter/241113SCCL_002052267526682daa78f0001151d8c_chapters.json";
import bookChapters5 from "./wys-chapter/1l5_V2_chapters.json";
import bookChapters6 from "./wys-chapter/241113SCCL_002055767579a011887c90001a3978a_chapters.json";
import bookChapters7 from "./wys-chapter/1l7_V2_chapters.json";
import bookChapters8 from "./wys-chapter/241113SCCL_00206046756bcbddaa78f0001c8efbd_chapters.json";
import bookChapters9 from "./wys-chapter/1l9_V2_chapters.json";
import bookChapters10 from "./wys-chapter/241115SCCL_00206486756c09f105ccd000197c45e_chapters.json";
import bookChapters11 from "./wys-chapter/1l11_V2_chapters.json";
import bookChapters12 from "./wys-chapter/241115SCCL_0020690675796941887c900019f87a4_chapters.json";
import bookChapters_start3_3_first from "./wys-from3-chapter/3l1_V2_chapters.json"; // 三起 三上
import bookChapters_start3_3_second from "./wys-from3-chapter/3l2_V2_chapters.json"; // 三起 三下
import bookChapters_start3_4_first from "./wys-from3-chapter/3l3_V2_chapters.json"; // 三起 四上
import bookChapters_start3_4_second from "./wys-from3-chapter/241111SCCL_002042267565986e341470001a5164f_chapters.json"; // 三起 四下
import bookChapters_start3_5_first from "./wys-from3-chapter/3l5_V2_chapters.json"; // 三起 五上
import bookChapters_start3_5_second from "./wys-from3-chapter/241112SCCL_002048367579bad105ccd0001178859_chapters.json"; // 三起 五下
import bookChapters_start3_6_first from "./wys-from3-chapter/3l7_V2_chapters.json"; // 三起 六上
import bookChapters_start3_6_second from "./wys-from3-chapter/241112SCCL_00204626756c4671887c90001242e2d_chapters.json"; // 三起 六下
import useTextbookSelector from "@/hooks/useTextbookSelector";
import bookTextbook_start3_3_first from "./wys-from3-textbook/3l1_V2.json"; // 三起 三上
import bookTextbook_start3_3_second from "./wys-from3-textbook/3l2_V2.json"; // 三起 三下
import bookTextbook_start3_4_first from "./wys-from3-textbook/3l3_V2.json"; // 三起 四上
import bookTextbook_start3_4_second from "./wys-from3-textbook/241111SCCL_002042267565986e341470001a5164f.json"; // 三起 四下
import bookTextbook_start3_5_first from "./wys-from3-textbook/3l5_V2.json"; // 三起 五上
import bookTextbook_start3_5_second from "./wys-from3-textbook/241112SCCL_002048367579bad105ccd0001178859.json"; // 三起 五下
import bookTextbook_start3_6_first from "./wys-from3-textbook/3l7_V2.json"; // 三起 六上
import bookTextbook_start3_6_second from "./wys-from3-textbook/241112SCCL_00204626756c4671887c90001242e2d.json"; // 三起 六下
import mj_3_s from "./minjiao-textbook/3_s.json";
import mj_3_x from "./minjiao-textbook/3_x.json";
import mj_4_s from "./minjiao-textbook/4_s.json";
import mj_4_x from "./minjiao-textbook/4_x.json";
import mj_5_s from "./minjiao-textbook/5_s.json";
import mj_5_x from "./minjiao-textbook/5_x.json";
import mj_6_s from "./minjiao-textbook/6_s.json";
import mj_6_x from "./minjiao-textbook/6_x.json";
import mj_3_s_chapters from "./minjiao-chapter/3_s_chapters.json";
import mj_3_x_chapters from "./minjiao-chapter/3_x_chapters.json";
import mj_4_s_chapters from "./minjiao-chapter/4_s_chapters.json";
import mj_4_x_chapters from "./minjiao-chapter/4_x_chapters.json";
import mj_5_s_chapters from "./minjiao-chapter/5_s_chapters.json";
import mj_5_x_chapters from "./minjiao-chapter/5_x_chapters.json";
import mj_6_s_chapters from "./minjiao-chapter/6_s_chapters.json";
import mj_6_x_chapters from "./minjiao-chapter/6_x_chapters.json";

// 引入 Icon 组件
// import Icon from "@/components/Icon.vue";
const {
  fetchBooks: fetchTextbooks, // 重命名避免冲突
  filteredBooks: books,
} = useTextbookSelector();

const isPopupOpen = ref(false);
const bookSelectors = ref(null);
const book = ref({
  book_id: "",
  book_name: "",
  grade: "",
  icon_url: "",
  subject_id: 0,
  term: "",
  version_type: "",
});

// 添加上传方法
const uploadPages = async () => {
  try {
    // const book1Id = "1l1_V2";   //一年级上
    // const book2Id = "1l2_V2"; // 一年级下
    // const book3Id = "1l3_V2"; // 二年级上
    // const book4Id = "241113SCCL_002052267526682daa78f0001151d8c"; // 二年级下
    // const book5Id = "1l5_V2"; // 三年级上
    // const book6Id = "241113SCCL_002055767579a011887c90001a3978a"; // 三年级下
    // const book7Id = "1l7_V2"; // 四年级上
    // const book8Id = "241113SCCL_00206046756bcbddaa78f0001c8efbd"; // 四年级下
    // const book9Id = "1l9_V2"; // 五年级上
    // const book10Id = "241115SCCL_00206486756c09f105ccd000197c45e"; // 五年级下
    // const book11Id = "1l11_V2"; // 六年级上
    // const book12Id = "241115SCCL_0020690675796941887c900019f87a4"; // 六年级下
    const bookIds = [
      // '3l1_V2',
      // '3l2_V2',
      // '3l3_V2',
      // "241111SCCL_002042267565986e341470001a5164f",
      // '3l5_V2',
      // '241112SCCL_002048367579bad105ccd0001178859',
      // '3l7_V2',
      // '241112SCCL_00204626756c4671887c90001242e2d',
      "3_s",
      "3_x",
      "4_s",
      "4_x",
      "5_s",
      "5_x",
      "6_s",
      "6_x",
    ];
    const bookTextbooks = [
      // bookTextbook_start3_3_first,
      // bookTextbook_start3_3_second,
      // bookTextbook_start3_4_first,
      // bookTextbook_start3_4_second,
      // bookTextbook_start3_5_first,
      // bookTextbook_start3_5_second,
      // bookTextbook_start3_6_first,
      // bookTextbook_start3_6_second,
      mj_3_s,
      mj_3_x,
      mj_4_s,
      mj_4_x,
      mj_5_s,
      mj_5_x,
      mj_6_s,
      mj_6_x,
    ];
    // 显示加载提示
    uni.showLoading({
      title: "正在上传...",
    });
    // ******** 注意需要放开下面的章节进行上传 ****************

    // 调用已有的 createTextbookPages 方法
    // const response = await textbook.createTextbookPages(
    //   book1Id,
    //   bookPages1
    // );
    // const response2 = await textbook.createTextbookPages(
    //   book2Id,
    //   bookPages2
    // );
    // const response3 = await textbook.createTextbookPages(
    //   book3Id,
    //   bookPages3
    // );
    // const response4 = await textbook.createTextbookPages(
    //   book4Id,
    //   bookPages4
    // );
    // const response5 = await textbook.createTextbookPages(
    //   book5Id,
    //   bookPages5
    // );
    // const response6 = await textbook.createTextbookPages(
    //   book6Id,
    //   bookPages6
    // );
    // const response7 = await textbook.createTextbookPages(
    //   book7Id,
    //   bookPages7
    // );
    // const response8 = await textbook.createTextbookPages(
    //   book8Id,
    //   bookPages8
    // );
    // const response9 = await textbook.createTextbookPages(
    //   book9Id,
    //   bookPages9
    // );
    // const response10 = await textbook.createTextbookPages(
    //   book10Id,
    //   bookPages10
    // );
    // const response11 = await textbook.createTextbookPages(
    //   book11Id,
    //   bookPages11
    // );
    // const response12 = await textbook.createTextbookPages(
    //   book12Id,
    //   bookPages12
    // );
    for (let i = 0; i < bookIds.length; i++) {
      const bookId = bookIds[i];
      const bookTextbook = bookTextbooks[i];
      const response = await textbook.createTextbookPages(bookId, bookTextbook);
    }
    uni.hideLoading();
    uni.showToast({
      title: "上传成功",
      icon: "success",
      duration: 2000,
    });
  } catch (err) {
    // 隐藏加载提示
    uni.hideLoading();

    console.error("上传失败:", err);
    uni.showToast({
      title: "上传失败",
      icon: "error",
      duration: 2000,
    });
  }
};

const uploadChapters = async () => {
  try {
    // const bookId1 = '1l1_V2'
    // const bookId2 = '1l2_V2'
    // const bookId3 = '1l3_V2'
    // const bookId4 = '241113SCCL_002052267526682daa78f0001151d8c'
    // const bookId5 = '1l5_V2'
    // const bookId6 = '241113SCCL_002055767579a011887c90001a3978a'
    // const bookId7 = '1l7_V2'
    // const bookId8 = '241113SCCL_00206046756bcbddaa78f0001c8efbd'
    // const bookId9 = '1l9_V2'
    // const bookId10 = '241115SCCL_00206486756c09f105ccd000197c45e'
    // const bookId11 = '1l11_V2'
    // const bookId12 = '241115SCCL_0020690675796941887c900019f87a4'
    const bookIds = [
      // "3l1_V2",
      // "3l2_V2",
      // "3l3_V2",
      // "241111SCCL_002042267565986e341470001a5164f",
      // "3l5_V2",
      // "241112SCCL_002048367579bad105ccd0001178859",
      // "3l7_V2",
      // "241112SCCL_00204626756c4671887c90001242e2d",
      "3_s",
      "3_x",
      "4_s",
      "4_x",
      "5_s",
      "5_x",
      "6_s",
      "6_x",
    ];

    const bookChapters = [
      // bookChapters_start3_3_first,
      // bookChapters_start3_3_second,
      // bookChapters_start3_4_first,
      // bookChapters_start3_4_second,
      // bookChapters_start3_5_first,
      // bookChapters_start3_5_second,
      // bookChapters_start3_6_first,
      // bookChapters_start3_6_second,
      mj_3_s_chapters,
      mj_3_x_chapters,
      mj_4_s_chapters,
      mj_4_x_chapters,
      mj_5_s_chapters,
      mj_5_x_chapters,
      mj_6_s_chapters,
      mj_6_x_chapters,
    ];
    // 显示加载提示
    uni.showLoading({
      title: "正在上传章节...",
    });
    for (let i = 0; i < bookIds.length; i++) {
      const bookId = bookIds[i];
      const bookChapter = bookChapters[i];
      // 调用 API 上传章节
      const response = await textbook.createTextbookChapters(
        bookId,
        bookChapter
      );
    }
    // const response2 = await textbook.createTextbookChapters(
    //   bookId2,
    //   bookChapters2
    // )
    // const response3 = await textbook.createTextbookChapters(
    //   bookId3,
    //   bookChapters3
    // )
    // const response4 = await textbook.createTextbookChapters(
    //   bookId4,
    //   bookChapters4
    // )
    // const response5 = await textbook.createTextbookChapters(
    //   bookId5,
    //   bookChapters5
    // )
    // const response6 = await textbook.createTextbookChapters(
    //   bookId6,
    //   bookChapters6
    // )
    // const response7 = await textbook.createTextbookChapters(
    //   bookId7,
    //   bookChapters7
    // )
    // const response8 = await textbook.createTextbookChapters(
    //   bookId8,
    //   bookChapters8
    // )
    // const response9 = await textbook.createTextbookChapters(
    //   bookId9,
    //   bookChapters9
    // )
    // const response10 = await textbook.createTextbookChapters(
    //   bookId10,
    //   bookChapters10
    // )
    // const response11 = await textbook.createTextbookChapters(
    //   bookId11,
    //   bookChapters11
    // )
    // const response12 = await textbook.createTextbookChapters(
    //   bookId12,
    //   bookChapters12
    // )
    // 隐藏加载提示
    uni.showToast({
      title: "章节上传成功",
      icon: "success",
      duration: 2000,
    });
  } catch (err) {
    // 隐藏加载提示
    uni.hideLoading();

    console.error("上传章节失败:", err);
    uni.showToast({
      title: "上传章节失败",
      icon: "error",
      duration: 2000,
    });
  }
};

const togglePopup = () => {
  console.log("删除");
  isPopupOpen.value = false;
};

// 组件挂载时获取数据
onMounted(() => {
  console.log(books.value, "书籍数据");

  fetchBooks(false);
});

const switchbookSuccess = (newbook) => {
  console.log("newbook=====");
  console.log(newbook);
  book.value = { ...newbook };
  console.log(book.value.term);
};

const switchBook = () => {
  if (books.value.length) {
    isPopupOpen.value = true;
    // 使用 nextTick 确保 DOM 已经更新并且子组件已经挂载
    nextTick(() => {
      if (
        bookSelectors.value &&
        typeof bookSelectors.value.showPopup === "function"
      ) {
        bookSelectors.value.showPopup(); // 调用子组件的方法
      }
    });
  } else {
    fetchBooks(true);
  }
};

// 从接口获取数据
const fetchBooks = async (isSwitch) => {
       try {
        await fetchTextbooks();
         console.log(books.value, "书籍数据")
        // 处理切换教材逻辑
        if (isSwitch) {
            isPopupOpen.value = true;
            nextTick(() => {
                if (bookSelectors.value?.showPopup) {
                    bookSelectors.value.showPopup();
                }
            });
        } else {
			
			
            // 设置默认教材（需要确保 books 是响应式引用）
            if (books.value.length > 0) {
				
				uni.getStorage({
				  key: 'bookSelectionObject', // 存储的键名
				  success: (res) => {
				    // console.log('获取的数据:', res.data);
					var bookSelectionObject = res.data
					// var selectedVersion = bookSelectionObject.version_type
					// var selectedGrade = bookSelectionObject.grade
					// var selectedTerm = bookSelectionObject.term
					// var selectedPublisher = bookSelectionObject.publisher
					var  selectedbook_id = bookSelectionObject.book_id
					
					
					
					// book.value = books.value.find(item => 
					//   item.version_type === selectedVersion &&
					//   item.grade === selectedGrade &&
					//   item.term === selectedTerm &&
					//   item.publisher === selectedPublisher &&
					//   item.book_id === selectedbook_id
					// );
					book.value = books.value.find(item =>
					  item.book_id === selectedbook_id
					);
					
				  },
				  fail: (err) => {
				    console.error('获取数据失败:', err);
					 book.value = { ...books.value[0] };
				  }
				});
				
	
               
            }
        }
      } catch (err) {
        console.error("Failed to fetch books:", err);
        uni.showToast({
          title: "获取教材列表失败",
          icon: "error",
        });
      }
}

// 修改分享方法
import WxShare from "@/utils/wxShare";

// 修改分享方法
const shareToClass = async () => {
  try {
    await WxShare.init({
      title: `【班级共享】${book.value.book_name}`,
      desc: `正在学习《${book.value.book_name}》教材`,
      imgUrl: book.value.icon_url,
      success: () => {
        uni.showToast({
          title: "分享成功",
          icon: "success",
        });
      },
      cancel: () => {
        uni.showToast({
          title: "取消分享",
          icon: "none",
        });
      },
    });
  } catch (error) {
    uni.showToast({
      title: "分享失败",
      icon: "none",
    });
  }
};
const textbookListen = () => {
  uni.navigateTo({
    url: `/pages/textbook/TextbookListen?book_id=${book.value.book_id}`,
  });
};

const sentenceFollow = () => {
  uni.navigateTo({
    url: `/pages/textbook/TextbookListen?book_id=${book.value.book_id}&repeat_after=true`,
  });
};

const reciteTest = () => {
  console.log("Recite Test");
};

const vocabularyReinforcement = () => {
  console.log("Learn Words");
  const objStr = JSON.stringify(book.value);
  uni.setStorage("currentBook", objStr);

  uni.navigateTo({
    url: `/pages/textbook/Learnwords?objId=currentBook`,
  });
};

const listenWrite = () => {
  console.log("Text Point Read");
  uni.navigateTo({
    url: `/pages/textbook/books?book_id=${book.value.book_id}`,
  });
};

// 背单词入口
const wordRecitationHomeclick = () => {
  uni.navigateTo({
    url: `/pages/textbook/WordRecitationHome`,
  });
};

//我的生词本
const newWordbookclick = () => {
  uni.navigateTo({
    url: `/pages/textbook/newWordbook`,
  });
};

const wordTricks = () => {
  console.log("Word Tricks");
};

const earTraining = () => {
  uni.navigateTo({
    url: `/pages/textbook/Learnwords?bookId=${book.value.book_id}&wordmode=1`,
  });
};

const pronunciationTest = () => {
  console.log("Pronunciation Test");
  uni.navigateTo({
    url: `/pages/textbook/Learnwords?bookId=${book.value.book_id}&wordmode=2`,
  });
};

const wordListenWrite = () => {
  console.log("Word Listen Write");
  uni.navigateTo({
    url: `/pages/textbook/Learnwords?bookId=${book.value.book_id}&wordmode=3`,
  });
};

const eliminationGame = () => {
  console.log("Elimination Game");
};
</script>

<style scoped lang="less">
.container {
  // background-color: #59C160;
  background: linear-gradient(to bottom, #59c160 0%, #f8f9fa 100%);
  padding-top: 10px;
  height: 100vh;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
  margin: 60rpx 30rpx;
}

.title {
  font-size: 20px;
  color: #fff;
  margin-bottom: 10px;
  width: 100%;
}

.subtitle {
  font-size: 20px;
  color: #408f4c;
  margin-bottom: 10px;
  width: 100%;
}
.highlight-text {
  font-size: 25px;
  /* background-color: #5cb85c; */
  /* padding: 5px 10px; */
  border-radius: 10px;

  color: #408f4c; /* 文字颜色 */

  /* 使用 text-shadow 创建描边效果 */
  text-shadow: -1px -1px 0 #fff, /* 左上角 */ 1px -1px 0 #fff,
    /* 右上角 */ -1px 1px 0 #fff, /* 左下角 */ 1px 1px 0 #fff; /* 右下角 */
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
  background-color: #5ecb80;
  padding: 10px;
  border-radius: 5px;
}

.book-info {
  display: flex;
  align-items: center;
  /* margin-bottom: 20px; */
  /* background-color: red; */
  width: 100%;
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
  line-height: 40rpx;
  font-size: 26rpx;
  color: #fff;
  margin-left: 10rpx;
}
.book-buttons {
  height: 74px;
  display: flex;
  justify-content: space-between;
}
.book-buttons .qiuhuan {
  margin-top: 30rpx;
  background-color: #fff;
  color: #6fdba7;
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 40rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
}

.book-buttons .fenxiang {
  margin-top: 30rpx;
  background-color: #fbe6ce;
  color: #e6a65d;
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 40rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
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
.button-tittwo {
  padding-top: 5px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: grey;
  justify-content: space-between;
}
.button-tittwoItem {
  padding-top: 5px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: grey;
}
.button-tittwoItemright {
  padding-top: 10rpx;
  display: flex;
  align-items: center;
  font-size: 30rpx;
  color: #ea9518;
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
  background-color: #f4fff5;
  border-radius: 10px;
  margin: 30rpx 0;
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
    margin: 0 15rpx;
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
    box-shadow: 0 0.5px 3px rgba(0, 0, 0, 0.1); /* 添加阴影效果，可根据需要调整 */
    padding-bottom: 15px;
    .recitation-tit {
      margin: 0 15px;
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
        background-color: #ee6838;
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
