# ========================================================
# 使用 Node 22 官方精简镜像
# ========================================================
FROM node:22-slim

# 防止交互式安装时阻塞
ENV DEBIAN_FRONTEND=noninteractive \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    NODE_ENV=production

# ========================================================
# 设置工作目录
# ========================================================
WORKDIR /app

# ========================================================
# 安装 Playwright 所需系统依赖
# （官方推荐最小集）
# ========================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libgbm1 \
    libglib2.0-0 \
    libnss3 \
    libwayland-client0 \
    libwayland-egl1 \
    libwayland-server0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    libxrender1 \
    fonts-liberation \
    wget \
    ca-certificates \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# ========================================================
# 复制依赖文件并安装依赖
# ========================================================
COPY package*.json ./
RUN npm ci --omit=dev

# ========================================================
# 安装 Playwright 浏览器（自动匹配版本）
# ========================================================
RUN npx playwright install --with-deps

# ========================================================
# 复制项目源代码
# ========================================================
COPY . .

# ========================================================
# 启动服务
# ========================================================
CMD node reddit.mjs && echo "✅ Script completed successfully"
