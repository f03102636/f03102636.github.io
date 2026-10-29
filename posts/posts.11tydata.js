// posts 資料夾裡每篇文章的共用設定
export default {
  layout: "layouts/post.njk",
  eleventyComputed: {
    // draft: true 的文章不會發布
    permalink: (data) => (data.draft ? false : `/posts/${data.page.fileSlug}/`),
    // 科目或生活分類的文章要密碼；想手動指定就在文章開頭寫 lock: true 或 lock: false
    locked: (data) =>
      typeof data.lock === "boolean"
        ? data.lock
        : (data.tags || []).some((t) => (data.lockTags || []).includes(t)),
  },
};
