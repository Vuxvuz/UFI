package com.ufit.analysis;

import spoon.Launcher;
import spoon.reflect.declaration.CtClass;
import spoon.reflect.declaration.CtField;
import spoon.reflect.visitor.filter.TypeFilter;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * UnifiedERDGenerator:
 * - Scans Java source root using Spoon
 * - Extracts entities (classes with fields)
 * - Detects relationships (1:1, 1:*)
 * - Generates DOT file for Graphviz
 */
public class UnifiedERDGenerator {

    /** Represents an entity with a name and fields */
    public static class Entity {
        private final String name;
        private final List<Field> fields = new ArrayList<>();
        public Entity(String name) { this.name = name; }
        public String getName() { return name; }
        public List<Field> getFields() { return fields; }
        public void addField(Field f) { fields.add(f); }
    }

    /** Represents a field of an entity */
    public static class Field {
        private final String name;
        private final String type;
        public Field(String name, String type) { this.name = name; this.type = type; }
        public String getName() { return name; }
        public String getType() { return type; }
    }

    /** Represents a relationship between two entities */
    public static class Relationship {
        private final Entity from;
        private final Entity to;
        private final String cardinality;
        public Relationship(Entity from, Entity to, String cardinality) {
            this.from = from; this.to = to; this.cardinality = cardinality;
        }
        public Entity getFrom() { return from; }
        public Entity getTo() { return to; }
        public String getCardinality() { return cardinality; }
    }

    /** Analyzes source code to extract entities */
    public Set<Entity> extractEntities(Path srcRoot) {
        Launcher launcher = new Launcher();
        launcher.addInputResource(srcRoot.toString());
        launcher.buildModel();

        Map<String, Entity> entities = new HashMap<>();
        // Use TypeFilter to get CtClass elements
        for (CtClass<?> ctClass : launcher.getModel().getElements(new TypeFilter<>(CtClass.class))) {
            if (ctClass.getFields().isEmpty()) continue;
            String name = ctClass.getSimpleName();
            Entity ent = new Entity(name);
            for (CtField<?> f : ctClass.getFields()) {
                String type = f.getType().getSimpleName();
                ent.addField(new Field(f.getSimpleName(), type));
            }
            entities.put(name, ent);
        }
        return new HashSet<>(entities.values());
    }

    /** Detects relationships based on field types */
    public Set<Relationship> extractRelationships(Set<Entity> entities) {
        Map<String, Entity> map = new HashMap<>();
        for (Entity e : entities) map.put(e.getName(), e);

        Set<Relationship> rels = new HashSet<>();
        for (Entity e : entities) {
            for (Field f : e.getFields()) {
                String type = f.getType();
                // Collection => one-to-many
                if (type.startsWith("List<") || type.startsWith("Set<")) {
                    int start = type.indexOf('<') + 1;
                    int end = type.indexOf('>');
                    if (start < end) {
                        String target = type.substring(start, end);
                        Entity to = map.get(target);
                        if (to != null) rels.add(new Relationship(e, to, "1..*"));
                    }
                } else {
                    Entity to = map.get(type);
                    if (to != null) rels.add(new Relationship(e, to, "1..1"));
                }
            }
        }
        return rels;
    }

    /** Generates DOT file for given entities & relationships */
    public void generateDot(Set<Entity> entities, Set<Relationship> rels, String output) {
        StringBuilder sb = new StringBuilder();
        sb.append("digraph ER {\n  node [shape=record];\n");
        for (Entity e : entities) {
            sb.append("  ").append(e.getName()).append(" [label=\"{")
              .append(e.getName()).append("|");
            for (Field f : e.getFields()) {
                sb.append("+ ").append(f.getName()).append(" : ").append(f.getType()).append("\\l");
            }
            sb.append("}\"];\n");
        }
        for (Relationship r : rels) {
            sb.append("  ")
              .append(r.getFrom().getName())
              .append(" -> ")
              .append(r.getTo().getName())
              .append(" [label=\"")
              .append(r.getCardinality())
              .append("\"];\n");
        }
        sb.append("}");
        try (FileWriter fw = new FileWriter(output)) {
            fw.write(sb.toString());
        } catch (IOException ex) {
            System.err.println("Lỗi ghi file DOT: " + ex.getMessage());
        }
    }

    public static void main(String[] args) {
        if (args.length != 1) {
            System.err.println("Usage: mvn exec:java -Dexec.mainClass=\"com.ufit.analysis.UnifiedERDGenerator\" -Dexec.args=\"<src-root>\"");
            System.exit(1);
        }
        Path srcRoot = Paths.get(args[0]);
        System.out.println("Scanning: " + srcRoot);

        UnifiedERDGenerator gen = new UnifiedERDGenerator();
        Set<Entity> entities = gen.extractEntities(srcRoot);
        System.out.println("Entities found: " + entities.size());

        Set<Relationship> rels = gen.extractRelationships(entities);
        System.out.println("Relationships found: " + rels.size());

        String dotFile = "er_diagram.dot";
        gen.generateDot(entities, rels, dotFile);
        System.out.println("DOT file generated: " + dotFile);
        System.out.println("Render with: dot -Tpng " + dotFile + " -o er_diagram.png");
    }
}
