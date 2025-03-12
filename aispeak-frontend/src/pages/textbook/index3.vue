<template>
  <view class="container">
    <!-- 头部 -->
    <view class="header">
      <view class="book-info">
		  <view class="qiuhuan" @click="switchCatalogue">
		  	<view>目录选择</view> 
		  	<image
		  	  class="qiuhuan-icon"
		  	  src="@/assets/icons/parallel_double_arrow.svg"
		  	></image>
		  </view>
		  <view>积分：{{user_info.points}}</view>
        <view class="qiuhuan" @click="switchBook">
			<view>{{ book.grade }} {{ book.term }}</view> 
			<image
			  class="qiuhuan-icon"
			  src="@/assets/icons/parallel_double_arrow.svg"
			></image>
		</view>
      </view>
    </view>
    <!-- 功能按钮区域 -->
	<scroll-view class="book-content"
	scroll-y
	:scroll-into-view="scrollToUnitId"
	>
		
		<view class="book-unit" :id="'unit-' + index" v-for="(chapter, index) in chapters">
			<view class="book-one">
				<view class="leftcontent">
				  <image :src="book.icon_url" class="book-cover" />
				</view>
				<view class="rightcontent">
					<view class="topclass">{{chapter.title}}</view>
					<view class="bottomclass">
						<view class="worditem" v-for="word in chapter.words">
							{{word.word}}
						</view>
					</view>
				</view>
			</view>
			<template v-if="chapter.isExpansion==1">
				<view @tap="unitwordclick(chapter)" class="recitewords">
					<view class="leftclass">
						<view class="tit">背单词</view>
						<view class="subtit">学-练-拼，掌握听说读写</view>
					</view>
					<image class="right-icon" :src="chapter.is_learning_word==1 ? selectIcon : unselectIcon"></image>
				</view>
				<view v-if="chapter.is_learning_word==1" class="readtextone">
					<view class="leftclass">
						<view class="tit">读课文</view>
						<view class="subtit">趣味配音，告别死记硬背</view>
					</view>
					<image class="right-icon" :src="chapter.is_learning_text==1 ? selectIcon : unselectIcon"></image>
				</view>
				<view v-else class="readtexttwo">
					<view class="leftclass">
						<view class="tit">读课文</view>
						<view class="subtit">趣味配音，告别死记硬背</view>
					</view>
				</view>
				<view class="button-row">
					<view class="function-button" @click="sentenceFollow">
					    <image class="button-icon" src="@/assets/icons/repeat.svg"></image>
					    句子跟读
					</view>
					<view class="function-button" @click="textbookListen">
					  <image class="button-icon" src="@/assets/icons/listening.svg"></image>
					  听课文
					</view>
					<view class="function-button" @tap="wordListenWrite(chapter)">
					  <image
					    class="button-icon"
					    src="@/assets/icons/word_dictation.svg"
					  ></image>
					  单词听写
					</view>
				</view>
			</template>
			
		</view>
	
		
	</scroll-view>
	
    <bookSelector
      ref="bookSelectors"
      v-if="isPopupOpen"
      :books="books"
      @switchbookSuccess="switchbookSuccess"
      @closePopup="togglePopup"
    />
	<CatalogueSelector
	  ref="catalogueSelectors"
	  :book="book"
	  :chapters="chapters"
	  @selectCatalogue="handleCatalogueSelect"
	  @closePopup="toggleCataloguePopup"
	/>
  </view>
</template>

<script setup>
import { ref, nextTick, onMounted, Text,watch,onUnmounted } from "vue";
import bookSelector from "./bookSelector.vue"
import CatalogueSelector from "./CatalogueSelector.vue"
import env from "@/config/env"; // 导入 env.ts

const baseUrl = env.basePath; // 获取
import textbook from "@/api/textbook";
import useTextbookSelector from "@/hooks/useTextbookSelector";

import selectIcon from '@/assets/icons/complete_h.svg';
import unselectIcon from '@/assets/icons/go_h.svg';
  

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
const chapters = ref([])
const isCataloguePopupOpen = ref(false);
const catalogueSelectors = ref(null);
const scrollToUnitId = ref('')

