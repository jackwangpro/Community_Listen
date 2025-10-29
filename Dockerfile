# 使用官方 Node 镜像
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxext6 \
    libxrender1 \
    unzip \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# 复制项目文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 安装 Playwright 浏览器
RUN npx playwright install --with-deps

# 复制剩余文件
COPY . .

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "reddit.mjs"]
