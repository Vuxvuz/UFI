package com.ufit.analysis;

import spoon.Launcher;
import spoon.processing.AbstractProcessor;
import spoon.reflect.declaration.*;
import spoon.reflect.reference.CtTypeReference;
import spoon.reflect.code.CtFieldRead;
import spoon.reflect.code.CtInvocation;
import spoon.reflect.visitor.filter.TypeFilter;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Phân tích mối quan hệ giữa các class để tạo class diagram và ERD
 */
public class RelationshipAnalyzer {
    
    public static void main(String[] args) {
        // Tạo target directory nếu chưa tồn tại
        File targetDir = new File("target");
        if (!targetDir.exists()) {
            targetDir.mkdirs();
        }
        
        // Xóa các file báo cáo cũ
        clearOldReports();
        
        Launcher launcher = new Launcher();
        launcher.addInputResource("src/main/java");
        launcher.setSourceOutputDirectory("target/spooned");
        
        // Thêm các processor phân tích mối quan hệ với tên unique
        launcher.addProcessor(new ClassInheritanceProcessor());
        launcher.addProcessor(new ClassAssociationProcessor());
        launcher.addProcessor(new ClassDependencyProcessor());
        launcher.addProcessor(new JpaEntityProcessor());
        
        try {
            launcher.run();
            
            System.out.println("✅ Phân tích mối quan hệ hoàn thành!");
            System.out.println("📊 Báo cáo được lưu trong:");
            System.out.println("   - target/inheritance-report.txt");
            System.out.println("   - target/association-report.txt");
            System.out.println("   - target/dependency-report.txt");
            System.out.println("   - target/entity-relationship-report.txt");
            System.out.println("   - target/class-diagram-data.plantuml");
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi chạy phân tích: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static void clearOldReports() {
        String[] reportFiles = {
            "target/inheritance-report.txt",
            "target/association-report.txt", 
            "target/dependency-report.txt",
            "target/entity-relationship-report.txt",
            "target/class-diagram-data.plantuml"
        };
        
        for (String filename : reportFiles) {
            File file = new File(filename);
            if (file.exists()) {
                file.delete();
            }
        }
    }
}

/**
 * Phân tích quan hệ kế thừa (Inheritance) và implement interface
 */
class ClassInheritanceProcessor extends AbstractProcessor<CtClass<?>> {
    
    @Override
    public void process(CtClass<?> ctClass) {
        try {
            String className = ctClass.getQualifiedName();
            if (className == null || className.startsWith("java.") || className.startsWith("javax.")) {
                return;
            }
            
            // Phân tích superclass (extends)
            CtTypeReference<?> superClass = ctClass.getSuperclass();
            if (superClass != null && !superClass.getQualifiedName().equals("java.lang.Object")) {
                writeInheritanceReport(className, superClass.getQualifiedName(), "EXTENDS");
            }
            
            // Phân tích interfaces (implements)
            Set<CtTypeReference<?>> interfaces = ctClass.getSuperInterfaces();
            for (CtTypeReference<?> interfaceRef : interfaces) {
                writeInheritanceReport(className, interfaceRef.getQualifiedName(), "IMPLEMENTS");
            }
        } catch (Exception e) {
            System.err.println("❌ Lỗi xử lý inheritance cho class " + ctClass.getSimpleName() + ": " + e.getMessage());
        }
    }
    
    private void writeInheritanceReport(String childClass, String parentClass, String relationshipType) {
        try {
            File reportFile = new File("target/inheritance-report.txt");
            try (FileWriter writer = new FileWriter(reportFile, true)) {
                writer.write(relationshipType + ": " + childClass + " -> " + parentClass + "\n");
            }
        } catch (IOException e) {
            System.err.println("❌ Lỗi ghi báo cáo inheritance: " + e.getMessage());
        }
    }
}

/**
 * Phân tích quan hệ Association (có field của class khác)
 */
class ClassAssociationProcessor extends AbstractProcessor<CtClass<?>> {
    
    @Override
    public void process(CtClass<?> ctClass) {
        try {
            String className = ctClass.getQualifiedName();
            if (className == null || className.startsWith("java.") || className.startsWith("javax.")) {
                return;
            }
            
            // Phân tích các field
            for (CtField<?> field : ctClass.getFields()) {
                CtTypeReference<?> fieldType = field.getType();
                String fieldTypeName = fieldType.getQualifiedName();
                
                // Bỏ qua primitive types và java standard library
                if (!isPrimitiveOrStandardLibrary(fieldTypeName)) {
                    String cardinality = getCardinality(fieldType);
                    writeAssociationReport(className, fieldTypeName, field.getSimpleName(), cardinality);
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Lỗi xử lý association cho class " + ctClass.getSimpleName() + ": " + e.getMessage());
        }
    }
    
    private boolean isPrimitiveOrStandardLibrary(String typeName) {
        return typeName.startsWith("java.") || 
               typeName.startsWith("javax.") ||
               typeName.equals("int") || typeName.equals("long") || 
               typeName.equals("double") || typeName.equals("boolean") ||
               typeName.equals("String") || typeName.equals("void");
    }
    
    private String getCardinality(CtTypeReference<?> fieldType) {
        String typeName = fieldType.getQualifiedName();
        if (typeName.contains("List") || typeName.contains("Set") || 
            typeName.contains("Collection") || typeName.endsWith("[]")) {
            return "1..*";
        }
        return "1..1";
    }
    
    private void writeAssociationReport(String fromClass, String toClass, String fieldName, String cardinality) {
        try {
            File reportFile = new File("target/association-report.txt");
            try (FileWriter writer = new FileWriter(reportFile, true)) {
                writer.write("ASSOCIATION: " + fromClass + " -> " + toClass + 
                            " [field: " + fieldName + ", cardinality: " + cardinality + "]\n");
            }
        } catch (IOException e) {
            System.err.println("❌ Lỗi ghi báo cáo association: " + e.getMessage());
        }
    }
}

/**
 * Phân tích quan hệ Dependency (sử dụng class khác trong method)
 */
class ClassDependencyProcessor extends AbstractProcessor<CtMethod<?>> {
    
    @Override
    public void process(CtMethod<?> method) {
        try {
            CtType<?> declaringType = method.getDeclaringType();
            if (declaringType == null) return;
            
            String className = declaringType.getQualifiedName();
            if (className == null || className.startsWith("java.") || className.startsWith("javax.")) {
                return;
            }
            
            // Phân tích parameters
            for (CtParameter<?> param : method.getParameters()) {
                String paramType = param.getType().getQualifiedName();
                if (!isPrimitiveOrStandardLibrary(paramType)) {
                    writeDependencyReport(className, paramType, "PARAMETER");
                }
            }
            
            // Phân tích return type
            CtTypeReference<?> returnType = method.getType();
            if (returnType != null) {
                String returnTypeName = returnType.getQualifiedName();
                if (!isPrimitiveOrStandardLibrary(returnTypeName) && !returnTypeName.equals(className)) {
                    writeDependencyReport(className, returnTypeName, "RETURN_TYPE");
                }
            }
            
            // Phân tích method calls
            List<CtInvocation<?>> invocations = method.getElements(new TypeFilter<>(CtInvocation.class));
            for (CtInvocation<?> invocation : invocations) {
                if (invocation.getTarget() != null && invocation.getTarget().getType() != null) {
                    String targetType = invocation.getTarget().getType().getQualifiedName();
                    if (!isPrimitiveOrStandardLibrary(targetType) && !targetType.equals(className)) {
                        writeDependencyReport(className, targetType, "METHOD_CALL");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Lỗi xử lý dependency cho method " + method.getSimpleName() + ": " + e.getMessage());
        }
    }
    
    private boolean isPrimitiveOrStandardLibrary(String typeName) {
        return typeName.startsWith("java.") || 
               typeName.startsWith("javax.") ||
               typeName.equals("int") || typeName.equals("long") || 
               typeName.equals("double") || typeName.equals("boolean") ||
               typeName.equals("String") || typeName.equals("void");
    }
    
    private void writeDependencyReport(String fromClass, String toClass, String dependencyType) {
        try {
            File reportFile = new File("target/dependency-report.txt");
            try (FileWriter writer = new FileWriter(reportFile, true)) {
                writer.write("DEPENDENCY: " + fromClass + " -> " + toClass + " [" + dependencyType + "]\n");
            }
        } catch (IOException e) {
            System.err.println("❌ Lỗi ghi báo cáo dependency: " + e.getMessage());
        }
    }
}

/**
 * Phân tích Entity Relationship (dành cho JPA entities)
 */
class JpaEntityProcessor extends AbstractProcessor<CtClass<?>> {
    
    @Override
    public void process(CtClass<?> ctClass) {
        try {
            String className = ctClass.getQualifiedName();
            if (className == null || className.startsWith("java.") || className.startsWith("javax.")) {
                return;
            }
            
            // Kiểm tra xem có phải là JPA Entity không
            boolean isEntity = ctClass.getAnnotations().stream()
                .anyMatch(ann -> ann.getAnnotationType().getSimpleName().equals("Entity"));
                
            if (!isEntity) return;
            
            String entityName = ctClass.getSimpleName();
            
            // Phân tích các field có annotation JPA
            for (CtField<?> field : ctClass.getFields()) {
                analyzeJPAAnnotations(entityName, field);
            }
            
            // Tạo PlantUML class diagram
            generatePlantUMLDiagram(ctClass);
        } catch (Exception e) {
            System.err.println("❌ Lỗi xử lý JPA entity " + ctClass.getSimpleName() + ": " + e.getMessage());
        }
    }
    
    private void analyzeJPAAnnotations(String entityName, CtField<?> field) {
        try {
            String fieldName = field.getSimpleName();
            String fieldType = field.getType().getSimpleName();
            
            for (CtAnnotation<?> annotation : field.getAnnotations()) {
                String annotationName = annotation.getAnnotationType().getSimpleName();
                
                switch (annotationName) {
                    case "OneToOne":
                        writeERReport(entityName, fieldType, fieldName, "1:1");
                        break;
                    case "OneToMany":
                        writeERReport(entityName, fieldType, fieldName, "1:N");
                        break;
                    case "ManyToOne":
                        writeERReport(entityName, fieldType, fieldName, "N:1");
                        break;
                    case "ManyToMany":
                        writeERReport(entityName, fieldType, fieldName, "N:N");
                        break;
                    case "JoinColumn":
                        writeERReport(entityName, fieldType, fieldName, "FK");
                        break;
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Lỗi phân tích JPA annotation: " + e.getMessage());
        }
    }
    
    private void writeERReport(String fromEntity, String toEntity, String fieldName, String relationship) {
        try {
            File reportFile = new File("target/entity-relationship-report.txt");
            try (FileWriter writer = new FileWriter(reportFile, true)) {
                writer.write("ER: " + fromEntity + " -> " + toEntity + 
                            " [field: " + fieldName + ", relationship: " + relationship + "]\n");
            }
        } catch (IOException e) {
            System.err.println("❌ Lỗi ghi báo cáo ER: " + e.getMessage());
        }
    }
    
    private void generatePlantUMLDiagram(CtClass<?> ctClass) {
        try {
            File plantUMLFile = new File("target/class-diagram-data.plantuml");
            try (FileWriter writer = new FileWriter(plantUMLFile, true)) {
                String className = ctClass.getSimpleName();
                writer.write("class " + className + " {\n");
                
                // Thêm fields
                for (CtField<?> field : ctClass.getFields()) {
                    String visibility = field.isPrivate() ? "-" : field.isPublic() ? "+" : "#";
                    writer.write("  " + visibility + field.getSimpleName() + " : " + field.getType().getSimpleName() + "\n");
                }
                
                writer.write("  --\n");
                
                // Thêm methods (chỉ public methods)
                for (CtMethod<?> method : ctClass.getMethods()) {
                    if (method.isPublic() && !method.getSimpleName().startsWith("get") && 
                        !method.getSimpleName().startsWith("set")) {
                        writer.write("  +" + method.getSimpleName() + "()\n");
                    }
                }
                
                writer.write("}\n\n");
            }
        } catch (IOException e) {
            System.err.println("❌ Lỗi tạo PlantUML diagram: " + e.getMessage());
        }
    }
}