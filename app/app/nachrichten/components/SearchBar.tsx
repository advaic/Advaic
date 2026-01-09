// app/nachrichten/components/SearchBar.tsx

export default function SearchBar() {
  return (
    <div>
      <input
        type="text"
        placeholder="Suche nach Name oder Stichwort..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-500"
      />
    </div>
  );
}
