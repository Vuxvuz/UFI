package com.ufit.analysis;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Tạo Class Diagram và Entity Relationship Diagram từ dữ liệu phân tích
 */
public class DiagramGenerator {
    
    public static void main(String[] args) {
        try {
            generateClassDiagram();
            generateEntityRelationshipDiagram();
            generateControllerServiceDiagram();
            generateComplexityReport();
            
            System.out.println("✅ Tạo diagram hoàn thành!");
            System.out.println("📊 Các file diagram được tạo:");
            System.out.println("   - target/class-diagram.plantuml");
            System.out.println("   - target/entity-relationship-diagram.plantuml");
            System.out.println("   - target/controller-service-diagram.plantuml");
            System.out.println("   - target/complexity-summary.txt");
            
        } catch (IOException e) {
            System.err.println("❌ Lỗi tạo diagram: " + e.getMessage());
        }
    }
    
    /**
     * Tạo Class Diagram từ báo cáo phân tích
     */
    private static void generateClassDiagram() throws IOException {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("!theme plain\n");
        plantuml.append("skinparam classAttributeIconSize 0\n");
        plantuml.append("skinparam classFontSize 10\n\n");
        
        // Đọc dữ liệu từ analysis-report.txt
        List<String> analysisLines = Files.readAllLines(Paths.get("target/analysis-report.txt"));
        
        // Tạo classes
        Set<String> controllers = new HashSet<>();
        Set<String> services = new HashSet<>();
        Set<String> entities = new HashSet<>();
        Set<String> dtos = new HashSet<>();
        
        for (String line : analysisLines) {
            if (line.startsWith("=== PHÂN TÍCH LỚP:")) {
                String className = line.substring(19, line.length() - 4);
                
                if (className.endsWith("Controller")) {
                    controllers.add(className);
                } else if (className.endsWith("ServiceImpl") || className.endsWith("Service")) {
                    services.add(className);
                } else if (isEntity(className)) {
                    entities.add(className);
                } else if (className.endsWith("Dto") || className.endsWith("Request") || className.endsWith("Response")) {
                    dtos.add(className);
                }
            }
        }
        
        // Tạo packages
        plantuml.append("package \"Controllers\" {\n");
        for (String controller : controllers) {
            plantuml.append("  class ").append(controller).append(" {\n");
            plantuml.append("    +handleRequest()\n");
            plantuml.append("  }\n");
        }
        plantuml.append("}\n\n");
        
        plantuml.append("package \"Services\" {\n");
        for (String service : services) {
            plantuml.append("  class ").append(service).append(" {\n");
            plantuml.append("    +businessLogic()\n");
            plantuml.append("  }\n");
        }
        plantuml.append("}\n\n");
        
        plantuml.append("package \"Entities\" {\n");
        for (String entity : entities) {
            plantuml.append("  class ").append(entity).append(" {\n");
            plantuml.append("    +id: Long\n");
            plantuml.append("    +getData()\n");
            plantuml.append("  }\n");
        }
        plantuml.append("}\n\n");
        
        plantuml.append("package \"DTOs\" {\n");
        for (String dto : dtos) {
            plantuml.append("  class ").append(dto).append(" {\n");
            plantuml.append("    +data: String\n");
            plantuml.append("  }\n");
        }
        plantuml.append("}\n\n");
        
        // Thêm relationships
        for (String controller : controllers) {
            String serviceName = controller.replace("Controller", "ServiceImpl");
            if (services.contains(serviceName)) {
                plantuml.append(controller).append(" --> ").append(serviceName).append("\n");
            }
        }
        
        plantuml.append("\n@enduml");
        
        Files.write(Paths.get("target/class-diagram.plantuml"), plantuml.toString().getBytes());
    }
    
