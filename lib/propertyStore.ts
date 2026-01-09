import { create } from "zustand";

type Property = {
  id: string;
  title: string;
  address: string;
  price: string;
  area: string;
  year: number;
  status: string;
  imageUrl: string;
};

type PropertyStore = {
  properties: Property[];
  addProperty: (property: Property) => void;
  updateProperty: (property: Property) => void;
  removeProperty: (id: string) => void;
};

export const usePropertyStore = create<PropertyStore>((set) => ({
  properties: [
    {
      id: "1",
      title: "Moderne Stadtvilla",
      address: "Musterstraße 12, 12345 Berlin",
      price: "950.000 €",
      area: "160 m²",
      year: 2019,
      status: "Verfügbar",
      imageUrl:
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    },
    {
      id: "2",
      title: "Charmantes Altbauapartment",
      address: "Beispielallee 7, 50667 Köln",
      price: "385.000 €",
      area: "85 m²",
      year: 1910,
      status: "Reserviert",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    },
  ],
  addProperty: (property) =>
    set((state) => ({ properties: [...state.properties, property] })),
  updateProperty: (updated) =>
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === updated.id ? updated : p
      ),
    })),
  removeProperty: (id) =>
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== id),
    })),
}));