const user_info = ref({
	points:0
})
// 监听 book_id 的变化
watch(
  () => book.value.book_id, // 监听 book.value.book_id
  (newBookId, oldBookId) => {
    if (newBookId && newBookId !== oldBookId) {
      console.log("book_id 发生变化:", newBookId);
      textbookChapters(newBookId); // 调用获取教材章节的方法
    }
  }
);

// 组件挂载时获取数据
onMounted(() => {
  console.log(books.value, "书籍数据");

  fetchBooks(false);
  
  uni.$on('refrespoints', (params) => {
      console.log('收到全局事件，参数:', params);
      if (params.action === 'updatepoints') {
			textbookChapters(book.value.book_id)
      }
    });
  
});
onUnmounted(() => {
	uni.$off('refrespoints'); // 组件卸载时移除监听
})
const togglePopup = () => {
  console.log("删除");
  isPopupOpen.value = false;
};
const toggleCataloguePopup = () => {
  isCataloguePopupOpen.value = false;
};
const switchCatalogue = () => {
  isCataloguePopupOpen.value = true;
  nextTick(() => {
    if (catalogueSelectors.value?.openPopup) {
      catalogueSelectors.value.openPopup();
    }
  });
};
const handleCatalogueSelect = (index) => {
  // 更新章节的展开状态
  chapters.value = chapters.value.map((chapter, i) => ({
    ...chapter,
    isExpansion: i === index ? 1 : 0, // 当前 index 的 isExpansion 为 1，其他为 0
  }));
  scrollToUnitId.value = 'unit-' + index
};