    /**
     * Tạo Entity Relationship Diagram
     */
    private static void generateEntityRelationshipDiagram() throws IOException {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("!theme plain\n");
        plantuml.append("skinparam linetype ortho\n\n");
        
        // Entities chính
        String[] mainEntities = {"User", "Article", "ForumPost", "ForumTopic", "Category", "Report"};
        
        for (String entity : mainEntities) {
            plantuml.append("entity ").append(entity).append(" {\n");
            plantuml.append("  * id : Long <<PK>>\n");
            plantuml.append("  --\n");
            
            switch (entity) {
                case "User":
                    plantuml.append("  username : String\n");
                    plantuml.append("  email : String\n");
                    plantuml.append("  password : String\n");
                    break;
                case "Article":
                    plantuml.append("  title : String\n");
                    plantuml.append("  content : Text\n");
                    plantuml.append("  * user_id : Long <<FK>>\n");
                    plantuml.append("  * category_id : Long <<FK>>\n");
                    break;
                case "ForumPost":
                    plantuml.append("  content : Text\n");
                    plantuml.append("  * user_id : Long <<FK>>\n");
                    plantuml.append("  * topic_id : Long <<FK>>\n");
                    break;
                case "ForumTopic":
                    plantuml.append("  title : String\n");
                    plantuml.append("  description : Text\n");
                    plantuml.append("  * user_id : Long <<FK>>\n");
                    break;
                case "Category":
                    plantuml.append("  name : String\n");
                    plantuml.append("  description : String\n");
                    break;
                case "Report":
                    plantuml.append("  reason : String\n");
                    plantuml.append("  * reporter_id : Long <<FK>>\n");
                    plantuml.append("  * post_id : Long <<FK>>\n");
                    break;
            }
            plantuml.append("}\n\n");
        }
        
        // Relationships
        plantuml.append("User ||--o{ Article : creates\n");
        plantuml.append("Category ||--o{ Article : categorizes\n");
        plantuml.append("User ||--o{ ForumTopic : creates\n");
        plantuml.append("User ||--o{ ForumPost : writes\n");
        plantuml.append("ForumTopic ||--o{ ForumPost : contains\n");
        plantuml.append("User ||--o{ Report : reports\n");
        plantuml.append("ForumPost ||--o{ Report : reported\n");
        
        plantuml.append("\n@enduml");
        
        Files.write(Paths.get("target/entity-relationship-diagram.plantuml"), plantuml.toString().getBytes());
    }
    
    /**
     * Tạo Controller-Service Architecture Diagram
     */
    private static void generateControllerServiceDiagram() throws IOException {
        StringBuilder plantuml = new StringBuilder();
        plantuml.append("@startuml\n");
        plantuml.append("!theme plain\n");
        plantuml.append("title Controller-Service Architecture\n\n");
        
        plantuml.append("package \"Presentation Layer\" {\n");
        plantuml.append("  [ArticleController]\n");
        plantuml.append("  [AuthController]\n");
        plantuml.append("  [ForumController]\n");
        plantuml.append("  [AdminController]\n");
        plantuml.append("}\n\n");
        
        plantuml.append("package \"Business Layer\" {\n");
        plantuml.append("  [ArticleServiceImpl]\n");
        plantuml.append("  [AuthServiceImpl]\n");
        plantuml.append("  [VoteServiceImpl]\n");
        plantuml.append("  [ReportServiceImpl]\n");
        plantuml.append("}\n\n");
        
        plantuml.append("package \"Data Layer\" {\n");
        plantuml.append("  database \"Repository\" {\n");
        plantuml.append("    [ArticleRepository]\n");
        plantuml.append("    [UserRepository]\n");
        plantuml.append("    [ForumRepository]\n");
        plantuml.append("  }\n");
        plantuml.append("}\n\n");
        
        // Connections
        plantuml.append("[ArticleController] --> [ArticleServiceImpl]\n");
        plantuml.append("[AuthController] --> [AuthServiceImpl]\n");
        plantuml.append("[ForumController] --> [VoteServiceImpl]\n");
        plantuml.append("[AdminController] --> [ReportServiceImpl]\n");
        
        plantuml.append("[ArticleServiceImpl] --> [ArticleRepository]\n");
        plantuml.append("[AuthServiceImpl] --> [UserRepository]\n");
        plantuml.append("[VoteServiceImpl] --> [ForumRepository]\n");
        
        plantuml.append("\n@enduml");
        
        Files.write(Paths.get("target/controller-service-diagram.plantuml"), plantuml.toString().getBytes());
    }
    
