-- ============================================
-- 表名：community_post（社区帖子表）
-- 功能：存储社区中每个帖子的基本信息、发帖人、内容及相关属性
-- ============================================

CREATE TABLE community_post (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,     -- 主键，自增ID，唯一标识每条帖子记录
  community VARCHAR(255) NOT NULL,                        -- 社区名称
  post_title VARCHAR(255),                                -- 帖子标题
  post_author VARCHAR(255),                               -- 发帖人名称
  post_text TEXT,                                         -- 帖子正文内容
  post_reply TEXT,                                        -- 帖子回复或评论内容
  post_url TEXT NOT NULL,                                 -- 帖子URL，唯一标识帖子
  post_time TIMESTAMPTZ,                                  -- 帖子原始发布时间（含时区）
  post_index INTEGER,                                     -- 帖子索引/排序字段
  to_j INTEGER,                                           -- 整数字段，可用于扩展用途（例如外部关联、分类ID等）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),          -- 记录创建时间
  CONSTRAINT uniq_post_url UNIQUE (post_url)              -- post_url 唯一约束
);

-- ============================================
-- 为表及字段添加中文注释
-- ============================================

COMMENT ON TABLE community_post IS '社区帖子表：存储社区中每个帖子的基本信息、发帖人、内容及相关信息';

COMMENT ON COLUMN community_post.id IS '主键ID，自增，用于唯一标识帖子记录';
COMMENT ON COLUMN community_post.community IS '社区名称，例如“技术交流”、“生活分享”等';
COMMENT ON COLUMN community_post.post_title IS '帖子标题，用于展示帖子的主题内容';
COMMENT ON COLUMN community_post.post_author IS '发帖人名称，即发布该帖子的用户昵称';
COMMENT ON COLUMN community_post.post_text IS '帖子正文内容，支持较长文本';
COMMENT ON COLUMN community_post.post_reply IS '帖子回复内容，可为多行文本';
COMMENT ON COLUMN community_post.post_url IS '帖子URL，唯一标识帖子的链接';
COMMENT ON COLUMN community_post.post_time IS '帖子原始发布时间（含时区信息）';
COMMENT ON COLUMN community_post.post_index IS '帖子索引或排序字段，用于自定义显示顺序';
COMMENT ON COLUMN community_post.to_j IS '整数字段，可用于扩展用途（如分类编号、外键等）';
COMMENT ON COLUMN community_post.created_at IS '记录创建时间，默认当前时间';
COMMENT ON CONSTRAINT uniq_post_url ON community_post IS '唯一约束：保证每个帖子URL不重复';

-- ============================================
-- 创建索引
-- ============================================

CREATE INDEX idx_community_post_community ON community_post (community);
CREATE INDEX idx_community_post_post_index ON community_post (post_index);
CREATE INDEX idx_community_post_post_time ON community_post (post_time);
CREATE INDEX idx_community_post_to_j ON community_post (to_j);

COMMENT ON INDEX idx_community_post_community IS '索引：加速按社区名称查询';
COMMENT ON INDEX idx_community_post_post_index IS '索引：用于按帖子索引字段排序或筛选';
COMMENT ON INDEX idx_community_post_post_time IS '索引：加速按发布时间查询或排序';
COMMENT ON INDEX idx_community_post_to_j IS '索引：用于根据整数字段 to_j 进行查询';

-- ============================================
-- 建表完成
-- ============================================






-- 1️ 启用行级安全（RLS）  
ALTER TABLE public.community_post ENABLE ROW LEVEL SECURITY;

-- 2️ 创建策略：仅允许已登录用户操作（增删改查）
CREATE POLICY "authenticated_only"
ON public.community_post
FOR ALL
USING (auth.role() IS NOT NULL)       -- SELECT, UPDATE, DELETE
WITH CHECK (auth.role() IS NOT NULL); -- INSERT, UPDATE

-- 3️ 禁止匿名访问
REVOKE ALL ON public.community_post FROM anon;





