import express from 'express';
import { run, queryAll, query } from '../config/database.js';
import { authenticateToken, type AuthRequest } from '../utils/jwt.js';

const router = express.Router();

// 获取用户的所有情绪记录
router.get('/', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const emotions = queryAll(
      'SELECT * FROM emotions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // 处理 activities 和 tags 字段
    const processedEmotions = emotions.map(emotion => ({
      ...emotion,
      activities: emotion.activities ? JSON.parse(emotion.activities) : [],
      tags: emotion.tags ? JSON.parse(emotion.tags) : []
    }));

    res.json(processedEmotions);
  } catch (error) {
    console.error('获取情绪记录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建新的情绪记录
router.post('/', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const { mood, intensity, activities, description, tags } = req.body;

    // 验证必填字段
    if (!mood || intensity === undefined) {
      return res.status(400).json({ error: '心情和强度是必填字段' });
    }

    // 验证强度范围
    if (intensity < 1 || intensity > 10) {
      return res.status(400).json({ error: '情绪强度必须在1-10之间' });
    }

    // 验证心情类型
    const validMoods = ['very_happy', 'happy', 'neutral', 'sad', 'angry'];
    if (!validMoods.includes(mood)) {
      return res.status(400).json({ error: '无效的心情类型' });
    }

    const result = run(
      `INSERT INTO emotions (user_id, mood, intensity, activities, description, tags, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        userId,
        mood,
        intensity,
        JSON.stringify(activities || []),
        description || '',
        JSON.stringify(tags || [])
      ]
    );

    // 获取刚创建的记录
    const newEmotion = query(
      'SELECT * FROM emotions WHERE id = ?',
      [result.lastInsertRowid]
    );

    if (newEmotion && Object.keys(newEmotion).length > 0) {
      const processedEmotion = {
        ...newEmotion,
        activities: newEmotion.activities ? JSON.parse(newEmotion.activities) : [],
        tags: newEmotion.tags ? JSON.parse(newEmotion.tags) : []
      };
      res.status(201).json(processedEmotion);
    } else {
      res.status(500).json({ error: '创建记录失败' });
    }
  } catch (error) {
    console.error('创建情绪记录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取特定日期的情绪记录
router.get('/date/:date', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const { date } = req.params;
    
    // 验证日期格式 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: '无效的日期格式，请使用YYYY-MM-DD' });
    }

    const emotions = queryAll(
      'SELECT * FROM emotions WHERE user_id = ? AND DATE(created_at) = ? ORDER BY created_at DESC',
      [userId, date]
    );

    const processedEmotions = emotions.map(emotion => ({
      ...emotion,
      activities: emotion.activities ? JSON.parse(emotion.activities) : [],
      tags: emotion.tags ? JSON.parse(emotion.tags) : []
    }));

    res.json(processedEmotions);
  } catch (error) {
    console.error('获取特定日期情绪记录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取情绪统计数据
router.get('/stats', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const { timeRange = '30d' } = req.query;
    
    let dateFilter = '';
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      dateFilter = `AND created_at >= datetime('now', '-${days} days')`;
    }

    // 获取基本统计
    const totalRecords = query(
      `SELECT COUNT(*) as count FROM emotions WHERE user_id = ? ${dateFilter}`,
      [userId]
    );

    const avgIntensity = query(
      `SELECT AVG(intensity) as avg FROM emotions WHERE user_id = ? ${dateFilter}`,
      [userId]
    );

    // 获取心情分布
    const moodDistribution = queryAll(
      `SELECT mood, COUNT(*) as count 
       FROM emotions 
       WHERE user_id = ? ${dateFilter} 
       GROUP BY mood 
       ORDER BY count DESC`,
      [userId]
    );

    // 获取每日平均强度趋势
    const dailyTrends = queryAll(
      `SELECT date(created_at) as date, AVG(intensity) as avg_intensity, COUNT(*) as count
       FROM emotions 
       WHERE user_id = ? ${dateFilter} 
       GROUP BY date(created_at) 
       ORDER BY date ASC`,
      [userId]
    );

    res.json({
      totalRecords: totalRecords[0]?.count || 0,
      avgIntensity: Math.round((avgIntensity[0]?.avg || 0) * 10) / 10,
      moodDistribution,
      dailyTrends
    });
  } catch (error) {
    console.error('获取情绪统计失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新情绪记录
router.put('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const { id } = req.params;
    const { mood, intensity, activities, description, tags } = req.body;

    // 检查记录是否存在且属于当前用户
    const existingEmotion = query(
      'SELECT * FROM emotions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existingEmotion || Object.keys(existingEmotion).length === 0) {
      return res.status(404).json({ error: '记录不存在或无权限访问' });
    }

    // 验证数据
    if (mood && !['very_happy', 'happy', 'neutral', 'sad', 'angry'].includes(mood)) {
      return res.status(400).json({ error: '无效的心情类型' });
    }

    if (intensity !== undefined && (intensity < 1 || intensity > 10)) {
      return res.status(400).json({ error: '情绪强度必须在1-10之间' });
    }

    run(
      `UPDATE emotions 
       SET mood = COALESCE(?, mood), 
           intensity = COALESCE(?, intensity), 
           activities = COALESCE(?, activities), 
           description = COALESCE(?, description), 
           tags = COALESCE(?, tags),
           updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
      [
        mood,
        intensity,
        activities ? JSON.stringify(activities) : null,
        description,
        tags ? JSON.stringify(tags) : null,
        id,
        userId
      ]
    );

    // 获取更新后的记录
    const updatedEmotion = query(
      'SELECT * FROM emotions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (updatedEmotion && Object.keys(updatedEmotion).length > 0) {
      const processedEmotion = {
        ...updatedEmotion,
        activities: updatedEmotion.activities ? JSON.parse(updatedEmotion.activities) : [],
        tags: updatedEmotion.tags ? JSON.parse(updatedEmotion.tags) : []
      };
      res.json(processedEmotion);
    } else {
      res.status(500).json({ error: '更新记录失败' });
    }
  } catch (error) {
    console.error('更新情绪记录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除情绪记录
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const { id } = req.params;

    // 检查记录是否存在且属于当前用户
    const existingEmotion = query(
      'SELECT * FROM emotions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existingEmotion || Object.keys(existingEmotion).length === 0) {
      return res.status(404).json({ error: '记录不存在或无权限访问' });
    }

    run(
      'DELETE FROM emotions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: '记录删除成功' });
  } catch (error) {
    console.error('删除情绪记录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;