"use strict";const e=require("../../common/vendor.js"),o={setup(){const o=e.ref(["全部","PEP","精通","新起点","初中"]),t=e.ref(["全部","一年级","二年级","三年级","四年级","五年级","六年级","七年级","八年级","九年级"]),s=e.ref(["全部","上册","下册","全一册"]),r=e.ref("全部"),n=e.ref("全部"),a=e.ref("全部"),c=e.ref([]),d=e.computed((()=>c.value.filter((e=>{const o="全部"===r.value||e.version_type===r.value,t="全部"===n.value||e.grade===n.value,s="全部"===a.value||e.term===a.value;return o&&t&&s}))));e.onMounted((()=>{e.index.request({url:"https://diandu.mypep.cn/static/textbook/bookList_pep_click_subject_web_1_0_0.json",success:e=>{const o=e.data.booklist.find((e=>"英语"===e.subject_name));o&&(c.value=o.versions.flatMap((e=>e.textbooks)))},fail:e=>{console.error("Failed to fetch books:",e)}})}));return{versions:o,grades:t,terms:s,selectedVersion:r,selectedGrade:n,selectedTerm:a,filteredBooks:d,handleBuy:o=>{e.index.showToast({title:`购买 ${o.book_name}`,icon:"none"})},goToCourse:o=>{e.index.navigateTo({url:`/pages/textbook/books?book_id=${o.book_id}`})}}}};const t=e._export_sfc(o,[["render",function(o,t,s,r,n,a){return{a:e.f(r.versions,((o,t,s)=>({a:e.t(o),b:t,c:e.n(r.selectedVersion===o?"active":""),d:e.o((e=>r.selectedVersion=o),t)}))),b:e.f(r.grades,((o,t,s)=>({a:e.t(o),b:t,c:e.n(r.selectedGrade===o?"active":""),d:e.o((e=>r.selectedGrade=o),t)}))),c:e.f(r.terms,((o,t,s)=>({a:e.t(o),b:t,c:e.n(r.selectedTerm===o?"active":""),d:e.o((e=>r.selectedTerm=o),t)}))),d:e.f(r.filteredBooks,((o,t,s)=>({a:o.icon_url,b:e.t(o.book_name),c:e.t(o.grade),d:e.t(o.term),e:t,f:e.o((e=>r.goToCourse(o)),t)})))}}]]);wx.createPage(t);
