import { Store } from "@tanstack/react-store";
import { DynamicField } from "@/types/types";

export interface AttributeState {
  attributes: DynamicField[];
  addAttribute: (attribute: DynamicField) => void;
  updateAttribute: (id: string, updates: Partial<DynamicField>) => void;
  deleteAttribute: (id: string) => void;
  toggleAttributeActive: (id: string) => void;
}

export function createAttributeStore(storageKey: string) {
  const getInitialAttributes = (): DynamicField[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error(
        `Failed to load attributes from localStorage (${storageKey}):`,
        e
      );
      return [];
    }
  };

  const saveAttributes = (attributes: DynamicField[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(attributes));
    } catch (e) {
      console.error(
        `Failed to save attributes to localStorage (${storageKey}):`,
        e
      );
    }
  };

  const initialState: AttributeState = {
    attributes: getInitialAttributes(),
    addAttribute: function (attribute: DynamicField): void {
      store.setState((state) => {
        const newAttributes = [...state.attributes, attribute];
        saveAttributes(newAttributes);
        return { ...state, attributes: newAttributes };
      });
    },
    updateAttribute: function (
      id: string,
      updates: Partial<DynamicField>
    ): void {
      store.setState((state) => {
        const newAttributes = state.attributes.map((attr) =>
          attr.id === id ? { ...attr, ...updates } : attr
        );
        saveAttributes(newAttributes);
        return { ...state, attributes: newAttributes };
      });
    },
    deleteAttribute: function (id: string): void {
      store.setState((state) => {
        const newAttributes = state.attributes.filter((attr) => attr.id !== id);
        saveAttributes(newAttributes);
        return { ...state, attributes: newAttributes };
      });
    },
    toggleAttributeActive: function (id: string): void {
      store.setState((state) => {
        const newAttributes = state.attributes.map((attr) =>
          attr.id === id ? { ...attr, required: !attr.required } : attr
        );
        saveAttributes(newAttributes);
        return { ...state, attributes: newAttributes };
      });
    },
  };

  const store = new Store<AttributeState>(initialState);
  return store;
}