const switchbookSuccess = (newbook) => {
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


const textbookChapters = async(bookId) => {
	 try {
	     const result = await textbook.getTextbookChapters(bookId); // 使用 await
		 
		 if (result.code == 1000) {
			var chapterarr= result.data.chapters.map((chapter, index) => {
			 return {
			   ...chapter,
			   isExpansion: index === 0 ? 1 : 0, // 第一个元素 isExpansion = 1，其他为 0
			 };
			});
			user_info.value = result.data.user_info
			 
			chapters.value = chapterarr;
			
			console.log("chapters.value")
			console.log(chapters.value)
		 }
		 
	     console.log("教材章节数据:", result);
	   } catch (error) {
	     console.error("获取章节失败:", error);
	   }
}

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



const unitwordclick = (chapter) => {
	const selectedWords = [];
	if (chapter.words.length>0) {
		chapter.words.forEach(word => {
		  selectedWords.push(word.word_id);
		});
		const sessionKey = 'selectedWords'; // 缓存键名
		let bookId = book.value.book_id
		let lessonId = chapter.lesson_id
		uni.setStorage({
			key: sessionKey,
			data: JSON.stringify(selectedWords),
			success: function () {

			uni.navigateTo({
			  url: `/pages/textbook/UnitwordConsolidation?sessionKey=${sessionKey}&bookId=${bookId}&lessonId=${lessonId}`, // 将缓存键名传递给学习页面
			});

			},
			fail: function (err) {
			console.log('数据存储失败', err);
			}
		});
		
	} else {
		uni.showToast({
		  title: "当前单元没有单词",
		  icon: "none",
		});
	}
	
	

};


const wordListenWrite = (chapter) => {
	const selectedWords = [];
	if (chapter.words.length>0) {
		chapter.words.forEach(word => {
		  selectedWords.push(word.word_id);
		});
		const sessionKey = 'selectedWords'; // 缓存键名
		let bookId = book.value.book_id
		uni.setStorage({
			key: sessionKey,
			data: JSON.stringify(selectedWords),
			success: function () {

			uni.navigateTo({
			  url: `/pages/textbook/WordDictation?sessionKey=${sessionKey}&bookId=${bookId}&wordmode=3`, // 将缓存键名传递给学习页面
			});

			},
			fail: function (err) {
			console.log('数据存储失败', err);
			}
		});
		
	} else {
		uni.showToast({
		  title: "当前单元没有单词",
		  icon: "none",
		});
	}
	
	

};

const eliminationGame = () => {
  console.log("Elimination Game");
};
</script>

<style scoped lang="less">

.container {
  background-color: #D5F0F1;
  // background: linear-gradient(to bottom, #59c160 0%, #f8f9fa 100%);
  padding-top: 10px;
  height:calc(100vh - 60px);
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  // margin: 60rpx 30rpx;
  margin: 0 30rpx;
  height: 80rpx;
}


.book-info {
  display: flex;
  align-items: center;
  /* margin-bottom: 20px; */
  // background-color: red;
  width: 100%;
  height: 100%;
  justify-content: space-between;
}
.qiuhuan {
  // margin-top: 30rpx;
  background-color: #FEF8E5;
  // color: #7A631F;
  color: #05c160;
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 40rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}
.qiuhuan-icon {
	height: 20rpx;
	width: 20rpx;
	margin-left: 20rpx;
}
.book-content {
	// height:calc(100% - 200rpx) ;
	height:calc(100% - 80rpx) ;
	// background-color: red;
	overflow-y: auto;
}
.book-unit {
	margin: 0 20rpx 20rpx 20rpx;
	background-color: #fff;
	border-radius: 20rpx;
	
}
.book-one {
	display: flex;
	justify-content: space-between;	
}

.leftcontent {
  width: 220rpx; /* 设置.leftcontent宽度为120px */
  display: flex;
  justify-content: center;
  align-items: center; /* 垂直居中 */
  padding: 20rpx 0;
}
.book-cover {
  // width: 180rpx;
  // height: 258rpx;
  width: 160rpx;
  height: 230rpx;
}
.rightcontent {
	// flex: 1;
	padding: 20rpx;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	width:calc(100% - 240rpx) ;
}
.topclass {
	font-size: 35rpx;
	font-weight: bold;
	// background-color: red;
	overflow: hidden; /* 超出内容隐藏 */
	display: -webkit-box; /* 启用弹性盒子布局 */
	-webkit-box-orient: vertical; /* 垂直排列 */
	-webkit-line-clamp: 2; /* 显示2行，超出部分省略 */
}
.bottomclass {
	// background-color: red;
	height: 30%;
	display: flex; /* 横向布局 */
	overflow-x: auto; /* 超出时左右滚动 */
	white-space: nowrap; /* 防止子元素换行 */
	gap: 20rpx; /* 可选：设置子元素之间的间距 */
	padding: 20rpx; /* 可选：添加内边距 */
	align-items: center;
	
}
.worditem {
	background-color: #f5f5f5;
	line-height: 30rpx;
	height: 30rpx;
	padding: 10rpx;
	border-radius: 8rpx;
}

.recitewords {
	background-color: #E5FEF1;
	display: flex;
	justify-content: space-between;
	color: #68748E;
	margin: 20rpx;
	margin-top: 0;
	border-radius: 20rpx;
	align-items: center;
}
.leftclass {
	padding: 30rpx;
	.tit {
		margin-left: 5rpx;
		font-size: 32rpx;
	}
	.subtit {
		margin-top: 10rpx;
		font-size: 25rpx;
	}
}
.right-icon {
	height: 100rpx;
	width: 100rpx;
	margin-right: 30rpx;
}
.readtextone {
	background-color: #E5FEF1;
	display: flex;
	justify-content: space-between;
	color: #68748E;
	margin: 20rpx;
	margin-top: 0;
	border-radius: 20rpx;
	align-items: center;
}
.readtexttwo {
	background-color: #f5f5f5;
	display: flex;
	justify-content: space-between;
	color: #68748E;
	margin: 20rpx;
	margin-top: 0;
	border-radius: 20rpx;
	align-items: center;
}
.button-row {
	margin: 20rpx;
	margin-top: 0;
	gap: 20rpx;
	display: flex;
	// background-color: red;
	padding-bottom: 20rpx;
	
}
.function-button {
  background-color: #f5f5f5;
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

</style>
