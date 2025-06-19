-- Add article_id column to reports table
ALTER TABLE reports ADD COLUMN article_id BIGINT;

-- Add foreign key constraint
ALTER TABLE reports ADD CONSTRAINT fk_reports_article 
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_reports_article_id ON reports(article_id); 