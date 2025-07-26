<template>
  <view class="container">
    <!-- 头部 -->
	<!-- #ifdef H5 -->
	<view class="header" :style="{ paddingTop: statusBarHeight + 'px', height: '44px' }">
	  <view class="book-info"> 
		  <view class="qiuhuan" @click="switchCatalogue">
			<view>目录选择</view> 
			<image
			  class="qiuhuan-icon"
			  src="@/assets/icons/parallel_double_arrow.svg"
			></image>
		  </view>
		   <view>积分：{{user_info?.points}}</view>
		  <view class="qiuhuan" @click="switchBook">
			<view class="grade-term-text">{{ gradeTerm}}</view> 
			<image
			  class="qiuhuan-icon"
			  src="@/assets/icons/parallel_double_arrow.svg"
			></image>
		  </view>
	  </view>
	</view>
	<!-- #endif -->
	
	<!-- #ifdef MP-WEIXIN -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 'px', height: '84px' }">
      <view class="book-info"> 
		  <view>积分：{{user_info?.points}}</view>
      </view>
	  <view class="book-bottom">
		  <view class="qiuhuan" @click="switchCatalogue">
		  	<view>目录选择</view> 
		  	<image
		  	  class="qiuhuan-icon"
		  	  src="@/assets/icons/parallel_double_arrow.svg"
		  	></image>
		  </view>
		  <view class="qiuhuan" @click="switchBook">
		  	<view class="grade-term-text">{{gradeTerm}}</view> 
		  	<image
		  	  class="qiuhuan-icon"
		  	  src="@/assets/icons/parallel_double_arrow.svg"
		  	></image>
		  </view>
	  </view>
    </view>
	<!-- #endif -->
    <!-- 功能按钮区域 -->
	<scroll-view class="book-content"
	scroll-y
	:scroll-into-view="scrollToUnitId"
	>
		
		<view class="book-unit" :id="'unit-' + index" v-for="(chapter, index) in chapters">
			<view @tap="clickUnit(index)" class="book-one">
				<view class="leftcontent">
				  <image :src="book.icon_url" class="book-cover" />
				</view>
				<view class="rightcontent">
					<view class="topclass">
						<view class="topleft">{{chapter.title}}</view>
						<template v-if="chapter.is_learning_text==1">
							<view v-if="chapter.isExpansion == 1" @tap="seereport(chapter)" class="topright">
							<view>学习</view>
							<view>报告</view>
							</view>
							<view v-else class="topright_notclick">
							<view>学习</view>
							<view>报告</view>
							</view>
						</template>
					</view>
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
				<view @tap="unitsentenceclick(chapter,1)" class="readtextone">
					<view class="leftclass">
						<view class="tit">句子跟读</view>
						<view class="subtit">告别死记硬背</view>
					</view>
					<image class="right-icon" :src="chapter.is_learning_text==1 ? selectIcon : unselectIcon"></image>
				</view>
				<view class="button-row">
					<view class="function-button"
					 style="background-color: #E5FEF1"
					 @click="textbookListen(chapter)">
					  <image class="button-icon" src="@/assets/icons/listening.svg"></image>
					  听课文
					</view>
					<view class="function-button"
					  style="background-color: #E5FEF1"
					 @tap="wordListenWrite(chapter)">
					  <image
					    class="button-icon"
					    src="@/assets/icons/word_dictation.svg"
					  ></image>
					  单词听写
					</view>
					<view class="function-button"
					 style="background-color: #E5FEF1"
					@click="sentenceFollow(chapter)">
					    <image class="button-icon" src="@/assets/icons/repeat.svg"></image>
					    课文点读
					</view>
				</view>
				
				<!-- 布置作业按钮 - 只有教师可见 -->
				<view v-if="isTeacher" class="assignment-section">
					<view class="assignment-button" @click="assignTask(chapter)">
						<image class="assignment-icon" src="@/assets/icons/preparation_book.svg"></image>
						<text class="assignment-text">布置作业</text>
					</view>
				</view>
			</template>
		</view>
		
		<view style="height: 20rpx;"></view>
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
import { ref, nextTick, onMounted, watch,onUnmounted,computed } from "vue";
import bookSelector from "./bookSelector.vue"
import CatalogueSelector from "./CatalogueSelector.vue"
import textbook from "@/api/textbook";
import useTextbookSelector from "@/hooks/useTextbookSelector";
import taskRequest from "@/api/task";

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

