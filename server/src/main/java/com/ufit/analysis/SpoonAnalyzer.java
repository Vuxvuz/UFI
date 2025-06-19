package com.ufit.analysis;

import spoon.Launcher;
import spoon.processing.AbstractProcessor;
import spoon.reflect.declaration.CtClass;
import spoon.reflect.declaration.CtMethod;
import spoon.reflect.declaration.CtField;
import spoon.reflect.declaration.CtAnnotation;
import spoon.reflect.declaration.CtParameter;
import spoon.reflect.code.CtStatement;
import spoon.reflect.code.CtInvocation;
import spoon.reflect.visitor.filter.TypeFilter;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Lớp chính để chạy phân tích Spoon trên code Java
 */
public class SpoonAnalyzer {
    
    public static void main(String[] args) {
        // Khởi tạo Spoon Launcher
        Launcher launcher = new Launcher();
        
        // Thiết lập đường dẫn source code
        launcher.addInputResource("src/main/java");
        
        // Thiết lập output directory
        launcher.setSourceOutputDirectory("target/spooned");
        
        // Thêm các processor tùy chỉnh
        launcher.addProcessor(new ClassAnalysisProcessor());
        launcher.addProcessor(new MethodAnalysisProcessor());
        
        // Chạy phân tích
        launcher.run();
        
        System.out.println("✅ Phân tích Spoon hoàn thành!");
        System.out.println("📁 Kết quả được lưu trong: target/spooned/");
        System.out.println("📊 Báo cáo phân tích được lưu trong: target/analysis-report.txt");
    }
}

/**
 * Processor để phân tích các lớp Java
 */
class ClassAnalysisProcessor extends AbstractProcessor<CtClass<?>> {
    private static final Map<String, Integer> classStats = new HashMap<>();
    
    @Override
    public void process(CtClass<?> ctClass) {
        String className = ctClass.getSimpleName();
        
        // Đếm số method
        int methodCount = ctClass.getMethods().size();
        
        // Đếm số field
        int fieldCount = ctClass.getFields().size();
        
        // Đếm annotation
        int annotationCount = ctClass.getAnnotations().size();
        
        // In thông tin
        System.out.println("🔍 Phân tích lớp: " + className);
        System.out.println("   - Số method: " + methodCount);
        System.out.println("   - Số field: " + fieldCount);
        System.out.println("   - Số annotation: " + annotationCount);
        
        // Lưu thống kê
        classStats.put(className, methodCount + fieldCount);
        
        // Ghi báo cáo
        writeAnalysisReport(className, methodCount, fieldCount, annotationCount);
    }
    
    private void writeAnalysisReport(String className, int methods, int fields, int annotations) {
        try {
            File reportFile = new File("target/analysis-report.txt");
            FileWriter writer = new FileWriter(reportFile, true);
            
            writer.write("=== PHÂN TÍCH LỚP: " + className + " ===\n");
            writer.write("Methods: " + methods + "\n");
            writer.write("Fields: " + fields + "\n");
            writer.write("Annotations: " + annotations + "\n");
            writer.write("Complexity Score: " + (methods + fields) + "\n");
            writer.write("-----------------------------------\n");
            
            writer.close();
        } catch (IOException e) {
            System.err.println("❌ Lỗi ghi báo cáo: " + e.getMessage());
        }
    }
}

/**
 * Processor để phân tích các method
 */
class MethodAnalysisProcessor extends AbstractProcessor<CtMethod<?>> {
    
    @Override
    public void process(CtMethod<?> method) {
        String methodName = method.getSimpleName();
        String className = method.getDeclaringType().getSimpleName();
        
        // Đếm số dòng code (statements)
        List<CtStatement> statements = method.getElements(new TypeFilter<>(CtStatement.class));
        int statementCount = statements.size();
        
        // Đếm số parameter
        int paramCount = method.getParameters().size();
        
        // Đếm method calls
        List<CtInvocation<?>> invocations = method.getElements(new TypeFilter<>(CtInvocation.class));
        int methodCallCount = invocations.size();
        
        // Chỉ in method phức tạp (> 5 statements)
        if (statementCount > 5) {
            System.out.println("🔧 Method phức tạp: " + className + "." + methodName);
            System.out.println("   - Statements: " + statementCount);
            System.out.println("   - Parameters: " + paramCount);
            System.out.println("   - Method calls: " + methodCallCount);
        }
        
        // Ghi báo cáo method phức tạp
        if (statementCount > 10) {
            writeComplexMethodReport(className, methodName, statementCount, paramCount, methodCallCount);
        }
    }
    
    private void writeComplexMethodReport(String className, String methodName, 
                                       int statements, int params, int calls) {
        try {
            File reportFile = new File("target/complex-methods-report.txt");
            FileWriter writer = new FileWriter(reportFile, true);
            
            writer.write("🚨 COMPLEX METHOD: " + className + "." + methodName + "\n");
            writer.write("Statements: " + statements + "\n");
            writer.write("Parameters: " + params + "\n");
            writer.write("Method calls: " + calls + "\n");
            writer.write("Complexity Score: " + (statements + params + calls) + "\n");
            writer.write("Recommendation: Consider refactoring\n");
            writer.write("-----------------------------------\n");
            
            writer.close();
        } catch (IOException e) {
            System.err.println("❌ Lỗi ghi báo cáo method phức tạp: " + e.getMessage());
        }
    }
}