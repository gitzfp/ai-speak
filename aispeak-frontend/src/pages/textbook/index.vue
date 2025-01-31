<template>
  <view class="container">
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
</template>

<script>
import { ref, computed, onMounted } from "vue"

export default {
  setup() {
    // 版本、年级和册次选项
    const versions = ref(["全部", "PEP", "精通", "新起点", "初中"])
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
    ])
    const terms = ref(["全部", "上册", "下册", "全一册"])

    // 当前选中的版本、年级和册次
    const selectedVersion = ref("全部")
    const selectedGrade = ref("全部")
    const selectedTerm = ref("全部")

    // 书籍数据
    const books = ref([])

    // 从接口获取数据
    const fetchBooks = () => {
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
          }
        },
        fail: (err) => {
          console.error("Failed to fetch books:", err)
        },
      })
    }

    // 根据选中的版本、年级和册次过滤书籍
    const filteredBooks = computed(() => {
      return books.value.filter((book) => {
        const matchVersion =
          selectedVersion.value === "全部" ||
          book.version_type === selectedVersion.value
        const matchGrade =
          selectedGrade.value === "全部" || book.grade === selectedGrade.value
        const matchTerm =
          selectedTerm.value === "全部" || book.term === selectedTerm.value
        return matchVersion && matchGrade && matchTerm
      })
    })

    // 组件挂载时获取数据
    onMounted(() => {
      fetchBooks()
    })

    // 立即购买按钮点击事件
    const handleBuy = (book) => {
      uni.showToast({
        title: `购买 ${book.book_name}`,
        icon: "none",
      })
    }

    // 添加跳转到课程页面的方法
    const goToCourse = (book) => {
      uni.navigateTo({
        url: `/pages/textbook/books?book_id=${book.book_id}`,
      })
    }

    return {
      versions,
      grades,
      terms,
      selectedVersion,
      selectedGrade,
      selectedTerm,
      filteredBooks,
      handleBuy,
      goToCourse, // 添加这一行
    }
  },
}
</script>

<style>
.container {
  padding: 0;
  background-color: #f5f5f5;
}

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

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  color: transparent;
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

.buy-btn {
  background-color: #ff6b6b;
  color: #ffffff;
  font-size: 26rpx;
  padding: 10rpx 0;
  border-radius: 30rpx;
  width: 100%;
  text-align: center;
  border: none;
}

.buy-btn:active {
  background-color: #ff5252;
}
</style>
