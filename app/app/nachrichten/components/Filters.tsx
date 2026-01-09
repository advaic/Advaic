// app/nachrichten/components/Filters.tsx

export default function Filters() {
  return (
    <div className="flex space-x-4">
      <button className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm">
        Alle
      </button>
      <button className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm">
        Offen
      </button>
      <button className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm">
        Eskaliert
      </button>
    </div>
  );
}
