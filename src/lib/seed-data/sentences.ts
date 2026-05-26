import type { Sentence } from "@/types/domain";

let _id = 0;
function sid(): string {
  return `s_${String(++_id).padStart(4, "0")}`;
}
function now(): number {
  return Date.now();
}

export const seedSentences: Sentence[] = [
  // ===== A1 (入门) — 20 句 =====
  { id: sid(), text: "Hello, how are you?", translation: "你好，你怎么样？", difficulty: "A1", source: "builtin", tags: ["greeting"], wordCount: 4, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "My name is Sarah.", translation: "我的名字是 Sarah。", difficulty: "A1", source: "builtin", tags: ["introduction"], wordCount: 4, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "I am from China.", translation: "我来自中国。", difficulty: "A1", source: "builtin", tags: ["introduction"], wordCount: 4, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "What time is it?", translation: "现在几点了？", difficulty: "A1", source: "builtin", tags: ["time"], wordCount: 4, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "It is three o'clock.", translation: "现在三点钟。", difficulty: "A1", source: "builtin", tags: ["time"], wordCount: 4, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "I like coffee and tea.", translation: "我喜欢咖啡和茶。", difficulty: "A1", source: "builtin", tags: ["food"], wordCount: 5, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "She has two cats.", translation: "她有两只猫。", difficulty: "A1", source: "builtin", tags: ["animals"], wordCount: 4, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "The book is on the table.", translation: "书在桌子上。", difficulty: "A1", source: "builtin", tags: ["objects"], wordCount: 6, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "We go to school every day.", translation: "我们每天去学校。", difficulty: "A1", source: "builtin", tags: ["daily-life"], wordCount: 6, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "Can you help me please?", translation: "请问你能帮我吗？", difficulty: "A1", source: "builtin", tags: ["request"], wordCount: 5, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "I have a big family.", translation: "我有一个大家庭。", difficulty: "A1", source: "builtin", tags: ["family"], wordCount: 5, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "Today is Monday.", translation: "今天是星期一。", difficulty: "A1", source: "builtin", tags: ["time"], wordCount: 3, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "How much is this?", translation: "这个多少钱？", difficulty: "A1", source: "builtin", tags: ["shopping"], wordCount: 4, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "I want a glass of water.", translation: "我想要一杯水。", difficulty: "A1", source: "builtin", tags: ["food"], wordCount: 6, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "He is a good teacher.", translation: "他是一位好老师。", difficulty: "A1", source: "builtin", tags: ["people"], wordCount: 5, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "There are seven days in a week.", translation: "一周有七天。", difficulty: "A1", source: "builtin", tags: ["time"], wordCount: 7, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "Please sit down and relax.", translation: "请坐下休息。", difficulty: "A1", source: "builtin", tags: ["instruction"], wordCount: 5, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "The weather is nice today.", translation: "今天天气很好。", difficulty: "A1", source: "builtin", tags: ["weather"], wordCount: 5, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "I love my family very much.", translation: "我非常爱我的家人。", difficulty: "A1", source: "builtin", tags: ["family"], wordCount: 6, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "See you tomorrow morning!", translation: "明天早上见！", difficulty: "A1", source: "builtin", tags: ["farewell"], wordCount: 4, createdAt: now(), updatedAt: now() },

  // ===== A2 (基础) — 15 句 =====
  { id: sid(), text: "I usually get up at seven in the morning.", translation: "我通常早上七点起床。", difficulty: "A2", source: "builtin", tags: ["daily-life"], wordCount: 10, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "Could you tell me the way to the station?", translation: "你能告诉我去车站的路吗？", difficulty: "A2", source: "builtin", tags: ["travel"], wordCount: 11, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "She works in a hospital near her home.", translation: "她在家附近的医院工作。", difficulty: "A2", source: "builtin", tags: ["jobs"], wordCount: 8, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "I have never been to a foreign country.", translation: "我从未去过外国。", difficulty: "A2", source: "builtin", tags: ["travel"], wordCount: 9, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "What do you usually do on weekends?", translation: "你周末通常做什么？", difficulty: "A2", source: "builtin", tags: ["daily-life"], wordCount: 7, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "My sister is older than me by two years.", translation: "我姐姐比我大两岁。", difficulty: "A2", source: "builtin", tags: ["family"], wordCount: 10, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "I'm looking forward to seeing you again.", translation: "我期待再次见到你。", difficulty: "A2", source: "builtin", tags: ["emotion"], wordCount: 8, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "It takes about twenty minutes by bus.", translation: "坐公交车大约需要二十分钟。", difficulty: "A2", source: "builtin", tags: ["travel"], wordCount: 7, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "He didn't come to the party last night.", translation: "他昨晚没有来参加聚会。", difficulty: "A2", source: "builtin", tags: ["social"], wordCount: 9, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "Would you like something to drink?", translation: "你想喝点什么吗？", difficulty: "A2", source: "builtin", tags: ["social"], wordCount: 6, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "I need to buy some vegetables and fruit.", translation: "我需要买一些蔬菜和水果。", difficulty: "A2", source: "builtin", tags: ["shopping"], wordCount: 8, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "The movie was more interesting than I expected.", translation: "这部电影比我想象的更有趣。", difficulty: "A2", source: "builtin", tags: ["entertainment"], wordCount: 8, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "She has been learning English for three years.", translation: "她学英语已经三年了。", difficulty: "A2", source: "builtin", tags: ["learning"], wordCount: 8, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "I prefer tea to coffee in the afternoon.", translation: "下午我喜欢喝茶胜过咖啡。", difficulty: "A2", source: "builtin", tags: ["food"], wordCount: 9, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "Let's meet at the park near the library.", translation: "我们在图书馆附近的公园见面吧。", difficulty: "A2", source: "builtin", tags: ["social"], wordCount: 9, createdAt: now(), updatedAt: now() },

  // ===== B1 (中级) — 15 句 =====
  { id: sid(), text: "If I had more time, I would travel around the world.", translation: "如果我有更多时间，我会环游世界。", difficulty: "B1", source: "builtin", tags: ["travel", "grammar"], wordCount: 12, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "The government has announced new policies to protect the environment.", translation: "政府宣布了保护环境的新政策。", difficulty: "B1", source: "builtin", tags: ["news"], wordCount: 10, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "Despite the heavy rain, the event went on as planned.", translation: "尽管下着大雨，活动仍按计划进行。", difficulty: "B1", source: "builtin", tags: ["narrative"], wordCount: 11, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "I find it difficult to express my feelings in words.", translation: "我发现很难用语言表达我的感受。", difficulty: "B1", source: "builtin", tags: ["emotion"], wordCount: 11, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "She suggested that we should start the meeting earlier.", translation: "她建议我们应该提前开始会议。", difficulty: "B1", source: "builtin", tags: ["work"], wordCount: 9, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "The more you practice, the better you will become.", translation: "你练习得越多，你就会变得越好。", difficulty: "B1", source: "builtin", tags: ["learning"], wordCount: 10, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "It is generally believed that regular exercise improves mental health.", translation: "人们普遍认为定期锻炼能改善心理健康。", difficulty: "B1", source: "builtin", tags: ["health"], wordCount: 10, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "He apologized for not having informed us in advance.", translation: "他为没有提前通知我们而道歉。", difficulty: "B1", source: "builtin", tags: ["work"], wordCount: 9, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "I would rather stay home than go out in this weather.", translation: "在这种天气里，我宁愿待在家里也不愿出门。", difficulty: "B1", source: "builtin", tags: ["daily-life"], wordCount: 13, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "Technology has changed the way we communicate with each other.", translation: "科技改变了我们彼此交流的方式。", difficulty: "B1", source: "builtin", tags: ["technology"], wordCount: 11, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "She couldn't remember where she had put her keys.", translation: "她不记得把钥匙放哪儿了。", difficulty: "B1", source: "builtin", tags: ["daily-life"], wordCount: 9, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "The instructions were so confusing that nobody understood them.", translation: "指令太混乱了，以至于没人能理解。", difficulty: "B1", source: "builtin", tags: ["work"], wordCount: 9, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "What matters most is not how much you know but how much you care.", translation: "最重要的不是你知道多少，而是你有多在乎。", difficulty: "B1", source: "builtin", tags: ["wisdom"], wordCount: 17, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "He managed to finish the project ahead of schedule.", translation: "他成功地提前完成了项目。", difficulty: "B1", source: "builtin", tags: ["work"], wordCount: 9, createdAt: now(), updatedAt: now() },
  { id: sid(), text: "Learning a new language opens doors to different cultures.", translation: "学习一门新语言打开了通往不同文化的大门。", difficulty: "B1", source: "builtin", tags: ["learning"], wordCount: 9, createdAt: now(), updatedAt: now() },
];
