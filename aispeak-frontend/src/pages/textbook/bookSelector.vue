<template>
  <view>
    <!-- 蒙版 -->
    <view class="mask" @tap="closePopup"></view>

    <!-- 弹窗内容 -->
    <view :class="['popup-container', { 'slide-in': isPopupVisible }]" @tap.stop>
      <!-- 头部筛选区 -->
      <view class="filter-container">
        <view class="filter-section">
          <text class="filter-title">版本</text>
          <scroll-view class="filter-row" scroll-x>
            <view class="filter-list">
              <view
                v-for="(item, index) in versions"
                :key="index"
                :class="['filter-item', selectedVersion === item ? 'active' : '']"
                @tap="selectedVersion = item"
              >
                {{ item }}
              </view>
            </view>
          </scroll-view>
        </view>

        <view class="filter-section">
          <text class="filter-title">年级</text>
          <scroll-view class="filter-row" scroll-x>
            <view class="filter-list">
              <view
                v-for="(grade, index) in grades"
                :key="index"
                :class="['filter-item', selectedGrade === grade ? 'active' : '']"
                @tap="selectedGrade = grade"
              >
                {{ grade }}
              </view>
            </view>
          </scroll-view>
        </view>

        <view class="filter-section">
          <text class="filter-title">册次</text>
          <scroll-view class="filter-row" scroll-x>
            <view class="filter-list">
              <view
                v-for="(term, index) in terms"
                :key="index"
                :class="['filter-item', selectedTerm === term ? 'active' : '']"
                @tap="selectedTerm = term"
              >
                {{ term }}
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 新增出版社筛选 -->
        <view class="filter-section">
          <text class="filter-title">出版社</text>
          <scroll-view class="filter-row" scroll-x>
            <view class="filter-list">
              <view
                v-for="(publisher, index) in publishers"
                :key="index"
                :class="['filter-item', selectedPublisher === publisher ? 'active' : '']"
                @tap="selectedPublisher = publisher"
              >
                {{ publisher }}
              </view>
            </view>
          </scroll-view>
        </view>
      </view>

      <!-- 书籍列表 -->
      <view class="book-grid">
        <view
          v-for="(book, index) in filteredBooks"
          :key="index"
          class="book-card"
          @tap="goToCourse(book)"
        >
          <image :src="book.icon_url" mode="aspectFit" class="book-cover" />
          <view class="book-info">
            <text class="book-title">{{ book.book_name }}</text>
            <text class="book-subtitle">{{ book.grade }} {{ book.term }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, defineEmits } from "vue";

const emit = defineEmits();

const props = defineProps({
  books: {
    type: Array,
    default: () => [],
  },
  numType: {
	  type: Number, // JavaScript 中没有单独的 Int 类型，使用 Number
		default: 0,   // 默认值为 0
  }
  
});

// 控制弹窗显示状态
const isPopupVisible = ref(true);

// 显示弹窗方法
const showPopup = () => {
  isPopupVisible.value = true;
};

// 将方法暴露给父组件
defineExpose({
  showPopup,
});

// 关闭弹窗方法
const closePopup = () => {
  isPopupVisible.value = false;
  emit("closePopup");
};

// 版本、年级、册次和出版社选项
const versions = ref(["全部", "PEP", "精通", "新起点", "外研社（一起）", "外研社（三起）", "闽教版", "大同"]);
const grades = ref([
  "全部",
  "一年级",
  "二年级",
  "三年级",
  "四年级",
  "五年级",
  "六年级",
  "七年级",
  "八年级",
  "九年级",
]);
const terms = ref(["全部", "上册", "下册", "全一册"]);
const publishers = ref(["全部", "人教版", "外研社", "福建教育出版社"]); // 新增出版社选项

// 当前选中的版本、年级、册次和出版社
const selectedVersion = ref("全部");
const selectedGrade = ref("全部");
const selectedTerm = ref("全部");
const selectedPublisher = ref("全部"); // 新增出版社选中状态

// 根据选中的版本、年级、册次和出版社过滤书籍
const filteredBooks = computed(() => {
  return props.books.filter((book) => {
    const matchVersion =
      selectedVersion.value === "全部" ||
      book.version_type === selectedVersion.value;
    const matchGrade =
      selectedGrade.value === "全部" || book.grade === selectedGrade.value;
    const matchTerm =
      selectedTerm.value === "全部" || book.term === selectedTerm.value;
    const matchPublisher =
      selectedPublisher.value === "全部" || book.publisher === selectedPublisher.value; // 新增出版社匹配条件
    return matchVersion && matchGrade && matchTerm && matchPublisher;
  });
});

