// 帶這些標籤的文章需要密碼：所有科目標籤＋生活分類
import { readFileSync } from "node:fs";
import life from "./life.js";
const plan = JSON.parse(readFileSync(new URL("./plan.json", import.meta.url), "utf8"));
export default [...plan.subjects.map((s) => s.tag), ...life.map((l) => l.name)];
