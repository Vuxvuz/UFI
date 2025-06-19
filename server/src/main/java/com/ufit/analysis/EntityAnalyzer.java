package com.ufit.analysis;

import jakarta.persistence.*;
import org.reflections.Reflections;
import org.reflections.scanners.Scanners;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Analyzes JPA entities to generate entity relationship details and Mermaid ERD diagram.
 */
public class EntityAnalyzer {

    public static void main(String[] args) {
        try {
            // Specify the package to scan for entities (update this to your entity package)
            String packageName = "com.ufit.entity"; // CHANGE THIS TO YOUR ENTITY PACKAGE
            System.out.println("Scanning for entities in package: " + packageName);

            // Find entity classes
            List<Class<?>> entityClasses = findEntityClasses(packageName);

            if (entityClasses.isEmpty()) {
                System.err.println("⚠️ No entities found in package: " + packageName);
                System.err.println("Using sample entities for demonstration.");
                entityClasses = getSampleEntities();
            } else {
                System.out.println("Found entities: " + entityClasses.stream()
                        .map(Class::getSimpleName)
                        .collect(Collectors.joining(", ")));
            }

            // Create target directory if it doesn't exist
            File targetDir = new File("target");
            if (!targetDir.exists() && !targetDir.mkdirs()) {
                throw new IOException("Failed to create target directory");
            }

            // Generate entity report and Mermaid ERD
            generateEntityReport(entityClasses);
            generateMermaidERD(entityClasses);

            System.out.println("✅ Entity analysis completed!");
            System.out.println("📊 Reports saved to:");
            System.out.println("   - target/entity-report.txt");
            System.out.println("   - target/erd-mermaid.md");
            System.out.println("📈 View ERD at https://mermaid.live/ by copying target/erd-mermaid.md content");

        } catch (Exception e) {
            System.err.println("❌ Error during entity analysis: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Finds all classes annotated with @Entity in the specified package.
     */
    private static List<Class<?>> findEntityClasses(String packageName) {
        try {
            // Use Reflections to scan for @Entity classes
            Reflections reflections = new Reflections(packageName, Scanners.TypesAnnotated);
            Set<Class<?>> entities = reflections.getTypesAnnotatedWith(Entity.class);
            return entities.stream()
                    .filter(cls -> cls.isAnnotationPresent(Entity.class))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("⚠️ Failed to scan package " + packageName + ": " + e.getMessage());
            // Fallback: Add your entity classes manually here if Reflections fails
            List<Class<?>> manualEntities = new ArrayList<>();
            // Example: manualEntities.add(com.ufit.entity.User.class);
            // manualEntities.add(com.ufit.entity.Profile.class);
            return manualEntities;
        }
    }

    /**
     * Provides sample entities for testing if no real entities are found.
     */
    private static List<Class<?>> getSampleEntities() {
        // Inline sample entities for demonstration
        List<Class<?>> sampleEntities = new ArrayList<>();
        sampleEntities.add(SampleUser.class);
        sampleEntities.add(SampleProfile.class);
        return sampleEntities;
    }

    /**
     * Generates a detailed entity report with fields and relationships.
     */
    private static void generateEntityReport(List<Class<?>> entityClasses) throws IOException {
        File reportFile = new File("target/entity-report.txt");
        try (FileWriter writer = new FileWriter(reportFile)) {
            writer.write("# Entity Relationship Report\n\n");

            for (Class<?> cls : entityClasses) {
                String tableName = getTableName(cls);
                writer.write("## Entity: " + cls.getSimpleName() + " (Table: " + tableName + ")\n");

                // Analyze fields
                writer.write("### Fields\n");
                writer.write("| Column | Type | PK | FK | Nullable | Unique | Length |\n");
                writer.write("|--------|------|----|----|----------|--------|--------|\n");

                for (Field field : cls.getDeclaredFields()) {
                    String columnInfo = analyzeField(field);
                    if (!columnInfo.isEmpty()) {
                        writer.write(columnInfo + "\n");
                    }
                }

                // Analyze relationships
                writer.write("\n### Relationships\n");
                writer.write("| Type | From Table | To Table | Field | Foreign Key | Cascade | Fetch |\n");
                writer.write("|------|------------|----------|-------|-------------|---------|-------|\n");

                for (Field field : cls.getDeclaredFields()) {
                    String relationshipInfo = analyzeRelationship(cls, field);
                    if (!relationshipInfo.isEmpty()) {
                        writer.write(relationshipInfo + "\n");
                    }
                }

                writer.write("\n");
            }
        }
    }

    /**
     * Generates a Mermaid ERD diagram.
     */
    private static void generateMermaidERD(List<Class<?>> entityClasses) throws IOException {
        File mermaidFile = new File("target/erd-mermaid.md");
        try (FileWriter writer = new FileWriter(mermaidFile)) {
            writer.write("# Entity Relationship Diagram\n\n");
            writer.write("```mermaid\n");
            writer.write("erDiagram\n");

            // Generate entities
            for (Class<?> cls : entityClasses) {
                String tableName = getTableName(cls).toUpperCase();
                writer.write("    " + tableName + " {\n");
                for (Field field : cls.getDeclaredFields()) {
                    String columnInfo = generateMermaidColumnInfo(field);
                    if (!columnInfo.isEmpty()) {
                        writer.write("        " + columnInfo + "\n");
                    }
                }
                writer.write("    }\n");
            }

            // Generate relationships
            for (Class<?> cls : entityClasses) {
                String fromTable = getTableName(cls);
                for (Field field : cls.getDeclaredFields()) {
                    String relationshipInfo = generateMermaidRelationship(fromTable, field);
                    if (!relationshipInfo.isEmpty()) {
                        writer.write("    " + relationshipInfo + "\n");
                    }
                }
            }

            writer.write("```\n");
            writer.write("\n## Legend\n");
            writer.write("- **PK**: Primary Key\n");
            writer.write("- **FK**: Foreign Key\n");
            writer.write("- **UK**: Unique Key\n");
            writer.write("\n## Relationship Types\n");
            writer.write("- `||--||`: One-to-One\n");
            writer.write("- `||--o{`: One-to-Many\n");
            writer.write("- `}o--||`: Many-to-One\n");
            writer.write("- `}o--o{`: Many-to-Many\n");
        }
    }

    /**
     * Gets the table name from @Table or class name.
     */
    private static String getTableName(Class<?> cls) {
        Table table = cls.getAnnotation(Table.class);
        if (table != null && !table.name().isEmpty()) {
            return table.name();
        }
        return camelToSnakeCase(cls.getSimpleName());
    }

    /**
     * Converts camelCase to snake_case.
     */
    private static String camelToSnakeCase(String camelCase) {
        return camelCase.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }

    /**
     * Analyzes a field to extract column details.
     */
    private static String analyzeField(Field field) {
        Column column = field.getAnnotation(Column.class);
        Id id = field.getAnnotation(Id.class);
        JoinColumn joinColumn = field.getAnnotation(JoinColumn.class);

        String columnName = column != null && !column.name().isEmpty() ? column.name() : camelToSnakeCase(field.getName());
        String type = mapJavaTypeToSQLType(field.getType().getSimpleName());
        boolean isPK = id != null;
        boolean isFK = joinColumn != null || field.isAnnotationPresent(ManyToOne.class) || field.isAnnotationPresent(OneToOne.class);
        boolean isNullable = column != null ? column.nullable() : !isPK;
        boolean isUnique = column != null && column.unique();
        String length = column != null && column.length() != 255 ? String.valueOf(column.length()) : "255";

        return String.format("| %-15s | %-10s | %-2s | %-2s | %-8s | %-6s | %-6s |",
                columnName, type,
                isPK ? "Y" : "N",
                isFK ? "Y" : "N",
                isNullable ? "Y" : "N",
                isUnique ? "Y" : "N",
                length);
    }

    /**
     * Analyzes a field to extract relationship details.
     */
    private static String analyzeRelationship(Class<?> cls, Field field) {
        String fromTable = getTableName(cls);
        String fieldName = field.getName();
        String toTable = getRelatedTable(field);
        if (toTable == null) {
            return "";
        }

        String type = "";
        String foreignKey = "";
        String cascade = "NONE";
        String fetch = "DEFAULT";

        if (field.isAnnotationPresent(OneToOne.class)) {
            type = "1:1";
            foreignKey = getForeignKey(field);
            OneToOne oneToOne = field.getAnnotation(OneToOne.class);
            cascade = Arrays.toString(oneToOne.cascade());
            fetch = oneToOne.fetch().toString();
        } else if (field.isAnnotationPresent(OneToMany.class)) {
            type = "1:N";
            OneToMany oneToMany = field.getAnnotation(OneToMany.class);
            foreignKey = oneToMany.mappedBy().isEmpty() ? "N/A" : "mappedBy: " + oneToMany.mappedBy();
            cascade = Arrays.toString(oneToMany.cascade());
            fetch = oneToMany.fetch().toString();
        } else if (field.isAnnotationPresent(ManyToOne.class)) {
            type = "N:1";
            foreignKey = getForeignKey(field);
            ManyToOne manyToOne = field.getAnnotation(ManyToOne.class);
            cascade = Arrays.toString(manyToOne.cascade());
            fetch = manyToOne.fetch().toString();
        } else if (field.isAnnotationPresent(ManyToMany.class)) {
            type = "N:N";
            JoinTable joinTable = field.getAnnotation(JoinTable.class);
            foreignKey = joinTable != null && !joinTable.name().isEmpty() ? "JoinTable: " + joinTable.name() : "N/A";
            ManyToMany manyToMany = field.getAnnotation(ManyToMany.class);
            cascade = Arrays.toString(manyToMany.cascade());
            fetch = manyToMany.fetch().toString();
        } else {
            return "";
        }

        return String.format("| %-6s | %-15s | %-15s | %-10s | %-15s | %-15s | %-10s |",
                type, fromTable, toTable, fieldName, foreignKey, cascade, fetch);
    }

    /**
     * Generates Mermaid column info for a field.
     */
    private static String generateMermaidColumnInfo(Field field) {
        Column column = field.getAnnotation(Column.class);
        Id id = field.getAnnotation(Id.class);
        JoinColumn joinColumn = field.getAnnotation(JoinColumn.class);

        String columnName = column != null && !column.name().isEmpty() ? column.name() : camelToSnakeCase(field.getName());
        String type = mapJavaTypeToSQLType(field.getType().getSimpleName());
        boolean isPK = id != null;
        boolean isFK = joinColumn != null || field.isAnnotationPresent(ManyToOne.class) || field.isAnnotationPresent(OneToOne.class);
        boolean isUnique = column != null && column.unique();

        StringBuilder info = new StringBuilder();
        info.append(type).append(" ").append(columnName);
        if (isPK) {
            info.append(" PK");
        }
        if (isFK) {
            info.append(" FK");
        }
        if (isUnique && !isPK) {
            info.append(" UK");
        }
        return info.toString();
    }

    /**
     * Generates Mermaid relationship info for a field.
     */
    private static String generateMermaidRelationship(String fromTable, Field field) {
        String toTable = getRelatedTable(field);
        if (toTable == null) {
            return "";
        }

        fromTable = fromTable.toUpperCase();
        toTable = toTable.toUpperCase();

        if (field.isAnnotationPresent(OneToOne.class)) {
            return fromTable + " ||--|| " + toTable + " : \"one-to-one\"";
        } else if (field.isAnnotationPresent(OneToMany.class)) {
            return fromTable + " ||--o{ " + toTable + " : \"one-to-many\"";
        } else if (field.isAnnotationPresent(ManyToOne.class)) {
            return fromTable + " }o--|| " + toTable + " : \"many-to-one\"";
        } else if (field.isAnnotationPresent(ManyToMany.class)) {
            return fromTable + " }o--o{ " + toTable + " : \"many-to-many\"";
        }
        return "";
    }

    /**
     * Gets the foreign key column name for a field.
     */
    private static String getForeignKey(Field field) {
        JoinColumn joinColumn = field.getAnnotation(JoinColumn.class);
        if (joinColumn != null && !joinColumn.name().isEmpty()) {
            return joinColumn.name();
        }
        return camelToSnakeCase(field.getName()) + "_id";
    }

    /**
     * Gets the related table name for a relationship field.
     */
    private static String getRelatedTable(Field field) {
        Class<?> fieldType = field.getType();
        if (field.isAnnotationPresent(OneToMany.class) || field.isAnnotationPresent(ManyToMany.class)) {
            // Extract generic type from collections (e.g., List<User> -> User)
            String typeName = field.getGenericType().getTypeName();
            int start = typeName.indexOf('<') + 1;
            int end = typeName.indexOf('>');
            if (start > 0 && end > start) {
                try {
                    String className = typeName.substring(start, end);
                    fieldType = Class.forName(className);
                } catch (ClassNotFoundException e) {
                    System.err.println("⚠️ Could not find related class for field " + field.getName() + ": " + e.getMessage());
                    return null;
                }
            }
        }
        if (fieldType.isAnnotationPresent(Entity.class)) {
            return getTableName(fieldType);
        }
        return null;
    }

    /**
     * Maps Java types to SQL types.
     */
    private static String mapJavaTypeToSQLType(String javaType) {
        Map<String, String> typeMapping = new HashMap<>();
        typeMapping.put("String", "VARCHAR");
        typeMapping.put("Integer", "INT");
        typeMapping.put("int", "INT");
        typeMapping.put("Long", "BIGINT");
        typeMapping.put("long", "BIGINT");
        typeMapping.put("Double", "DOUBLE");
        typeMapping.put("double", "DOUBLE");
        typeMapping.put("Float", "FLOAT");
        typeMapping.put("float", "FLOAT");
        typeMapping.put("Boolean", "BOOLEAN");
        typeMapping.put("boolean", "BOOLEAN");
        typeMapping.put("Date", "DATETIME");
        typeMapping.put("LocalDate", "DATE");
        typeMapping.put("LocalDateTime", "DATETIME");
        typeMapping.put("Timestamp", "TIMESTAMP");
        typeMapping.put("BigDecimal", "DECIMAL");
        return typeMapping.getOrDefault(javaType, "VARCHAR");
    }

    // Sample entities for testing
    @Entity
    @Table(name = "users")
    static class SampleUser {
        @Id
        @Column(name = "user_id")
        private Long id;

        @Column(nullable = false, unique = true)
        private String email;

        @OneToOne
        @JoinColumn(name = "profile_id")
        private SampleProfile profile;

        @OneToMany(mappedBy = "user")
        private List<SampleOrder> orders;
    }

    @Entity
    @Table(name = "profiles")
    static class SampleProfile {
        @Id
        @Column(name = "profile_id")
        private Long id;

        @Column
        private String bio;
    }

    @Entity
    @Table(name = "orders")
    static class SampleOrder {
        @Id
        @Column(name = "order_id")
        private Long id;

        @ManyToOne
        @JoinColumn(name = "user_id")
        private SampleUser user;
    }
}