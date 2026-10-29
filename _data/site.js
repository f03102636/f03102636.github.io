// 網站基本資料：想改名稱、介紹文字，改這裡就好
export default {
  title: "菜菜的學習與生活",
  author: "菜菜",
  description: "菜菜的個人網站：十個科目的學習筆記、一年學習計畫，還有學習以外的生活。",

  // 橫幅標題下的小字
  subtitle: "學習與生活的紀錄",

  // 側欄大頭照：把照片上傳到 assets/img/，這裡填 "/assets/img/檔名.jpg"；留空會顯示植物插圖
  avatar: "",

  // 側欄自我介紹
  tagline: "正在準備研究所，學 AI、電路、專案管理和日文。這裡記錄學到的東西，還有學習以外的日子。",

  // 網址由 GitHub 部署時自動帶入，不用手動改
  url: (process.env.SITE_URL || "http://localhost:8080").replace(/\/$/, ""),
};
