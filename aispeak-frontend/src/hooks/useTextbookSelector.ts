// hooks/useTextbookSelector.ts
import { ref, computed, watch } from "vue";
import textbook from "@/api/textbook";

// 定义教材类型
interface TextbookItem {
  book_id: string;
  book_name: string;
  version_type: string;
  grade: string;
  term: string;
  publisher?: string;
  icon_url?: string;
  subject_id?: number;
}

export default function useTextbookSelector() {
  // 筛选选项（新增出版社）
  const versions = ref(["全部", "PEP", "精通", "新起点", "外研社（一起）", "外研社（三起）", "闽教版", "大同"]);
  const grades = ref(["全部", "一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级"]);
  const terms = ref(["全部", "上册", "下册", "全一册"]);
  const publishers = ref(["全部", "人教版", "外研社", "福建教育出版社"]); // 新增出版社选项

  // 当前选中项（新增出版社选中状态）
  const selectedVersion = ref("全部");
  const selectedGrade = ref("全部");
  const selectedTerm = ref("全部");
  const selectedPublisher = ref("全部"); // 新增出版社选中状态

  // 教材数据
  const books = ref<TextbookItem[]>([]);
  
  // 过滤后的教材列表（增加出版社过滤逻辑）
  const filteredBooks = computed(() => {
      return books.value.filter(book => {
      const versionMatch = selectedVersion.value === '全部' || book.version_type === selectedVersion.value;
      const gradeMatch = selectedGrade.value === '全部' || book.grade === selectedGrade.value;
      const termMatch = selectedTerm.value === '全部' || book.term === selectedTerm.value;
      // 需要根据version_type映射到出版社
      console.log(selectedVersion.value, '版本类型', gradeMatch, '年级', termMatch, '学期')
      const publisherMatch = selectedPublisher.value === '全部' || selectedPublisher.value;
      return versionMatch && gradeMatch && termMatch && publisherMatch;
      });
  });


  // 在 useTextbookSelector.js 中修改
const fetchBooks = async () => {
    try {
        const response = await textbook.getTextbooks(
            selectedVersion.value,
            selectedGrade.value,
            selectedTerm.value,
            selectedPublisher.value
        );
        
        // 更健壮的数据处理
        books.value = response.data?.booklist?.[0]?.versions?.flatMap((v: any) => v.textbooks) || [];
        console.log(filteredBooks, '教材书籍', response.data?.booklist) 
    } catch (err) {
        console.error("获取教材失败:", err);
        throw err; // 抛出错误供组件捕获
    }
};

  // 监听所有筛选条件（新增出版社监听）
  watch(
    [selectedVersion, selectedGrade, selectedTerm, selectedPublisher],
    () => fetchBooks(),
    { immediate: true }
  );

  return {
    versions,
    grades,
    terms,
    publishers, // 暴露出版社选项
    selectedVersion,
    selectedGrade,
    selectedTerm,
    selectedPublisher, // 暴露出版社选中状态
    filteredBooks,
    fetchBooks
  };
}