// 获取设备的安全区域高度
const statusBarHeight = ref(0);
const customBarHeight = ref(0);

const user_info = ref({
	points:0
})

// 检查用户是否是教师
const isTeacher = computed(() => {
  const userRole = uni.getStorageSync('userRole');
  return userRole === 'teacher';
});

const selectedChapter = ref(null);
const taskTypes = ref([
  { 
    value: 'spelling', 
    label: '背单词', 
    icon: '📚',
    description: '练习本单元单词记忆'
  },
  { 
    value: 'sentence_repeat', 
    label: '句子跟读', 
    icon: '🎤',
    description: '跟读本单元句子练习'
  },
  { 
    value: 'pronunciation', 
    label: '发音练习', 
    icon: '👂',
    description: '练习本单元发音'
  },
  { 
    value: 'dictation', 
    label: '单词听写', 
    icon: '✍️',
    description: '听写本单元单词'
  },
  { 
    value: 'quiz', 
    label: '单元测验', 
    icon: '📖',
    description: '本单元综合测验'
  }
]);
const selectedTaskType = ref(null);
const classes = ref([]);
const selectedClassId = ref('');
const deadlineDate = ref('');
const deadlineTime = ref('18:00');
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

// 添加计算属性
const gradeTerm = computed(() => {
  const { version_type, grade, term } = book.value;
  // 处理 term 显示
  let displayTerm = term;
  if (term.includes("上")) {
    displayTerm = "上";
  } else if (term.includes("下")) {
    displayTerm = "下";
  }
  // 否则保持原样

  // 组合最终字符串
  return `${version_type} ${grade} ${displayTerm}`;
});

// 组件挂载时获取数据
onMounted(() => {
	const systemInfo = uni.getSystemInfoSync();
	statusBarHeight.value = systemInfo.statusBarHeight || 0;
	customBarHeight.value = (systemInfo.statusBarHeight || 0) + 44; // 44 是导航栏的默认高度
	
  console.log(books.value, "书籍数据");
  
  fetchBooks(false);
  loadTeacherClasses(); // 加载班级列表
  
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

const clickUnit = (index) =>  {
	// 更新章节的展开状态
	chapters.value = chapters.value.map((chapter, i) => ({
	  ...chapter,
	  isExpansion: i === index ? 1 : 0, // 当前 index 的 isExpansion 为 1，其他为 0
	}));
}
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
  console.log(book.value);
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
					var bookSelectionObject = res.data
					var  selectedbook_id = bookSelectionObject.book_id
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

const textbookListen = (chapter) => {
	
	let lessonId = chapter.lesson_id
	
	uni.navigateTo({
	url: `/pages/textbook/TextbookListen?book_id=${book.value.book_id}&lessonId=${lessonId}`,
	});
};

const sentenceFollow = (chapter) => {
	uni.navigateTo({
		url: `/pages/textbook/books?book_id=${book.value.book_id}&repeat_after=true`,
	});
};

const seereport = (chapter) => {
	
	let bookargument = {
		publisher:book.value.publisher,
		book_name:book.value.book_name,
		grade:book.value.grade,
		term:book.value.term,
		title:chapter.title,
		bookId:book.value.book_id,
		lessonId:chapter.lesson_id,
	}
	
	uni.setStorage({
		key: "bookargument",
		data: bookargument,
		success: function () {
	
			uni.navigateTo({
				url: `/pages/textbook/UnitSummaryReport?bookargument=bookargument`,
			});
	
		},
		fail: function (err) {
		console.log('数据存储失败', err);
		}
	});
};

const unitsentenceclick = (chapter,num) => {
	if (num ==0) {
		uni.showToast({
		  title: "请先完成背单词",
		  icon: "none",
		});
	} else {
		
		uni.navigateTo({
		  url: `/pages/textbook/UnitSentenceRead?bookId=${book.value.book_id}&lessonId=${chapter.lesson_id}`,
		});
	}
}

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
	// if (chapter.is_learning_text != 1) {
	// 	uni.showToast({
	// 	  title: "请先完成课文跟读读",
	// 	  icon: "none",
	// 	});
	// 	return
	// }
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
			  url: `/pages/textbook/WordDictation?sessionKey=${sessionKey}&bookId=${bookId}&lessonId=${lessonId}&wordmode=4`, // 将缓存键名传递给学习页面
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

// 任务布置相关方法
const loadTeacherClasses = async () => {
  try {
    const user_id = uni.getStorageSync('user_id');
    if (!user_id) {
      console.log('用户未登录');
      return;
    }
    
    // 使用用户的账户ID作为教师ID
    const teacherId = user_id;
    console.log('使用教师ID:', teacherId);
    
    const res = await taskRequest.getTeacherClasses(teacherId);
    classes.value = res.data || [];
    console.log('获取到班级列表:', classes.value);
  } catch (error) {
    console.error('加载班级列表失败:', error);
    classes.value = [];
  }
};

const assignTask = (chapter) => {
  selectedChapter.value = chapter;
  
  // 检查是否有班级
  if (classes.value.length === 0) {
    uni.showModal({
      title: '提示',
      content: '您还没有创建任何班级，是否前往创建？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/class/create' });
        }
      }
    });
    return;
  }
  
  // 设置默认截止时间（明天18:00）
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  deadlineDate.value = tomorrow.toISOString().split('T')[0];
  
  // 显示任务类型选择
  showTaskTypeSelection();
};

