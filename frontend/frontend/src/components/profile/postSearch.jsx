import { FaSearch, FaTimes } from "react-icons/fa";

export default function PostSearch({
  searchTerm = "",
  onSearchChange,
}) {
  const handleChange = (event) => {
    if (onSearchChange) {
      onSearchChange(event.target.value);
    }
  };

  const handleClear = () => {
    if (onSearchChange) {
      onSearchChange("");
    }
  };

  return (
    <div className="w-full mb-4">
      <div className="flex items-center gap-3 rounded-lg border border-gray-300 bg-black px-4 py-3 shadow-sm focus-within:border-red-500">
        <FaSearch className="text-gray-400" />

        <input
          type="search"
          value={searchTerm}
          onChange={handleChange}
          placeholder="Search content"
          aria-label="Search your posts"
          className="w-full bg-transparent text-gray-800 outline-none placeholder:text-gray-400"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="text-gray-500 hover:text-red-600"
          >
            <FaTimes />
          </button>
        )}
      </div>
    </div>
  );
};