    /**
     * Tạo báo cáo tóm tắt complexity
     */
    private static void generateComplexityReport() throws IOException {
        List<String> analysisLines = Files.readAllLines(Paths.get("target/analysis-report.txt"));
        
        Map<String, Integer> complexityScores = new HashMap<>();
        
        for (int i = 0; i < analysisLines.size(); i++) {
            String line = analysisLines.get(i);
            if (line.startsWith("=== PHÂN TÍCH LỚP:")) {
                String className = line.substring(19, line.length() - 4);
                
                // Tìm dòng Complexity Score
                for (int j = i + 1; j < Math.min(i + 10, analysisLines.size()); j++) {
                    String scoreLine = analysisLines.get(j);
                    if (scoreLine.startsWith("Complexity Score:")) {
                        int score = Integer.parseInt(scoreLine.substring(17).trim());
                        complexityScores.put(className, score);
                        break;
                    }
                }
            }
        }
        
        // Sắp xếp theo complexity score
        List<Map.Entry<String, Integer>> sortedClasses = complexityScores.entrySet()
            .stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .collect(Collectors.toList());
        
        StringBuilder report = new StringBuilder();
        report.append("=== BÁO CÁO COMPLEXITY SUMMARY ===\n\n");
        
        report.append("🔴 TOP 10 CLASSES PHỨC TÁP NHẤT:\n");
        for (int i = 0; i < Math.min(10, sortedClasses.size()); i++) {
            Map.Entry<String, Integer> entry = sortedClasses.get(i);
            report.append(String.format("%d. %s - Score: %d\n", i + 1, entry.getKey(), entry.getValue()));
        }
        
        report.append("\n📊 THỐNG KÊ THEO LOẠI:\n");
        
        Map<String, List<Integer>> typeStats = new HashMap<>();
        typeStats.put("Controllers", new ArrayList<>());
        typeStats.put("Services", new ArrayList<>());
        typeStats.put("Entities", new ArrayList<>());
        typeStats.put("DTOs", new ArrayList<>());
        typeStats.put("Others", new ArrayList<>());
        
        for (Map.Entry<String, Integer> entry : complexityScores.entrySet()) {
            String className = entry.getKey();
            Integer score = entry.getValue();
            
            if (className.endsWith("Controller")) {
                typeStats.get("Controllers").add(score);
            } else if (className.endsWith("ServiceImpl")) {
                typeStats.get("Services").add(score);
            } else if (isEntity(className)) {
                typeStats.get("Entities").add(score);
            } else if (className.endsWith("Dto") || className.endsWith("Request") || className.endsWith("Response")) {
                typeStats.get("DTOs").add(score);
            } else {
                typeStats.get("Others").add(score);
            }
        }
        
        for (Map.Entry<String, List<Integer>> entry : typeStats.entrySet()) {
            List<Integer> scores = entry.getValue();
            if (!scores.isEmpty()) {
                double avg = scores.stream().mapToInt(Integer::intValue).average().orElse(0);
                int max = scores.stream().mapToInt(Integer::intValue).max().orElse(0);
                report.append(String.format("%s - Avg: %.1f, Max: %d, Count: %d\n", 
                    entry.getKey(), avg, max, scores.size()));
            }
        }
        
        report.append("\n💡 KHUYẾN NGHỊ:\n");
        report.append("- Classes có Score > 20: Cần refactor\n");
        report.append("- Classes có Score > 15: Cần review\n");
        report.append("- Controllers không nên có logic phức tạp\n");
        report.append("- Services nên được chia nhỏ nếu quá phức tạp\n");
        
        Files.write(Paths.get("target/complexity-summary.txt"), report.toString().getBytes());
    }
    
    private static boolean isEntity(String className) {
        return Arrays.asList("User", "Article", "ForumPost", "ForumTopic", "Category", 
                           "Report", "ChatEntity", "ChatLog", "WorkoutPlan", "Topic").contains(className);
    }
}