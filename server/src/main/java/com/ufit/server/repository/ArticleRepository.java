package com.ufit.server.repository;
import com.ufit.server.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByCategory(String category);
    List<Article> findBySource(String source);
    List<Article> findByCategoryAndIsActiveTrue(String category);
    boolean existsByHref(String href);
    boolean existsByContentHash(String contentHash);
    Optional<Article> findByHref(String href);
    @Query("SELECT a FROM Article a WHERE a.isActive = true AND " +
           "(LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.content) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.tags) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Article> searchActiveArticles(@Param("query") String query);
    @Query("SELECT a FROM Article a WHERE LOWER(a.title) LIKE LOWER(:title) OR LOWER(a.content) LIKE LOWER(:content)")
    List<Article> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
        @Param("title") String title, @Param("content") String content);
    List<Article> findTop5ByIsActiveTrueOrderByCreatedAtDesc();
    @Query("SELECT a FROM Article a WHERE a.isActive = true ORDER BY a.createdAt DESC")
    List<Article> findTopNActiveArticles(Pageable pageable);
    List<Article> findTop10ByIsActiveTrueOrderByCreatedAtDesc();
    @Query("SELECT a FROM Article a WHERE a.isActive = true AND a.category = :category ORDER BY a.createdAt DESC")
    List<Article> findTopNByCategoryAndActiveTrue(@Param("category") String category, Pageable pageable);
    @Query("SELECT a FROM Article a WHERE a.category = :category AND a.isActive = true " +
           "ORDER BY a.createdAt DESC")
    List<Article> findLatestByCategory(@Param("category") String category, 
                                     org.springframework.data.domain.Pageable pageable);
    @Query("SELECT a.category, COUNT(a) FROM Article a WHERE a.isActive = true GROUP BY a.category")
    List<Object[]> countByCategory();
    @Query("SELECT a.source, COUNT(a) FROM Article a WHERE a.isActive = true GROUP BY a.source")
    List<Object[]> countBySource();
    @Query("SELECT DISTINCT a.category FROM Article a WHERE a.isActive = true ORDER BY a.category")
    List<String> findDistinctCategories();
    @Query("SELECT DISTINCT a.source FROM Article a ORDER BY a.source")
    List<String> findDistinctSources();
    @Query("SELECT DISTINCT a.language FROM Article a ORDER BY a.language")
    List<String> findDistinctLanguages();
    long countByIsActiveTrue();
    long countByCategory(String category);
    long countBySource(String source);
    long countByCategoryAndSource(String category, String source);
    @Modifying
    @Query("DELETE FROM Article a WHERE a.source = :source")
    void deleteBySource(@Param("source") String source);
    @Modifying
    @Query("UPDATE Article a SET a.isActive = false WHERE a.source = :source")
    void deactivateBySource(@Param("source") String source);
    @Modifying
    @Query("UPDATE Article a SET a.isActive = false WHERE a.id = :id")
    void deactivateById(@Param("id") Long id);
    @Query("SELECT a FROM Article a WHERE a.title = :title AND a.href != :href")
    List<Article> findDuplicatesByTitle(@Param("title") String title, @Param("href") String href);
    @Query("SELECT a FROM Article a WHERE a.contentHash = :hash AND a.href != :href")
    List<Article> findDuplicatesByContentHash(@Param("hash") String hash, @Param("href") String href);
    @Query("SELECT COUNT(a), AVG(a.wordCount), MAX(a.createdAt) FROM Article a WHERE a.isActive = true")
    List<Object[]> getHealthStats();
}
