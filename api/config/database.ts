import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { addSampleData } from '../scripts/addSampleData.js';

let db: any = null;

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'emotion_app.db');

// 确保数据目录存在
const ensureDataDir = () => {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// 初始化数据库
export const initDatabase = async () => {
  try {
    ensureDataDir();
    
    const SQL = await initSqlJs();
    
    // 检查数据库文件是否存在
    let filebuffer;
    if (fs.existsSync(DB_PATH)) {
      filebuffer = fs.readFileSync(DB_PATH);
    }
    
    // 创建或打开数据库
    db = new SQL.Database(filebuffer);
    
    // 创建用户表
    await createTables();
    
    // 保存数据库到文件
    saveDatabase();
    
    console.log('SQLite数据库初始化成功');
    return db;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

// 创建数据表
const createTables = async () => {
  if (!db) throw new Error('数据库未初始化');
  
  // 创建用户表
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account TEXT UNIQUE,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      username TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  // 创建管理员表
  const createAdminsTable = `
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      username TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      avatar_url TEXT,
      last_login DATETIME,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  // 创建情绪记录表
  const createEmotionsTable = `
    CREATE TABLE IF NOT EXISTS emotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      mood TEXT NOT NULL,
      intensity INTEGER NOT NULL CHECK(intensity >= 1 AND intensity <= 10),
      activities TEXT,
      description TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `;
  
  try {
    db.run(createUsersTable);
    db.run(createAdminsTable);
    db.run(createEmotionsTable);
    
    // 创建默认管理员账户（如果不存在）
    await createDefaultAdmin();
    
    // 创建预设测试账号
    await createPresetAccounts();
    
    // 添加示例数据
    await addSampleData();
    
    console.log('数据表创建成功');
  } catch (error) {
    console.error('创建数据表失败:', error);
    throw error;
  }
};

// 保存数据库到文件
const saveDatabase = () => {
  if (!db) return;
  
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, data);
  } catch (error) {
    console.error('保存数据库失败:', error);
  }
};

// 获取数据库实例
export const getDatabase = () => {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return db;
};

// 执行查询
export const query = (sql: string, params: any[] = []) => {
  const database = getDatabase();
  try {
    const stmt = database.prepare(sql);
    const result = stmt.getAsObject(params);
    return result;
  } catch (error) {
    console.error('查询执行失败:', error);
    throw error;
  }
};

// 执行查询并返回所有结果
export const queryAll = (sql: string, params: any[] = []) => {
  const database = getDatabase();
  try {
    const stmt = database.prepare(sql);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('查询执行失败:', error);
    throw error;
  }
};

// 执行插入/更新/删除操作
export const run = (sql: string, params: any[] = []) => {
  const database = getDatabase();
  try {
    const stmt = database.prepare(sql);
    stmt.run(params);
    stmt.free();
    
    // 保存更改到文件
    saveDatabase();
    
    return {
      lastInsertRowid: database.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] || null,
      changes: 1
    };
  } catch (error) {
    console.error('执行操作失败:', error);
    throw error;
  }
};

// 关闭数据库连接
export const closeDatabase = () => {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('数据库连接已关闭');
  }
};

// 进程退出时自动保存数据库
process.on('exit', () => {
  saveDatabase();
});

process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});

// 创建默认管理员账户
const createDefaultAdmin = async () => {
  if (!db) return;
  
  try {
    // 检查是否已存在管理员
    const stmt = db.prepare('SELECT COUNT(*) as count FROM admins WHERE email = ?');
    const result = stmt.getAsObject(['admin@emotion-app.com']);
    stmt.free();
    
    if (result.count === 0) {
      // 创建默认管理员账户
      const defaultEmail = 'admin@emotion-app.com';
      const defaultPassword = 'admin';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      const insertStmt = db.prepare(`
        INSERT INTO admins (email, password, username, role)
        VALUES (?, ?, ?, ?)
      `);
      
      insertStmt.run([defaultEmail, hashedPassword, 'admin', 'super_admin']);
      insertStmt.free();
      
      saveDatabase();
      console.log('默认管理员账户创建成功');
      console.log('管理员邮箱:', defaultEmail);
      console.log('管理员密码:', defaultPassword);
    }
  } catch (error) {
    console.error('创建默认管理员失败:', error);
  }
};

// 创建预设测试账号
const createPresetAccounts = async () => {
  if (!db) return;
  
  try {
    // 创建预设管理员账号 10001/123 (管理员权限)
    const adminStmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE account = ?');
    const adminResult = adminStmt.getAsObject(['10001']);
    adminStmt.free();
    
    if (adminResult.count === 0) {
      const adminPassword = await bcrypt.hash('123', 10);
      const insertAdminStmt = db.prepare(`
        INSERT INTO users (account, email, phone, password, username, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertAdminStmt.run(['10001', '10001@admin.com', '13800000001', adminPassword, '管理员', 'admin']);
      insertAdminStmt.free();
      
      console.log('预设管理员账号创建成功: 10001 / 123 (管理员权限)');
    }
    
    // 创建预设普通用户账号 10002/123 (普通用户权限)
    const userStmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE account = ?');
    const userResult = userStmt.getAsObject(['10002']);
    userStmt.free();
    
    if (userResult.count === 0) {
      const userPassword = await bcrypt.hash('123', 10);
      const insertUserStmt = db.prepare(`
        INSERT INTO users (account, email, phone, password, username, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertUserStmt.run(['10002', '10002@user.com', '13800000002', userPassword, '普通用户', 'user']);
      insertUserStmt.free();
      
      console.log('预设普通用户账号创建成功: 10002 / 123 (普通用户权限)');
    }
    
    saveDatabase();
  } catch (error) {
    console.error('创建预设账号失败:', error);
  }
};

// 管理员相关数据库操作
export const adminQueries = {
  // 根据邮箱查找管理员
  findByEmail: (email: string) => {
    const database = getDatabase();
    const stmt = database.prepare('SELECT * FROM admins WHERE email = ? AND is_active = 1');
    const result = stmt.getAsObject([email]);
    stmt.free();
    return result;
  },
  
  // 根据ID查找管理员
  findById: (id: number) => {
    const database = getDatabase();
    const stmt = database.prepare('SELECT * FROM admins WHERE id = ?');
    const result = stmt.getAsObject([id]);
    stmt.free();
    return result;
  },
  
  // 更新管理员最后登录时间
  updateLastLogin: (adminId: number) => {
    const database = getDatabase();
    const stmt = database.prepare('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run([adminId]);
    stmt.free();
    saveDatabase();
  },
  
  // 获取所有管理员
  getAllAdmins: () => {
    const database = getDatabase();
    const stmt = database.prepare('SELECT id, email, username, role, last_login, is_active, created_at FROM admins ORDER BY created_at DESC');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
};