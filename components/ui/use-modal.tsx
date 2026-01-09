"use client";

import React, { createContext, useContext, useState } from "react";

interface ModalContextType {
  openModal: (modal: { title: string; content: React.ReactNode }) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType>({
  openModal: () => {},
  closeModal: () => {},
});

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [modal, setModal] = useState<null | {
    title: string;
    content: React.ReactNode;
  }>(null);

  const closeModal = () => setModal(null);
  const openModal = (modalData: { title: string; content: React.ReactNode }) =>
    setModal(modalData);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl">
            <h2 className="text-xl font-semibold mb-4">{modal.title}</h2>
            <div>{modal.content}</div>
            <button
              className="mt-6 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
              onClick={closeModal}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