const showTaskTypeSelection = () => {
  const taskTypeNames = taskTypes.value.map(type => type.label);
  
  uni.showActionSheet({
    itemList: taskTypeNames,
    success: (res) => {
      selectedTaskType.value = taskTypes.value[res.tapIndex];
      showClassSelection();
    }
  });
};

const showClassSelection = () => {
  const classNames = classes.value.map(cls => cls.name);
  
  uni.showActionSheet({
    itemList: classNames,
    success: (res) => {
      selectedClassId.value = classes.value[res.tapIndex].id;
      showDeadlineSelection();
    }
  });
};

const showDeadlineSelection = () => {
  uni.showModal({
    title: '设置截止时间',
    content: `任务类型：${selectedTaskType.value.label}
教材：${book.value.book_name}
单元：${selectedChapter.value.title}
班级：${classes.value.find(c => c.id === selectedClassId.value)?.name}

默认截止时间：明天18:00`,
    confirmText: '创建任务',
    cancelText: '修改时间',
    success: (res) => {
      if (res.confirm) {
        createTaskQuick();
      } else {
        // 跳转到任务创建页面进行详细设置
        navigateToTaskCreate();
      }
    }
  });
};

const createTaskQuick = async () => {
  try {
    uni.showLoading({ title: '创建中...' });
    
    // 验证必要数据
    if (!book.value.book_id || !selectedChapter.value?.lesson_id) {
      uni.hideLoading();
      uni.showToast({
        title: '教材信息不完整',
        icon: 'none'
      });
      console.error('教材信息缺失:', { book: book.value, chapter: selectedChapter.value });
      return;
    }
    
    const user_id = uni.getStorageSync('user_id');
    const deadline = `${deadlineDate.value}T${deadlineTime.value}:00`;
    
    // 根据任务类型准备内容
    const taskContents = prepareTaskContents();
    
    console.log('创建任务数据:', {
      book_id: book.value.book_id,
      lesson_id: selectedChapter.value.lesson_id,
      task_type: selectedTaskType.value.value
    });
    
    const taskData = {
      teacher_id: user_id,
      class_id: parseInt(selectedClassId.value),
      title: `${selectedTaskType.value.label} - ${selectedChapter.value.title}`,
      description: `${book.value.book_name} ${selectedChapter.value.title} ${selectedTaskType.value.description}`,
      task_type: selectedTaskType.value.value,
      subject: 'english',
      deadline: new Date(deadline).toISOString(),
      allow_late_submission: false,
      max_attempts: null,
      total_points: 100,
      textbook_id: String(book.value.book_id),
      lesson_id: parseInt(selectedChapter.value.lesson_id),
      contents: taskContents
    };
    
    const res = await taskRequest.createTask(taskData);
    
    uni.hideLoading();
    uni.showToast({
      title: '任务创建成功',
      icon: 'success'
    });
    
    console.log('任务创建成功:', res);
  } catch (error) {
    uni.hideLoading();
    console.error('创建任务失败:', error);
    uni.showToast({
      title: '创建失败',
      icon: 'error'
    });
  }
};

