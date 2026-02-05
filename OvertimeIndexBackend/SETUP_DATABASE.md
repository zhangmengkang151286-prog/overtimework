# 数据库安装指南

## 方案1: 安装PostgreSQL (推荐)

### Windows安装步骤:

1. **下载PostgreSQL**
   - 访问: https://www.postgresql.org/download/windows/
   - 或直接下载: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - 选择最新版本 (例如 PostgreSQL 16)

2. **安装PostgreSQL**
   - 运行下载的安装程序
   - 设置密码 (记住这个密码!)
   - 端口使用默认 5432
   - 其他选项保持默认

3. **配置环境变量** (可选，方便使用命令行)
   - 添加到PATH: `C:\Program Files\PostgreSQL\16\bin`

4. **创建数据库**
   ```cmd
   # 打开命令行
   psql -U postgres
   # 输入密码后执行:
   CREATE DATABASE overtime_index;
   \q
   ```

5. **更新.env文件**
   ```env
   DB_PASSWORD=你设置的密码
   ```

6. **运行迁移**
   ```cmd
   cd OvertimeIndexBackend
   type src\database\migrations\001_initial.sql | psql -U postgres overtime_index
   type src\database\seeds\initial_data.sql | psql -U postgres overtime_index
   ```

## 方案2: 使用Docker (更简单)

```cmd
# 安装Docker Desktop for Windows
# 然后运行:
docker run --name postgres-overtime ^
  -e POSTGRES_PASSWORD=123456 ^
  -e POSTGRES_DB=overtime_index ^
  -p 5432:5432 ^
  -d postgres:16-alpine

# 更新.env
DB_PASSWORD=123456

# 运行迁移
docker exec -i postgres-overtime psql -U postgres overtime_index < src\database\migrations\001_initial.sql
docker exec -i postgres-overtime psql -U postgres overtime_index < src\database\seeds\initial_data.sql
```

## 方案3: 使用在线PostgreSQL服务 (最简单)

1. **注册免费PostgreSQL服务**
   - Supabase: https://supabase.com (推荐，免费额度大)
   - ElephantSQL: https://www.elephantsql.com
   - Neon: https://neon.tech

2. **获取连接信息**
   - 复制数据库URL或连接参数

3. **更新.env文件**
   ```env
   DB_HOST=your-host.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your-password
   ```

4. **运行迁移** (使用在线服务提供的SQL编辑器)
   - 复制 `src/database/migrations/001_initial.sql` 内容
   - 在在线SQL编辑器中执行
   - 复制 `src/database/seeds/initial_data.sql` 内容
   - 在在线SQL编辑器中执行

## 方案4: 临时跳过数据库 (仅用于测试API结构)

如果你只想快速测试API是否能启动，可以临时禁用数据库连接:

1. 编辑 `src/server.ts`，注释掉数据库连接:
   ```typescript
   // await connectDatabase();
   // console.log('✅ 数据库连接成功');
   ```

2. 编辑 `src/server.ts`，注释掉Redis连接:
   ```typescript
   // await connectRedis();
   // console.log('✅ Redis连接成功');
   ```

3. 启动服务器:
   ```cmd
   npm run dev
   ```

4. 测试健康检查:
   ```cmd
   curl http://localhost:3000/health
   ```

**注意**: 方案4只能测试服务器启动，实际API调用会失败，因为需要数据库。

## 推荐方案

- **开发环境**: 方案2 (Docker) 或方案1 (本地安装)
- **快速测试**: 方案3 (在线服务)
- **生产环境**: 方案1 (本地安装) 或云服务商的托管PostgreSQL

## 下一步

安装完数据库后:
1. 确保PostgreSQL正在运行
2. 运行 `npm run dev`
3. 访问 http://localhost:3000/health
4. 测试API接口

有问题随时问我！
