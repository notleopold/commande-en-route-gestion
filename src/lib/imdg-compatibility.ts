// IMDG Dangerous Goods Compatibility Rules

export interface IMDGCompatibilityRule {
  class: string;
  incompatibleWith: string[];
  description: string;
}

export const IMDG_COMPATIBILITY_RULES: IMDGCompatibilityRule[] = [
  {
    class: "Classe 1",
    incompatibleWith: ["Classe 2.1", "Classe 2.2", "Classe 2.3", "Classe 3", "Classe 4.1", "Classe 4.2", "Classe 4.3", "Classe 5.1", "Classe 5.2", "Classe 6.1", "Classe 6.2", "Classe 7", "Classe 8", "Classe 9"],
    description: "Explosifs - Incompatibles avec toutes les autres classes"
  },
  {
    class: "Classe 2.1",
    incompatibleWith: ["Classe 1", "Classe 5.1", "Classe 5.2", "Classe 6.1", "Classe 6.2", "Classe 8", "Classe 7"],
    description: "Gaz inflammables"
  },
  {
    class: "Classe 2.2",
    incompatibleWith: [],
    description: "Gaz non inflammables, non toxiques - Compatible avec la plupart des classes"
  },
  {
    class: "Classe 2.3",
    incompatibleWith: ["Classe 1", "Classe 5.1", "Classe 6.1", "Classe 6.2", "Classe 8"],
    description: "Gaz toxiques"
  },
  {
    class: "Classe 3",
    incompatibleWith: ["Classe 1", "Classe 5.1", "Classe 5.2", "Classe 6.1", "Classe 8"],
    description: "Liquides inflammables"
  },
  {
    class: "Classe 4.1",
    incompatibleWith: ["Classe 1", "Classe 5.1", "Classe 5.2", "Classe 6.1", "Classe 8"],
    description: "Solides inflammables"
  },
  {
    class: "Classe 4.2",
    incompatibleWith: ["Classe 1", "Classe 3", "Classe 4.1", "Classe 4.3", "Classe 5.1", "Classe 5.2", "Classe 6.1", "Classe 8"],
    description: "Matières auto-inflammables"
  },
  {
    class: "Classe 4.3",
    incompatibleWith: ["Classe 1", "Classe 3", "Classe 5.1", "Classe 5.2", "Classe 6.1", "Classe 8"],
    description: "Réagissant dangereusement à l'eau"
  },
  {
    class: "Classe 5.1",
    incompatibleWith: ["Classe 1", "Classe 2.1", "Classe 3", "Classe 4.1", "Classe 4.2", "Classe 4.3", "Classe 5.2", "Classe 6.1", "Classe 8"],
    description: "Comburants (favorisent le feu)"
  },
  {
    class: "Classe 5.2",
    incompatibleWith: ["Classe 1", "Classe 2.1", "Classe 3", "Classe 4.1", "Classe 4.2", "Classe 4.3", "Classe 5.1", "Classe 6.1", "Classe 8"],
    description: "Peroxydes organiques - Extrêmement instables"
  },
  {
    class: "Classe 6.1",
    incompatibleWith: ["Classe 1", "Classe 2.1", "Classe 2.3", "Classe 3", "Classe 4.1", "Classe 4.2", "Classe 4.3", "Classe 5.1", "Classe 5.2", "Classe 8"],
    description: "Substances toxiques"
  },
  {
    class: "Classe 6.2",
    incompatibleWith: ["Classe 1", "Classe 2.1", "Classe 2.3", "Classe 3", "Classe 4.1", "Classe 4.2", "Classe 4.3", "Classe 5.1", "Classe 5.2", "Classe 6.1", "Classe 7", "Classe 8", "Classe 9"],
    description: "Substances infectieuses - Toujours isoler"
  },
  {
    class: "Classe 7",
    incompatibleWith: ["Classe 1", "Classe 2.1", "Classe 6.2"],
    description: "Radioactifs - Transport spécial"
  },
  {
    class: "Classe 8",
    incompatibleWith: ["Classe 1", "Classe 2.1", "Classe 2.3", "Classe 3", "Classe 4.1", "Classe 4.2", "Classe 4.3", "Classe 5.1", "Classe 5.2", "Classe 6.1", "Classe 6.2"],
    description: "Corrosifs"
  },
  {
    class: "Classe 9",
    incompatibleWith: ["Classe 1", "Classe 5.1"],
    description: "Divers - Vérifier au cas par cas (Lithium = à éloigner des classes 1 et 5.1)"
  }
];

/**
 * Check if two IMDG classes are compatible
 */
export function areIMDGClassesCompatible(class1: string, class2: string): boolean {
  if (!class1 || !class2) return true; // Non-dangerous goods are always compatible
  
  const rule1 = IMDG_COMPATIBILITY_RULES.find(rule => rule.class === class1);
  const rule2 = IMDG_COMPATIBILITY_RULES.find(rule => rule.class === class2);
  
  if (!rule1 || !rule2) return true; // If rules not found, assume compatible
  
  return !rule1.incompatibleWith.includes(class2) && !rule2.incompatibleWith.includes(class1);
}

/**
 * Get incompatible classes for a given IMDG class
 */
export function getIncompatibleClasses(imdgClass: string): string[] {
  const rule = IMDG_COMPATIBILITY_RULES.find(rule => rule.class === imdgClass);
  return rule ? rule.incompatibleWith : [];
}

/**
 * Check if a list of IMDG classes can be loaded together
 */
export function checkContainerCompatibility(imdgClasses: (string | null | undefined)[]): {
  compatible: boolean;
  conflicts: Array<{ class1: string; class2: string; description: string }>;
} {
  const validClasses = imdgClasses.filter(Boolean) as string[];
  const conflicts: Array<{ class1: string; class2: string; description: string }> = [];
  
  for (let i = 0; i < validClasses.length; i++) {
    for (let j = i + 1; j < validClasses.length; j++) {
      const class1 = validClasses[i];
      const class2 = validClasses[j];
      
      if (!areIMDGClassesCompatible(class1, class2)) {
        const rule1 = IMDG_COMPATIBILITY_RULES.find(rule => rule.class === class1);
        const rule2 = IMDG_COMPATIBILITY_RULES.find(rule => rule.class === class2);
        
        conflicts.push({
          class1,
          class2,
          description: `${rule1?.description || class1} incompatible avec ${rule2?.description || class2}`
        });
      }
    }
  }
  
  return {
    compatible: conflicts.length === 0,
    conflicts
  };
}