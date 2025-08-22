import { run, queryAll } from '../config/database.js';

// 示例情绪记录数据
const sampleEmotions = [
  {
    user_id: 1, // 假设用户ID为1 (10001账号)
    mood: 'happy',
    intensity: 8,
    activities: JSON.stringify(['work', 'coffee']),
    description: '今天工作很顺利，完成了重要的项目里程碑，心情很好！',
    tags: JSON.stringify(['工作', '成就感']),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1天前
  },
  {
    user_id: 1,
    mood: 'neutral',
    intensity: 6,
    activities: JSON.stringify(['study', 'music']),
    description: '平静的一天，听了一些音乐，学习了新的技能。',
    tags: JSON.stringify(['学习', '音乐']),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2天前
  },
  {
    user_id: 1,
    mood: 'very_happy',
    intensity: 9,
    activities: JSON.stringify(['social', 'family']),
    description: '和家人朋友聚餐，度过了非常愉快的时光，感觉很幸福！',
    tags: JSON.stringify(['家庭', '聚会', '幸福']),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3天前
  },
  {
    user_id: 1,
    mood: 'sad',
    intensity: 4,
    activities: JSON.stringify(['work']),
    description: '工作遇到了一些挫折，感觉有点沮丧，需要调整心态。',
    tags: JSON.stringify(['工作压力', '挫折']),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4天前
  },
  {
    user_id: 1,
    mood: 'happy',
    intensity: 7,
    activities: JSON.stringify(['exercise', 'relax']),
    description: '今天去健身了，运动后感觉身心都很舒畅，压力得到了释放。',
    tags: JSON.stringify(['运动', '健康', '放松']),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5天前
  },
  {
    user_id: 1,
    mood: 'neutral',
    intensity: 5,
    activities: JSON.stringify(['study', 'coffee']),
    description: '普通的学习日，喝了咖啡提神，状态还算不错。',
    tags: JSON.stringify(['学习', '日常']),
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6天前
  },
  {
    user_id: 1,
    mood: 'happy',
    intensity: 8,
    activities: JSON.stringify(['travel', 'music']),
    description: '周末出去旅行了，看到了美丽的风景，听着喜欢的音乐，心情特别好。',
    tags: JSON.stringify(['旅行', '风景', '音乐']),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7天前
  },
  {
    user_id: 1,
    mood: 'angry',
    intensity: 3,
    activities: JSON.stringify(['work']),
    description: '今天遇到了一些不公平的事情，感到很愤怒，需要冷静下来。',
    tags: JSON.stringify(['愤怒', '不公平']),
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8天前
  },
  {
    user_id: 1,
    mood: 'very_happy',
    intensity: 10,
    activities: JSON.stringify(['family', 'social']),
    description: '今天是我的生日，收到了很多祝福和礼物，感到无比幸福和感动！',
    tags: JSON.stringify(['生日', '祝福', '感动', '幸福']),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10天前
  },
  {
    user_id: 1,
    mood: 'neutral',
    intensity: 6,
    activities: JSON.stringify(['work', 'study']),
    description: '忙碌但充实的一天，工作和学习都有进展。',
    tags: JSON.stringify(['忙碌', '充实']),
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() // 12天前
  },
  {
    user_id: 1,
    mood: 'happy',
    intensity: 7,
    activities: JSON.stringify(['exercise', 'music', 'relax']),
    description: '晨跑后听音乐放松，感觉一天都充满了活力。',
    tags: JSON.stringify(['晨跑', '活力', '音乐']),
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15天前
  },
  {
    user_id: 1,
    mood: 'sad',
    intensity: 4,
    activities: JSON.stringify(['work']),
    description: '项目进度落后，感到有些焦虑和沮丧。',
    tags: JSON.stringify(['焦虑', '项目压力']),
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() // 18天前
  },
  {
    user_id: 1,
    mood: 'happy',
    intensity: 8,
    activities: JSON.stringify(['social', 'coffee']),
    description: '和朋友喝咖啡聊天，分享了很多有趣的话题，心情很愉快。',
    tags: JSON.stringify(['朋友', '聊天', '咖啡']),
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() // 20天前
  },
  {
    user_id: 1,
    mood: 'neutral',
    intensity: 5,
    activities: JSON.stringify(['study', 'relax']),
    description: '学习新知识，然后放松休息，平衡的一天。',
    tags: JSON.stringify(['学习', '平衡']),
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() // 25天前
  },
  {
    user_id: 1,
    mood: 'very_happy',
    intensity: 9,
    activities: JSON.stringify(['family', 'travel']),
    description: '和家人一起旅行，创造了很多美好的回忆，非常开心！',
    tags: JSON.stringify(['家庭旅行', '回忆', '开心']),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30天前
  }
];

export async function addSampleData() {
  try {
    console.log('开始添加示例数据...');
    
    // 检查是否已经有数据
    const existingData = queryAll('SELECT COUNT(*) as count FROM emotions WHERE user_id = 1');
    if (existingData.length > 0 && existingData[0].count > 0) {
      console.log('示例数据已存在，跳过添加');
      return;
    }

    // 添加示例数据
    for (const emotion of sampleEmotions) {
      run(
        `INSERT INTO emotions (user_id, mood, intensity, activities, description, tags, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          emotion.user_id,
          emotion.mood,
          emotion.intensity,
          emotion.activities,
          emotion.description,
          emotion.tags,
          emotion.created_at
        ]
      );
    }

    console.log(`成功添加 ${sampleEmotions.length} 条示例情绪记录`);
  } catch (error) {
    console.error('添加示例数据失败:', error);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  addSampleData().then(() => {
    console.log('示例数据添加完成');
    process.exit(0);
  }).catch((error) => {
    console.error('添加示例数据时出错:', error);
    process.exit(1);
  });
}