import cors from 'cors';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, '../uploads/');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 使用内存存储，这样可以在路由处理函数中访问 req.body
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB 限制
  }
});

app.post('/upload', upload.single('chunk'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有文件被上传' });
  }

  // 获取请求参数
  const { name, hash, index, start, end } = req.body;

  if (!name || !hash) {
    return res.status(400).json({ error: '缺少必要参数：name 或 hash' });
  }

  // 生成文件名：name + hash
  const fileName = `${name}-${hash}`;
  const filePath = path.join(uploadsDir, fileName);

  // 检查文件是否已存在
  if (fs.existsSync(filePath)) {
    return res.json({
      message: '切片已存在，跳过上传',
      file: {
        name: name,
        hash: hash,
        index: index,
        start: start,
        end: end,
        filename: fileName,
        exists: true
      }
    });
  }

  // 文件不存在，保存文件
  try {
    fs.writeFileSync(filePath, req.file.buffer);
    res.json({
      message: '上传成功',
      file: {
        name: name,
        hash: hash,
        index: index,
        start: start,
        end: end,
        filename: fileName,
        exists: false
      }
    });
  } catch (error) {
    console.error('保存文件失败:', error);
    res.status(500).json({ error: '保存文件失败', details: error.message });
  }
})

app.listen(4000, () => {
  console.log('Server is running on port 4000');
});