// 组件挂载时获取数据
onMounted(() => {
	
	console.log("props.numType")
	console.log(props.numType)
	
	if (props.numType == 0) {
		uni.getStorage({
		  key: 'bookSelectionObject', // 存储的键名
		  success: (res) => {
		    console.log('获取的数据:', res.data);
			var bookSelectionObject = res.data
			selectedVersion.value = bookSelectionObject.version_type
			selectedGrade.value = bookSelectionObject.grade
			selectedTerm.value = bookSelectionObject.term
			selectedPublisher.value = bookSelectionObject.publisher
		  },
		  fail: (err) => {
		    console.error('获取数据失败:', err);
		  }
		});
	} else {
		uni.getStorage({
		  key: 'planSelectionObject', // 存储的键名
		  success: (res) => {
		    console.log('获取的数据:', res.data);
			var bookSelectionObject = res.data
			selectedVersion.value = bookSelectionObject.version_type
			selectedGrade.value = bookSelectionObject.grade
			selectedTerm.value = bookSelectionObject.term
			selectedPublisher.value = bookSelectionObject.publisher
		  },
		  fail: (err) => {
		    console.error('获取数据失败:', err);
		  }
		});
	}
	
});

// 添加跳转到课程页面的方法
const goToCourse = (book) => {
	if (props.numType == 0) { 
		var bookSelectionObject = {
			version_type:selectedVersion.value,
			grade:selectedGrade.value,
			term:selectedTerm.value,
			publisher:selectedPublisher.value,
			book_id:book.book_id
		}
		
		uni.setStorage({
		  key: 'bookSelectionObject',
		  data: bookSelectionObject,
		  success: () => {
		    console.log('数据已存储');
			emit("switchbookSuccess", book);
			closePopup();
		  },
		  fail: (err) => {
		    console.error('存储失败:', err);
		  }
		});
	} else {
		
		var bookSelectionObject = {
			version_type:selectedVersion.value,
			grade:selectedGrade.value,
			term:selectedTerm.value,
			publisher:selectedPublisher.value,
			book_id:book.book_id
		}
		
		uni.setStorage({
		  key: 'planSelectionObject',
		  data: bookSelectionObject,
		  success: () => {
		    console.log('数据已存储');
			emit("switchbookSuccess", book);
			closePopup();
		  },
		  fail: (err) => {
		    console.error('存储失败:', err);
		  }
		});
		
	}
	
	
};
</script>


<style scoped>
/* 蒙版 */
.mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* 弹窗容器 */
.popup-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  /*  min-height: 80vh;*/
  /* max-height: 80vh; /* 设置最大高度为视口高度的80% */
  height: 80vh; /* 设置高度为视口高度的80% */
  background-color: #ffffff;
  border-top-left-radius: 20rpx;
  border-top-right-radius: 20rpx;
  padding: 20rpx;
  overflow-y: auto;
  transform: translateY(100%); /* 初始状态下完全位于屏幕下方 */
  transition: transform 0.3s ease-out;
  z-index: 1000;
}

/* 弹窗显示时的样式 */
.popup-container.slide-in {
  transform: translateY(0); /* 显示时移回原位 */
}

/* 其他样式保持不变 */
.filter-container {
  background-color: #ffffff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #eee;
}

.filter-section {
  margin-bottom: 20rpx;
}

.filter-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.filter-row {
  white-space: nowrap;
}

.filter-list {
  display: inline-flex;
  padding: 10rpx 0;
}

.filter-item {
  display: inline-block;
  padding: 10rpx 40rpx;
  margin-right: 20rpx;
  font-size: 28rpx;
  color: #333;
  border-radius: 30rpx;
  background-color: #f5f5f5;
}

.filter-item.active {
  background-color: #4caf50;
  color: #fff;
}

.book-grid {
  padding: 20rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.book-card {
  width: 48%;
  background-color: #ffffff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.book-cover {
  width: 100%;
  height: 300rpx;
  background-color: #f8f8f8;
}

.book-info {
  padding: 20rpx;
}

.book-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 10rpx;
  display: block;
}

.book-subtitle {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
  display: block;
}
</style>