const prepareTaskContents = () => {
  const contents = [];
  
  // 根据任务类型和章节信息准备任务内容
  if (selectedTaskType.value.value === 'spelling' || selectedTaskType.value.value === 'dictation') {
    // 单词相关任务
    const selectedWordIds = selectedChapter.value.words?.map(word => word.word_id) || [];
    
    contents.push({
      content_type: selectedTaskType.value.value,
      generate_mode: selectedWordIds.length > 0 ? 'manual' : 'auto', // 有单词时手动，否则自动
      ref_book_id: String(book.value.book_id),
      ref_lesson_id: selectedChapter.value.lesson_id,
      selected_word_ids: selectedWordIds,
      selected_sentence_ids: [],
      points: 100,
      meta_data: {
        word_count: selectedWordIds.length,
        difficulty: 'normal'
      },
      order_num: 1
    });
  } else if (selectedTaskType.value.value === 'sentence_repeat' || selectedTaskType.value.value === 'pronunciation') {
    // 句子跟读任务 - 使用自动模式
    contents.push({
      content_type: selectedTaskType.value.value,
      generate_mode: 'auto', // 句子任务使用自动模式
      ref_book_id: String(book.value.book_id),
      ref_lesson_id: selectedChapter.value.lesson_id,
      selected_word_ids: [],
      selected_sentence_ids: [], // 自动模式会获取该课程的所有句子
      points: 100,
      meta_data: {
        lesson_title: selectedChapter.value.title
      },
      order_num: 1
    });
  } else {
    // 其他类型任务 - 默认使用自动模式
    contents.push({
      content_type: selectedTaskType.value.value,
      generate_mode: 'auto', // 默认使用自动模式
      ref_book_id: String(book.value.book_id),
      ref_lesson_id: selectedChapter.value.lesson_id,
      selected_word_ids: [],
      selected_sentence_ids: [],
      points: 100,
      meta_data: {
        lesson_title: selectedChapter.value.title
      },
      order_num: 1
    });
  }
  
  return contents;
};

const navigateToTaskCreate = () => {
  // 跳转到任务创建页面，带上预填信息
  const params = {
    textbook_id: book.value.book_id,
    lesson_id: selectedChapter.value.lesson_id,
    task_type: selectedTaskType.value.value,
    class_id: selectedClassId.value,
    title: `${selectedTaskType.value.label} - ${selectedChapter.value.title}`
  };
  
  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
    
  uni.navigateTo({
    url: `/pages/task/create?${queryString}`
  });
};
</script>

<style scoped lang="less">

.grade-term-text {
  white-space: nowrap;      /* 禁止换行 */
  overflow: hidden;         /* 隐藏超出部分 */
  text-overflow: ellipsis;  /* 显示省略号 */
  max-width: 200rpx;        /* 设置一个合适的最大宽度 */
}

.container {
  background-color: #D5F0F1;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  // margin: 60rpx 30rpx;
  margin: 0 30rpx;
  height: 80rpx;
}

  /* #ifdef H5 */
  
  .book-info {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    justify-content: space-between; 
  }
  .book-content {
  	height:calc(100vh - 120px);
  	overflow-y: auto;
  }
  
  /* #endif */

 /* #ifdef MP-WEIXIN */
 
 .book-info {
   display: flex;
   align-items: center;
   width: 100%;
   height: 37px;
   justify-content: center; 
 }
 .book-bottom {
 	display: flex;
 	align-items: center;
 	width: 100%;
 	height: 47px;
 	justify-content: space-between; 
 }
 .book-content {
 	height:calc(100vh - 160px) ;
 	overflow-y: auto;
 }
 /* #endif */

.qiuhuan {
  background-color: #FEF8E5;
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
	font-size: 30rpx;
	font-weight: bold;
	display: flex;
	justify-content: space-between;
	.topleft{
		flex: 1;
		overflow: hidden; /* 超出内容隐藏 */
		display: -webkit-box; /* 启用弹性盒子布局 */
		-webkit-box-orient: vertical; /* 垂直排列 */
		-webkit-line-clamp: 2; /* 显示2行，超出部分省略 */
	}
	.topright {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50rpx;
		background-color: #F8CF81;
		text-align: center;
		font-size: 25rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: #845627;
	}
	.topright_notclick {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50rpx;
		background-color: #FBEBCA;
		text-align: center;
		font-size: 25rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: #CEBAA4;
	}
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

.assignment-section {
  margin: 20rpx;
  margin-top: 0;
  padding-bottom: 20rpx;
}

.assignment-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15rpx;
  padding: 25rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 25rpx rgba(102, 126, 234, 0.3);
}

.assignment-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 15rpx;
  filter: brightness(0) invert(1);
}

.assignment-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
}

</style>
