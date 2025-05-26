package com.ufit.server.repository;
import com.ufit.server.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByCategory(String category);
    boolean existsByHref(String href);
    List<Article> findTop5ByOrderByCreatedAtDesc();
    @Query("SELECT a.category, COUNT(a) FROM Article a GROUP BY a.category")
    List<Object[]> countByCategory();
    @Query("SELECT a FROM Article a WHERE LOWER(a.title) LIKE :title OR LOWER(a.content) LIKE :content")
    List<Article> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String title, String content);
    @Query("SELECT DISTINCT a.category FROM Article a ORDER BY a.category")
    List<String> findDistinctCategories();
}
